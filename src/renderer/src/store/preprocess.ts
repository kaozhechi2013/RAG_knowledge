import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PreprocessProvider } from "@renderer/types";

export interface PreprocessState {
	providers: PreprocessProvider[];
	defaultProvider: string;
}

const initialState: PreprocessState = {
	providers: [
		{
			id: "local-ocr",
			name: "本地OCR (MinerU)",
			apiKey: "", // 本地OCR无需API Key
			apiHost: "local", // 标识为本地处理
		},
		{
			id: "mineru",
			name: "MinerU (云端)",
			apiKey: "",
			apiHost: "https://mineru.net",
		},
		{
			id: "doc2x",
			name: "Doc2x",
			apiKey: "",
			apiHost: "https://v2.doc2x.noedgeai.com",
		},
		{
			id: "mistral",
			name: "Mistral",
			model: "mistral-ocr-latest",
			apiKey: "",
			apiHost: "https://api.mistral.ai",
		},
	],
	defaultProvider: "local-ocr", // 默认使用本地OCR
};
const preprocessSlice = createSlice({
	name: "preprocess",
	initialState,
	reducers: {
		setDefaultPreprocessProvider(state, action: PayloadAction<string>) {
			state.defaultProvider = action.payload;
		},
		setPreprocessProviders(state, action: PayloadAction<PreprocessProvider[]>) {
			state.providers = action.payload;
		},
		updatePreprocessProviders(
			state,
			action: PayloadAction<PreprocessProvider[]>,
		) {
			state.providers = action.payload;
		},
		updatePreprocessProvider(
			state,
			action: PayloadAction<Partial<PreprocessProvider>>,
		) {
			const index = state.providers.findIndex(
				(provider) => provider.id === action.payload.id,
			);
			if (index !== -1) {
				Object.assign(state.providers[index], action.payload);
			}
		},
	},
});

export const {
	updatePreprocessProviders,
	updatePreprocessProvider,
	setDefaultPreprocessProvider,
	setPreprocessProviders,
} = preprocessSlice.actions;

export default preprocessSlice.reducer;
