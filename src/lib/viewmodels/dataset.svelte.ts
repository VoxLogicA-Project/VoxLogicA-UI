import { BaseViewModel } from './base.svelte';
import type { Dataset } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { caseViewModel } from './case.svelte';
import { layerViewModel } from './layer.svelte';

interface DatasetState {
	available: Dataset[];
	selected: Dataset | null;
}

export class DatasetViewModel extends BaseViewModel {
	private state = $state<DatasetState>({
		available: [],
		selected: null,
	});

	getState() {
		return this.state;
	}

	get datasets() {
		return this.state.available;
	}

	get selectedDataset() {
		return this.state.selected;
	}

	async loadDatasets() {
		this.setLoading(true);
		this.setError(null);

		try {
			const datasets = await apiRepository.getDatasets();
			this.state.available = datasets;
		} catch (error) {
			this.setError(error instanceof Error ? error.message : 'Failed to load datasets');
		} finally {
			this.setLoading(false);
		}
	}

	selectDataset(dataset: Dataset) {
		this.state.selected = dataset;
		caseViewModel.loadCases();
		layerViewModel.reset();
	}

	clearDataset() {
		this.state.selected = null;
		caseViewModel.reset();
		layerViewModel.reset();
	}
}

export const datasetViewModel = new DatasetViewModel();
