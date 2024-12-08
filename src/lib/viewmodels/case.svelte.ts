import type { Case } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';

// Constants
const MAX_SELECTED_CASES = 16;

// UI state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived states
const cases = $derived(loadedData.cases);
const selectedCases = $derived.by(() => {
	const selectedPaths = currentWorkspace.state.data.openedCasesPaths;
	return selectedPaths
		.map((path) => cases.find((c) => c.path === path))
		.filter((c): c is Case => c !== undefined);
});
const canSelectMore = $derived(selectedCases.length < MAX_SELECTED_CASES);
const getSelectionIndex = $derived((casePath: Case['path']) => {
	return (currentWorkspace.state.data.openedCasesPaths.indexOf(casePath) + 1).toString();
});
const isSelected = $derived((casePath: Case['path']) => {
	return currentWorkspace.state.data.openedCasesPaths.includes(casePath);
});

// Actions
async function selectCase(caseData: Case): Promise<void> {
	if (isSelected(caseData.path)) return;
	if (!canSelectMore) {
		error = `Cannot select more than ${MAX_SELECTED_CASES} cases`;
		return;
	}

	error = null;

	try {
		await apiRepository.fetchLayers(caseData);
		currentWorkspace.state.data.openedCasesPaths = [
			...currentWorkspace.state.data.openedCasesPaths,
			caseData.path,
		];
		// Initialize default styles for each layer
		layerViewModel.uniqueLayersNames.forEach((layerName) => {
			if (!currentWorkspace.state.datasetLayersState.stylesByLayerName[layerName]) {
				currentWorkspace.state.datasetLayersState.stylesByLayerName[layerName] =
					layerViewModel.DEFAULT_LAYER_STYLE;
			}
		});
	} catch (e) {
		error = e instanceof Error ? e.message : `Failed to load layers for case: ${caseData.name}`;
	}
}

function deselectCase(caseData: Case): void {
	currentWorkspace.state.data.openedCasesPaths =
		currentWorkspace.state.data.openedCasesPaths.filter((path) => path !== caseData.path);
	// Clean up any associated layers state
	delete loadedData.layersByCasePath[caseData.path];
	delete currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[caseData.path];
}

async function toggleCase(caseData: Case): Promise<void> {
	if (isSelected(caseData.path)) {
		deselectCase(caseData);
	} else {
		await selectCase(caseData);
	}
}

function reset(): void {
	currentWorkspace.state.data.openedCasesPaths = [];
	loadedData.cases = [];
	loadedData.layersByCasePath = {};
	isLoading = false;
	error = null;
}

// Public API
export const caseViewModel = {
	// Constants
	MAX_SELECTED_CASES,

	// State (readonly)
	get isLoading() {
		return isLoading;
	},
	set isLoading(value: boolean) {
		isLoading = value;
	},
	get error() {
		return error;
	},
	get cases() {
		return cases;
	},
	get selectedCases() {
		return selectedCases;
	},

	// Queries
	canSelectMore,
	getSelectionIndex,
	isSelected,

	// Actions
	selectCase,
	deselectCase,
	toggleCase,
	reset,
};
