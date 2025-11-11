import type { MultiModalDocument, RerankStrategy } from "./RerankStrategy";
export class TEIStrategy implements RerankStrategy {
	buildUrl(baseURL?: string): string {
		if (!baseURL) {
			throw new Error("baseURL is required for rerank");
		}

		// Normalize URL: ensure it ends with /v1 for OpenAI-compatible API
		let normalizedUrl = baseURL.replace(/\/+$/, ""); // Remove trailing slashes

		// Add /v1 if not present
		if (!normalizedUrl.endsWith("/v1")) {
			normalizedUrl = `${normalizedUrl}/v1`;
		}

		return `${normalizedUrl}/rerank`;
	}
	buildRequestBody(query: string, documents: MultiModalDocument[]) {
		const textDocuments = documents.filter((d) => d.text).map((d) => d.text!);
		return {
			query,
			texts: textDocuments,
			return_text: true,
		};
	}
	extractResults(data: any) {
		return data.map((item: any) => ({
			index: item.index,
			relevance_score: item.score,
		}));
	}
}
