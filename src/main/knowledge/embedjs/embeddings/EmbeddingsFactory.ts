import type { BaseEmbeddings } from "@cherrystudio/embedjs-interfaces";
import { OllamaEmbeddings } from "@cherrystudio/embedjs-ollama";
import { OpenAiEmbeddings } from "@cherrystudio/embedjs-openai";
import { AzureOpenAiEmbeddings } from "@cherrystudio/embedjs-openai/src/azure-openai-embeddings";
import type { ApiClient } from "@types";

import { VoyageEmbeddings } from "./VoyageEmbeddings";

export default class EmbeddingsFactory {
	static create({
		embedApiClient,
		dimensions,
	}: {
		embedApiClient: ApiClient;
		dimensions?: number;
	}): BaseEmbeddings {
		const batchSize = 10;
		const { model, provider, apiKey, apiVersion, baseURL } = embedApiClient;
		if (provider === "voyageai") {
			return new VoyageEmbeddings({
				modelName: model,
				apiKey,
				outputDimension: dimensions,
				batchSize: 8,
			});
		}
		if (provider === "ollama") {
			// Normalize Ollama URL: remove /v1 or /v1/ suffix for native API
			let normalizedUrl = baseURL;
			if (normalizedUrl.endsWith("/v1/")) {
				normalizedUrl = normalizedUrl.slice(0, -4); // Remove '/v1/'
			} else if (normalizedUrl.endsWith("/v1")) {
				normalizedUrl = normalizedUrl.slice(0, -3); // Remove '/v1'
			} else if (normalizedUrl.includes("/v1/")) {
				normalizedUrl = normalizedUrl.replace("/v1/", "/"); // Replace '/v1/' with '/'
			}

			return new OllamaEmbeddings({
				model: model,
				baseUrl: normalizedUrl,
				requestOptions: {
					// @ts-expect-error expected
					"encoding-format": "float",
				},
			});
		}
		if (apiVersion !== undefined) {
			return new AzureOpenAiEmbeddings({
				azureOpenAIApiKey: apiKey,
				azureOpenAIApiVersion: apiVersion,
				azureOpenAIApiDeploymentName: model,
				azureOpenAIEndpoint: baseURL,
				dimensions,
				batchSize,
			});
		}
		return new OpenAiEmbeddings({
			model,
			apiKey,
			dimensions,
			batchSize,
			configuration: { baseURL },
		});
	}
}
