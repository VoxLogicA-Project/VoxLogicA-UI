import { writable, derived, type Writable } from 'svelte/store';
import type { Dataset, Case, Layer } from '$lib/models/dataset';

// Maximum number of cases that can be selected simultaneously
const MAX_CASES = 16;

interface DatasetState {
	currentDataset: Dataset | null;
	selectedCases: Case[];
	selectedLayers: Record<string, Layer[]>;
	loading: boolean;
	error: string | null;
}

function createDatasetStore() {
	const store: Writable<DatasetState> = writable({
		currentDataset: null,
		selectedCases: [],
		selectedLayers: {},
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
			}));
		},

		// Toggles a case
		toggleCase(caseData: Case) {
			store.update((state) => {
				const currentIndex = state.selectedCases.findIndex((c) => c.id === caseData.id);

				if (currentIndex === -1 && state.selectedCases.length < MAX_CASES) {
					return { ...state, selectedCases: [...state.selectedCases, caseData] };
				}

				if (currentIndex !== -1) {
					const selectedCases = state.selectedCases.filter((c) => c.id !== caseData.id);
					const { [caseData.id]: _, ...remainingLayers } = state.selectedLayers;

					return {
						...state,
						selectedCases,
						selectedLayers: remainingLayers,
					};
				}

				return state;
			});
		},

		// Toggles a layer
		toggleLayer(caseId: string, layer: Layer) {
			store.update((state) => {
				const currentLayers = state.selectedLayers[caseId] || [];
				const layerIndex = currentLayers.findIndex((l) => l.id === layer.id);

				if (layerIndex === -1) {
					// Add layer if not present
					return {
						...state,
						selectedLayers: {
							...state.selectedLayers,
							[caseId]: [...currentLayers, layer],
						},
					};
				} else {
					// Remove layer if already present
					const updatedLayers = currentLayers.filter((_, index) => index !== layerIndex);
					return {
						...state,
						selectedLayers: {
							...state.selectedLayers,
							[caseId]: updatedLayers,
						},
					};
				}
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
