import type { Dataset } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import type { MainState } from './mainStore';
import { mainStore } from './mainStore';
import { derived } from 'svelte/store';

function createDatasetStore() {
	return {
		async loadDatasets() {
			mainStore.update((state: MainState) => ({
				...state,
				datasets: {
					...state.datasets,
					loading: true,
					error: null,
				},
			}));

			try {
				const datasets = await apiRepository.getDatasets();
				mainStore.update((state: MainState) => ({
					...state,
					datasets: {
						...state.datasets,
						available: datasets,
						loading: false,
					},
				}));
			} catch (error) {
				mainStore.update((state: MainState) => ({
					...state,
					datasets: {
						...state.datasets,
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to load datasets',
					},
				}));
			}
		},

		selectDataset(dataset: Dataset) {
			mainStore.update((state: MainState) => ({
				...state,
				datasets: {
					...state.datasets,
					selected: dataset,
				},
				cases: {
					...state.cases,
					available: [],
					selected: [],
				},
				layers: {
					availableByCase: {},
					selected: {},
					styles: {},
					loading: false,
					error: null,
				},
			}));
		},

		clearDataset() {
			mainStore.update((state: MainState) => ({
				...state,
				datasets: {
					...state.datasets,
					selected: null,
				},
				cases: {
					...state.cases,
					available: [],
					selected: [],
				},
				layers: {
					availableByCase: {},
					selected: {},
					styles: {},
					loading: false,
					error: null,
				},
			}));
		},
	};
}

export const datasetStore = createDatasetStore();
export const selectedDatasetId = derived(mainStore, ($state) => $state.datasets.selected?.id);
