import { writable, derived, type Writable, get } from 'svelte/store';
import type { Dataset, Case, Layer } from '$lib/models/dataset';

// Maximum number of cases that can be selected simultaneously
const MAX_CASES = 16;

interface DatasetState {
	currentDataset: Dataset | null;
	selectedCases: Case[];
	selectedLayers: Record<string, Layer[]>;
	availableLayers: Record<string, Layer[]>;
	loading: boolean;
	error: string | null;
}

function createDatasetStore() {
	const store: Writable<DatasetState> = writable({
		currentDataset: null,
		selectedCases: [],
		selectedLayers: {},
		availableLayers: {},
		loading: false,
		error: null,
	});

	const datasetStore = {
		...store,
		selectDataset(dataset: Dataset) {
			store.update((state) => ({
				...state,
				currentDataset: dataset,
				selectedCases: [],
				selectedLayers: {},
				availableLayers: {},
			}));
		},

		async updateAvailableLayers(caseId: string) {
			const state = get(store);
			if (!state.currentDataset) return;

			try {
				const response = await fetch(
					`/datasets/${state.currentDataset.path}/cases/${caseId}/layers`
				);
				const layers = await response.json();

				store.update((state) => ({
					...state,
					availableLayers: {
						...state.availableLayers,
						[caseId]: layers,
					},
					selectedLayers: {
						...state.selectedLayers,
						[caseId]: layers.length > 0 ? [layers[0]] : [],
					},
				}));
			} catch (error) {
				console.error('Failed to load layers for case:', error);
			}
		},

		toggleCase(caseData: Case) {
			store.update((state) => {
				const currentIndex = state.selectedCases.findIndex((c) => c.id === caseData.id);

				if (currentIndex === -1 && state.selectedCases.length < MAX_CASES) {
					this.updateAvailableLayers(caseData.id);
					return { ...state, selectedCases: [...state.selectedCases, caseData] };
				}

				if (currentIndex !== -1) {
					const selectedCases = state.selectedCases.filter((c) => c.id !== caseData.id);
					const { [caseData.id]: _, ...remainingLayers } = state.selectedLayers;
					const { [caseData.id]: ___, ...remainingAvailableLayers } = state.availableLayers;

					return {
						...state,
						selectedCases,
						selectedLayers: remainingLayers,
						availableLayers: remainingAvailableLayers,
					};
				}

				return state;
			});
		},

		toggleLayer(caseId: string, layer: Layer) {
			store.update((state) => {
				const currentLayers = state.selectedLayers[caseId] || [];
				const layerIndex = currentLayers.findIndex((l) => l.id === layer.id);

				// Add layer if not present
				if (layerIndex === -1) {
					return {
						...state,
						selectedLayers: {
							...state.selectedLayers,
							[caseId]: [...currentLayers, layer],
						},
					};
				}
				// Remove layer if already present
				const updatedLayers = currentLayers.filter((_, index) => index !== layerIndex);
				return {
					...state,
					selectedLayers: {
						...state.selectedLayers,
						[caseId]: updatedLayers,
					},
				};
			});
		},
	} as const;

	return datasetStore;
}

export const datasetStore = createDatasetStore();
export const reachedMaxCases = derived(
	datasetStore,
	($state) => $state.selectedCases.length >= MAX_CASES
);
