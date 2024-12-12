import type { Case } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';

// Constants
const MAX_SELECTED_CASES = 16;

// UI state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived states
const cases = $derived.by(() => {
	// Combine cases from all selected datasets
	return loadedData.datasets.flatMap((dataset) => loadedData.casesByDataset[dataset.name] || []);
});
const selectedCases = $derived.by(() => {
	const selectedPaths = currentWorkspace.state.data.openedCasesPaths;
	return selectedPaths
		.map((path) => cases.find((c) => c.path === path))
		.filter((c): c is Case => c !== undefined);
});
const canSelectMore = $derived(selectedCases.length < MAX_SELECTED_CASES);

// Queries
const casesOfDataset = $derived((datasetName: string) => {
	return loadedData.casesByDataset[datasetName] || [];
});
const getSelectedCasesForDataset = $derived((datasetName: string) => {
	return selectedCases.filter((c) => casesOfDataset(datasetName).includes(c));
});
const getSelectionIndex = $derived((casePath: Case['path']) => {
	return (currentWorkspace.state.data.openedCasesPaths.indexOf(casePath) + 1).toString();
});
const isSelected = $derived((casePath: Case['path']) => {
	return currentWorkspace.state.data.openedCasesPaths.includes(casePath);
});

// Actions
async function selectCase(case_: Case): Promise<void> {
	if (isSelected(case_.path)) return;
	if (!canSelectMore) {
		error = `Cannot select more than ${MAX_SELECTED_CASES} cases`;
		return;
	}

	error = null;

	try {
		await apiRepository.fetchLayers(case_);
		currentWorkspace.state.data.openedCasesPaths = [
			...currentWorkspace.state.data.openedCasesPaths,
			case_.path,
		];
		// Initialize default styles for each layer
		layerViewModel.uniqueLayersNames.forEach((layerName) => {
			if (!currentWorkspace.state.datasetLayersState.stylesByLayerName[layerName]) {
				currentWorkspace.state.datasetLayersState.stylesByLayerName[layerName] =
					layerViewModel.DEFAULT_LAYER_STYLE;
			}
		});
	} catch (e) {
		error = e instanceof Error ? e.message : `Failed to load layers for case: ${case_.name}`;
	}
}

function deselectCase(case_: Case): void {
	currentWorkspace.state.data.openedCasesPaths =
		currentWorkspace.state.data.openedCasesPaths.filter((path) => path !== case_.path);
	// Clean up any associated layers state
	delete loadedData.layersByCasePath[case_.path];
	delete currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[case_.path];
}

async function toggleCase(case_: Case): Promise<void> {
	if (isSelected(case_.path)) {
		deselectCase(case_);
	} else {
		await selectCase(case_);
	}
}

function swapCases(caseIndex1: number, caseIndex2: number): void {
	const newPaths = [...currentWorkspace.state.data.openedCasesPaths];

	// Verify indices are within bounds
	if (
		caseIndex1 < 0 ||
		caseIndex1 >= newPaths.length ||
		caseIndex2 < 0 ||
		caseIndex2 >= newPaths.length
	) {
		throw new Error(
			`Invalid case indices: ${caseIndex1} and ${caseIndex2}, with length ${newPaths.length}`
		);
	}

	// Swap the cases
	if (caseIndex1 !== caseIndex2) {
		[newPaths[caseIndex1], newPaths[caseIndex2]] = [newPaths[caseIndex2], newPaths[caseIndex1]];
		currentWorkspace.state.data.openedCasesPaths = newPaths;
	}
}

function reset(): void {
	currentWorkspace.state.data.openedCasesPaths = [];
	loadedData.casesByDataset = {};
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
	get canSelectMore() {
		return canSelectMore;
	},

	// Queries
	casesOfDataset,
	getSelectedCasesForDataset,
	getSelectionIndex,
	isSelected,

	// Actions
	selectCase,
	deselectCase,
	toggleCase,
	reset,

	// New action
	swapCases,
};
