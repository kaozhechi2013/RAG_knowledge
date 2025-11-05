import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface KnowledgeBase {
	id: string;
	name: string;
	model?: {
		id: string;
		name: string;
	};
	documentCount?: number;
	createdAt?: number;
	updatedAt?: number;
}

interface KnowledgeState {
	knowledgeBases: KnowledgeBase[];
	selectedKnowledgeBaseId: string | null;
	isLoading: boolean;

	setKnowledgeBases: (bases: KnowledgeBase[]) => void;
	selectKnowledgeBase: (id: string | null) => void;
	getSelectedKnowledgeBase: () => KnowledgeBase | null;
	setLoading: (loading: boolean) => void;

	// Fetch knowledge bases from API
	fetchKnowledgeBases: (apiUrl: string, apiKey: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>()(
	persist(
		(set, get) => ({
			knowledgeBases: [],
			selectedKnowledgeBaseId: null,
			isLoading: false,

			setKnowledgeBases: (bases) => set({ knowledgeBases: bases }),

			selectKnowledgeBase: (id) => set({ selectedKnowledgeBaseId: id }),

			getSelectedKnowledgeBase: () => {
				const { knowledgeBases, selectedKnowledgeBaseId } = get();
				if (!selectedKnowledgeBaseId) return null;
				return (
					knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) || null
				);
			},

			setLoading: (loading) => set({ isLoading: loading }),

			fetchKnowledgeBases: async (apiUrl: string, apiKey: string) => {
				set({ isLoading: true });
				try {
					const response = await fetch(`${apiUrl}/v1/knowledge`, {
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`);
					}

					const result = await response.json();
					const bases = result.data || [];
					set({ knowledgeBases: bases, isLoading: false });
				} catch (error) {
					console.error("Failed to fetch knowledge bases:", error);
					set({ isLoading: false });
					throw error;
				}
			},
		}),
		{
			name: StoreKey.Knowledge,
		},
	),
);
