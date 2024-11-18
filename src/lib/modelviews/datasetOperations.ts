import type { Dataset } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { mainState } from './mainState.svelte';

function createDatasetOperations() {
	return {
		async loadDatasets() {
			mainState.datasets.loading = true;
			mainState.datasets.error = null;

			try {
				const datasets = await apiRepository.getDatasets();
				mainState.datasets.available = datasets;
				mainState.datasets.loading = false;
			} catch (error) {
				mainState.datasets.loading = false;
				mainState.datasets.error =
					error instanceof Error ? error.message : 'Failed to load datasets';
			}
		},

		selectDataset(dataset: Dataset) {
			mainState.datasets.selected = dataset;
			mainState.cases.available = [];
			mainState.cases.selected = [];
			mainState.layers.availableByCase = {};
			mainState.layers.selected = {};
			mainState.layers.styles = {};
			mainState.layers.loading = false;
			mainState.layers.error = null;
		},

		clearDataset() {
			mainState.datasets.selected = null;
			mainState.cases.available = [];
			mainState.cases.selected = [];
			mainState.layers.availableByCase = {};
			mainState.layers.selected = {};
			mainState.layers.styles = {};
			mainState.layers.loading = false;
			mainState.layers.error = null;
		},
	};
}

export const datasetOperations = createDatasetOperations();
