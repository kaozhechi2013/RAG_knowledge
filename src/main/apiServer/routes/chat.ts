import type { KnowledgeBase } from "@types";
import type { Request, Response } from "express";
import express from "express";
import OpenAI from "openai";
import type { ChatCompletionCreateParams } from "openai/resources";

import { loggerService } from "../../services/LoggerService";
import { chatCompletionService } from "../services/chat-completion";
import { knowledgeBaseService } from "../services/knowledge-base";
import { validateModelId } from "../utils";

const logger = loggerService.withContext("ApiServerChatRoutes");

// Extend the request type to include our custom fields
type ExtendedChatCompletionRequest = ChatCompletionCreateParams & {
	assistant_id?: string;
	knowledge_bases?: KnowledgeBase[];
};

const router = express.Router();

/**
 * @swagger
 * /v1/chat/completions:
 *   post:
 *     summary: Create chat completion
 *     description: Create a chat completion response, compatible with OpenAI API
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatCompletionRequest'
 *     responses:
 *       200:
 *         description: Chat completion response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 object:
 *                   type: string
 *                   example: chat.completion
 *                 created:
 *                   type: integer
 *                 model:
 *                   type: string
 *                 choices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       message:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                       finish_reason:
 *                         type: string
 *                 usage:
 *                   type: object
 *                   properties:
 *                     prompt_tokens:
 *                       type: integer
 *                     completion_tokens:
 *                       type: integer
 *                     total_tokens:
 *                       type: integer
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Server-sent events stream (when stream=true)
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/completions", async (req: Request, res: Response) => {
	try {
		const request = req.body as ExtendedChatCompletionRequest;

		if (!request) {
			return res.status(400).json({
				error: {
					message: "Request body is required",
					type: "invalid_request_error",
					code: "missing_body",
				},
			});
		}

		logger.info("Chat completion request:", {
			model: request.model,
			messageCount: request.messages?.length || 0,
			stream: request.stream,
			temperature: request.temperature,
			assistantId: request.assistant_id,
			hasKnowledgeBases: !!request.knowledge_bases?.length,
		});

		// Validate request
		const validation = chatCompletionService.validateRequest(request);
		if (!validation.isValid) {
			return res.status(400).json({
				error: {
					message: validation.errors.join("; "),
					type: "invalid_request_error",
					code: "validation_failed",
				},
			});
		}

		// Validate model ID and get provider
		const modelValidation = await validateModelId(request.model);
		if (!modelValidation.valid) {
			const error = modelValidation.error;
			if (error) {
				logger.warn(`Model validation failed for '${request.model}':`, error);
				return res.status(400).json({
					error: {
						message: error.message,
						type: "invalid_request_error",
						code: error.code,
					},
				});
			}
		}

		const provider = modelValidation.provider;
		const modelId = modelValidation.modelId;

		if (!provider || !modelId) {
			return res.status(400).json({
				error: {
					message: "Model validation failed",
					type: "invalid_request_error",
					code: "invalid_model",
				},
			});
		}

		logger.info("Model validation successful:", {
			provider: provider.id,
			providerType: provider.type,
			modelId: modelId,
			fullModelId: request.model,
		});

		// ========== 知识库搜索 ==========
		// If knowledge bases are provided and this is not a streaming request,
		// search the knowledge bases and inject the results into the messages
		logger.info("Checking knowledge base configuration:", {
			hasKnowledgeBases: !!request.knowledge_bases,
			knowledgeBasesCount: request.knowledge_bases?.length || 0,
			hasMessages: !!request.messages,
			messagesCount: request.messages?.length || 0,
		});

		if (
			request.knowledge_bases &&
			request.knowledge_bases.length > 0 &&
			request.messages &&
			request.messages.length > 0
		) {
			const userMessage = request.messages[request.messages.length - 1];
			logger.info("Checking user message:", {
				role: userMessage.role,
				contentType: typeof userMessage.content,
				contentLength:
					typeof userMessage.content === "string"
						? userMessage.content.length
						: 0,
			});

			if (
				userMessage.role === "user" &&
				typeof userMessage.content === "string"
			) {
				logger.info("🔍 Starting knowledge base search for query:", {
					query: userMessage.content,
				});
				const searchResults = await knowledgeBaseService.search(
					userMessage.content,
					request.knowledge_bases,
				);

				logger.info(`📚 Knowledge base search completed:`, {
					resultsCount: searchResults.length,
					results: searchResults.map((r) => ({
						content: r.pageContent?.substring(0, 100),
						score: r.score,
					})),
				});

				if (searchResults.length > 0) {
					const knowledgeContext =
						knowledgeBaseService.formatResultsToContext(searchResults);
					logger.info("📝 Knowledge context", {
						length: knowledgeContext.length,
					});
					// Prepend knowledge context to the user message
					userMessage.content = knowledgeContext + userMessage.content;
					logger.info(
						`✅ Injected ${searchResults.length} knowledge base results into context`,
					);
					logger.info("📄 Final message", {
						contentLength: userMessage.content.length,
					});
				} else {
					logger.warn("⚠️ No knowledge base results found for query");
				}
			}
		} else {
			logger.info("⏭️ Skipping knowledge base search (conditions not met)");
		}

		// Create OpenAI client
		const client = new OpenAI({
			baseURL: provider.apiHost,
			apiKey: provider.apiKey,
		});
		request.model = modelId;

		// Handle streaming
		if (request.stream) {
			const streamResponse = await client.chat.completions.create(request);

			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");

			try {
				for await (const chunk of streamResponse as any) {
					res.write(`data: ${JSON.stringify(chunk)}\n\n`);
				}
				res.write("data: [DONE]\n\n");
				res.end();
			} catch (streamError: any) {
				logger.error("Stream error:", streamError);
				res.write(
					`data: ${JSON.stringify({
						error: {
							message: "Stream processing error",
							type: "server_error",
							code: "stream_error",
						},
					})}\n\n`,
				);
				res.end();
			}
			return;
		}

		// Handle non-streaming
		const response = await client.chat.completions.create(request);
		return res.json(response);
	} catch (error: any) {
		logger.error("Chat completion error:", error);

		let statusCode = 500;
		let errorType = "server_error";
		let errorCode = "internal_error";
		let errorMessage = "Internal server error";

		if (error instanceof Error) {
			errorMessage = error.message;

			if (
				error.message.includes("API key") ||
				error.message.includes("authentication")
			) {
				statusCode = 401;
				errorType = "authentication_error";
				errorCode = "invalid_api_key";
			} else if (
				error.message.includes("rate limit") ||
				error.message.includes("quota")
			) {
				statusCode = 429;
				errorType = "rate_limit_error";
				errorCode = "rate_limit_exceeded";
			} else if (
				error.message.includes("timeout") ||
				error.message.includes("connection")
			) {
				statusCode = 502;
				errorType = "server_error";
				errorCode = "upstream_error";
			}
		}

		return res.status(statusCode).json({
			error: {
				message: errorMessage,
				type: errorType,
				code: errorCode,
			},
		});
	}
});

export { router as chatRoutes };
