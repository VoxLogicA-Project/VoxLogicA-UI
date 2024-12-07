import type { Dataset } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';

// UI-specific state that doesn't belong in the model
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived state from the model
const selectedDataset = $derived.by(() => {
	const datasetName = currentWorkspace.state.data.openedDatasetName;
	return loadedData.datasets.find((d) => d.name === datasetName) ?? null;
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

	isLoading = true;
	error = null;

	try {
		// Update workspace state
		currentWorkspace.state.data.openedDatasetName = dataset.name;
		await apiRepository.fetchCases(dataset);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load cases';
		currentWorkspace.state.data.openedDatasetName = null;
	} finally {
		isLoading = false;
	}
}

function reset(): void {
	currentWorkspace.state.data.openedDatasetName = null;
	loadedData.datasets = [];
	loadedData.cases = [];
	isLoading = false;
	error = null;
}

// Public API
export const datasetViewModel = {
	// State (readonly)
	get selectedDataset() {
		return selectedDataset;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get hasDatasets() {
		return loadedData.datasets.length > 0;
	},

	// Actions
	loadDatasets,
	selectDataset,
	reset,
};
