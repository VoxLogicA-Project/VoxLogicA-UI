import { writable, type Writable } from 'svelte/store';
import type { Dataset } from '$lib/models/dataset';

interface DatasetState {
	datasets: Dataset[];
	currentDataset: Dataset | null;
	loading: boolean;
	error: string | null;
}

function createDatasetStore() {
	const store: Writable<DatasetState> = writable({
		datasets: [],
		currentDataset: null,
		loading: false,
		error: null,
	});

	return {
		...store,
		loadDatasets: async () => {
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
		selectDataset: (dataset: Dataset) => {
			store.update((state) => ({ ...state, currentDataset: dataset }));
		},
	};
}

export const datasetStore = createDatasetStore();
