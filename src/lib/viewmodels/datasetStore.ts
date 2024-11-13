import { writable, derived, type Writable } from 'svelte/store';
import type { Dataset } from '$lib/models/dataset';

// Maximum number of cases that can be selected simultaneously
const MAX_CASES = 16;

interface DatasetState {
	datasets: Dataset[];
	currentDataset: Dataset | null;
	selectedCases: string[];
	loading: boolean;
	error: string | null;
}

function createDatasetStore() {
	const store: Writable<DatasetState> = writable({
		datasets: [],
		currentDataset: null,
		selectedCases: [],
		loading: false,
		error: null,
	});

	const datasetStore = {
		...store,
		// Fetches available datasets from the server
		async loadDatasets() {
			store.update((state) => ({ ...state, loading: true, error: null }));
			try {
				const response = await fetch('/datasets');
				const datasets = await response.json();
				store.update((state) => ({ ...state, datasets, loading: false }));
			} catch (error) {
				store.update((state) => ({
					...state,
					loading: false,
					error: 'Failed to load datasets',
				}));
			}
		},

		selectDataset(dataset: Dataset) {
			store.update((state) => ({
				...state,
				currentDataset: dataset,
				selectedCases: [],
			}));
		},

		// Toggles case selection, enforcing the MAX_CASES limit
		toggleCase(caseName: string) {
			store.update((state) => {
				const currentIndex = state.selectedCases.indexOf(caseName);
				if (currentIndex === -1 && state.selectedCases.length < MAX_CASES) {
					return { ...state, selectedCases: [...state.selectedCases, caseName] };
				}
				if (currentIndex !== -1) {
					const selectedCases = state.selectedCases.filter((c) => c !== caseName);
					return { ...state, selectedCases };
				}
				return state;
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
