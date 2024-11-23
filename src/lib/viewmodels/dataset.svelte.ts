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

	// State Access Methods
	getState() {
		return this.state;
	}

	get datasets() {
		return this.state.available;
	}

	get selectedDataset() {
		return this.state.selected;
	}

	// Dataset Loading Methods
	async loadDatasets() {
		this.reset();
		this.setLoading(true);
		this.setError(null);

		try {
			const datasets = await apiRepository.getDatasets();
			this.state.available = datasets;
		} catch (error) {
			this.state.available = [];
			this.setError(error instanceof Error ? error.message : 'Failed to load datasets');
		} finally {
			this.setLoading(false);
		}
	}

	// Dataset Selection Methods
	selectDataset(dataset: Dataset) {
		this.state.selected = dataset;
		caseViewModel.loadCases();
		layerViewModel.reset();
	}

	// State Management
	reset() {
		this.state.available = [];
		this.state.selected = null;
		caseViewModel.reset();
		layerViewModel.reset();
	}
}

export const datasetViewModel = new DatasetViewModel();
