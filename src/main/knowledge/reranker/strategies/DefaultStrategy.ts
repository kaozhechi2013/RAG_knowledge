import type { MultiModalDocument, RerankStrategy } from "./RerankStrategy";
export class DefaultStrategy implements RerankStrategy {
	buildUrl(baseURL?: string): string {
		if (!baseURL) {
			throw new Error("baseURL is required for rerank");
		}

		// Normalize URL: ensure it ends with /v1
		let normalizedUrl = baseURL.replace(/\/+$/, ""); // Remove trailing slashes

		// Add /v1 if not present
		if (!normalizedUrl.endsWith("/v1")) {
			normalizedUrl = `${normalizedUrl}/v1`;
		}

		return `${normalizedUrl}/rerank`;
	}
	buildRequestBody(
		query: string,
		documents: MultiModalDocument[],
		topN: number,
		model?: string,
	) {
		const textDocuments = documents.filter((d) => d.text).map((d) => d.text!);

		return {
			model,
			query,
			documents: textDocuments,
			top_n: topN,
		};
	}
	extractResults(data: any) {
		return data.results;
	}
}
