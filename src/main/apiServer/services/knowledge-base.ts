import type {
	KnowledgeBase,
	KnowledgeBaseParams,
	KnowledgeSearchResult,
	Model,
} from "@types";
import KnowledgeService from "../../services/KnowledgeService";
import { loggerService } from "../../services/LoggerService";
import { getProviderByModel } from "../utils";

const logger = loggerService.withContext("ApiServerKnowledgeBase");

export class KnowledgeBaseService {
	/**
	 * Convert Model to ApiClient by looking up provider configuration
	 */
	private async modelToApiClient(model: Model): Promise<{
		model: string;
		provider: string;
		apiKey: string;
		baseURL: string;
	} | null> {
		try {
			// Check if model exists
			if (!model) {
				logger.error(`Model is null or undefined`);
				return null;
			}

			// DEBUG: Log the entire model object
			logger.info(`[DEBUG] Model object received:`, {
				id: model.id,
				provider: model.provider,
				name: model.name,
				fullModel: JSON.stringify(model),
			});

			// Extract provider from model
			// If model.provider is missing, try to extract from model.id (format: "provider:model_id")
			let providerId = model.provider;
			let modelId = model.id;

			if (!providerId) {
				// Try to extract provider from model.id if it contains ":"
				if (model.id && model.id.includes(":")) {
					const parts = model.id.split(":");
					providerId = parts[0];
					modelId = parts.slice(1).join(":");
					logger.warn(`Model missing provider field, extracted from id:`, {
						originalId: model.id,
						extractedProvider: providerId,
						extractedModelId: modelId,
					});
				} else {
					logger.error(`Model missing provider field and id format invalid:`, {
						modelId: model.id,
						modelName: model.name,
					});
					return null;
				}
			}

			// Format: "provider:model_id"
			const fullModelId = `${providerId}:${modelId}`;

			logger.info(`Converting model to ApiClient:`, {
				modelId: model.id,
				provider: providerId,
				fullModelId,
			});

			const provider = await getProviderByModel(fullModelId);

			if (!provider) {
				logger.warn(
					`Provider not found for model: ${model.id}, provider: ${model.provider}`,
				);
				return null;
			}

			logger.info(`Found provider:`, {
				providerId: provider.id,
				hasApiKey: !!provider.apiKey,
				apiHost: provider.apiHost,
			});

			// Ensure baseURL has /v1 suffix for OpenAI-compatible APIs
			let baseURL = provider.apiHost || "";
			if (baseURL && !baseURL.endsWith("/v1") && !baseURL.includes("/v1/")) {
				baseURL = `${baseURL}/v1`;
			}

			logger.info(`Using baseURL for embedding:`, { baseURL });

			return {
				model: modelId, // Use extracted modelId (without provider prefix)
				provider: provider.id,
				apiKey: provider.apiKey || "",
				baseURL,
			};
		} catch (error) {
			logger.error(`Failed to convert model to ApiClient:`, error as Error);
			return null;
		}
	} /**
	 * Convert KnowledgeBase to KnowledgeBaseParams
	 * This extracts the minimal required parameters for knowledge base operations
	 */
	private async toKnowledgeBaseParams(
		base: KnowledgeBase,
	): Promise<KnowledgeBaseParams | null> {
		// DEBUG: Log the knowledge base object
		logger.info(`[DEBUG] Knowledge base object:`, {
			id: base.id,
			name: base.name,
			hasModel: !!base.model,
			modelType: typeof base.model,
			model: base.model ? JSON.stringify(base.model) : "null",
		});

		const embedApiClient = await this.modelToApiClient(base.model);
		if (!embedApiClient) {
			logger.error(
				`Failed to create embed API client for knowledge base: ${base.id}`,
			);
			return null;
		}

		let rerankApiClient:
			| { model: string; provider: string; apiKey: string; baseURL: string }
			| undefined;
		if (base.rerankModel) {
			const client = await this.modelToApiClient(base.rerankModel);
			if (client) {
				rerankApiClient = client;
			}
		}

		return {
			id: base.id,
			dimensions: base.dimensions,
			chunkSize: base.chunkSize,
			chunkOverlap: base.chunkOverlap,
			embedApiClient,
			rerankApiClient,
			preprocessProvider: base.preprocessProvider,
		};
	}

	/**
	 * Search knowledge base by assistant configuration
	 * @param query - The search query
	 * @param knowledgeBases - Knowledge base configurations from assistant
	 * @returns Search results from all configured knowledge bases
	 */
	async search(
		query: string,
		knowledgeBases: KnowledgeBase[],
	): Promise<KnowledgeSearchResult[]> {
		if (!knowledgeBases || knowledgeBases.length === 0) {
			logger.debug("No knowledge bases configured");
			return [];
		}

		try {
			logger.info(
				`Searching ${knowledgeBases.length} knowledge base(s) for query: "${query}"`,
			);

			// Search all knowledge bases in parallel
			const searchPromises = knowledgeBases.map(async (base) => {
				try {
					// Convert KnowledgeBase to KnowledgeBaseParams
					const baseParams = await this.toKnowledgeBaseParams(base);
					if (!baseParams) {
						logger.error(
							`Failed to convert knowledge base to params: ${base.id}`,
						);
						return [];
					}

					// Warm up the knowledge base (ensure RAGApplication is initialized)
					await this.warmupKnowledgeBase(baseParams);

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const results = await KnowledgeService.search(null as any, {
						search: query,
						base: baseParams,
					});

					// Apply rerank if rerank model is configured
					let finalResults = results;
					if (baseParams.rerankApiClient && results.length > 0) {
						try {
							logger.debug(
								`Reranking ${results.length} results for knowledge base: ${base.id}`,
							);
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							finalResults = await KnowledgeService.rerank(null as any, {
								search: query,
								base: baseParams,
								results,
							});
							logger.debug(
								`Reranking completed, got ${finalResults.length} results`,
							);
						} catch (error) {
							logger.error(
								`Reranking failed for ${base.id}, using original results:`,
								error as Error,
							);
							// 如果 rerank 失败,使用原始结果
							finalResults = results;
						}
					}

					logger.debug(
						`Found ${finalResults.length} results in knowledge base: ${base.id}`,
					);
					return finalResults;
				} catch (error) {
					logger.error(
						`Failed to search knowledge base ${base.id}:`,
						error as Error,
					);
					return [];
				}
			});

			const allResults = await Promise.all(searchPromises);
			const flatResults = allResults.flat();

			logger.info(`Total search results: ${flatResults.length}`);
			return flatResults;
		} catch (error) {
			logger.error("Knowledge base search error:", error as Error);
			return [];
		}
	}

	/**
	 * Warm up knowledge base to ensure it's initialized
	 * This helps avoid "cold start" issues where first search returns poor results
	 */
	private async warmupKnowledgeBase(
		baseParams: KnowledgeBaseParams,
	): Promise<void> {
		try {
			logger.debug(`Warming up knowledge base: ${baseParams.id}`);
			// Create/get the RAGApplication instance to ensure it's initialized
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await KnowledgeService.create(null as any, baseParams);
			logger.debug(`Knowledge base warmed up: ${baseParams.id}`);
		} catch (error) {
			logger.warn(
				`Failed to warm up knowledge base ${baseParams.id}:`,
				error as Error,
			);
			// Don't throw - continue with search even if warmup fails
		}
	}

	/**
	 * Format search results into context string for LLM
	 * @param results - Search results from knowledge base
	 * @returns Formatted context string
	 */
	formatResultsToContext(results: KnowledgeSearchResult[]): string {
		if (results.length === 0) {
			return "";
		}

		const contextParts = results.map((result, index) => {
			return `[知识库片段 ${index + 1}]\n${result.pageContent}\n`;
		});

		return `\n\n<knowledge_base_context>\n以下是从知识库中检索到的相关信息,请基于这些信息回答用户问题:\n\n${contextParts.join("\n")}\n</knowledge_base_context>\n\n`;
	}
}

export const knowledgeBaseService = new KnowledgeBaseService();
