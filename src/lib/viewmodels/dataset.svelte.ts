import type { Dataset } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';
import { caseViewModel } from './case.svelte';

// UI state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived states
const datasets = $derived(loadedData.datasets);
const selectedDatasets = $derived.by(() => {
	const datasetNames = currentWorkspace.state.data.openedDatasetsNames;
	return loadedData.datasets.filter((d) => datasetNames.includes(d.name));
});

// Actions
async function loadDatasets(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchDatasets();
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load datasets';
	} finally {
		isLoading = false;
	}
}

async function selectDataset(dataset: Dataset): Promise<void> {
	if (!dataset) return;

	caseViewModel.isLoading = true;
	error = null;

	try {
		if (!currentWorkspace.state.data.openedDatasetsNames.includes(dataset.name)) {
			currentWorkspace.state.data.openedDatasetsNames.push(dataset.name);
		}

		await apiRepository.fetchCases(dataset);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load cases';
		currentWorkspace.state.data.openedDatasetsNames =
			currentWorkspace.state.data.openedDatasetsNames.filter((name) => name !== dataset.name);
	} finally {
		caseViewModel.isLoading = false;
	}
}

function deselectDataset(dataset: Dataset): void {
	currentWorkspace.state.data.openedDatasetsNames =
		currentWorkspace.state.data.openedDatasetsNames.filter((name) => name !== dataset.name);
}

function toggleDataset(dataset: Dataset): void {
	if (selectedDatasets.some((d) => d.name === dataset.name)) {
		deselectDataset(dataset);
	} else {
		selectDataset(dataset);
	}
}

function reset(): void {
	currentWorkspace.state.data.openedDatasetsNames = [];
	loadedData.datasets = [];
	loadedData.casesByDataset = {};
	isLoading = false;
	error = null;
}

// Public API
export const datasetViewModel = {
	// State (readonly)
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get datasets() {
		return datasets;
	},
	get selectedDatasets() {
		return selectedDatasets;
	},
	get hasDatasets() {
		return loadedData.datasets.length > 0;
	},

	// Actions
	loadDatasets,
	selectDataset,
	deselectDataset,
	toggleDataset,
	reset,
};
