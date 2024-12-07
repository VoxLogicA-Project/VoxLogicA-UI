import type { Case, Dataset } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';

// UI-specific state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Constants
const MAX_SELECTED_CASES = 16;

// Derived states
const cases = $derived(loadedData.cases);
const selectedCases = $derived(currentWorkspace.state.data.openedCasesPaths);
const canSelectMore = $derived(selectedCases.length < MAX_SELECTED_CASES);
const getSelectionIndex = $derived((casePath: Case['path']) => {
	return selectedCases.indexOf(casePath);
});
const isSelected = $derived((casePath: Case['path']) => {
	return selectedCases.includes(casePath);
});

async function selectCase(dataset: Dataset, caseData: Case): Promise<void> {
	if (isSelected(caseData.path)) return;
	if (!canSelectMore) {
		error = `Cannot select more than ${MAX_SELECTED_CASES} cases`;
		return;
	}

	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchLayers(dataset, caseData);
		currentWorkspace.state.data.openedCasesPaths = [...selectedCases, caseData.path];
	} catch (e) {
		error = e instanceof Error ? e.message : `Failed to load layers for case: ${caseData.name}`;
	} finally {
		isLoading = false;
	}
}

function deselectCase(caseData: Case): void {
	currentWorkspace.state.data.openedCasesPaths = selectedCases.filter(
		(path) => path !== caseData.path
	);
	// Clean up any associated layers state
	delete loadedData.layersByCaseId[caseData.id];
}

async function toggleCase(dataset: Dataset, caseData: Case): Promise<void> {
	if (isSelected(caseData.path)) {
		deselectCase(caseData);
	} else {
		await selectCase(dataset, caseData);
	}
}

function reset(): void {
	currentWorkspace.state.data.openedCasesPaths = [];
	loadedData.cases = [];
	loadedData.layersByCaseId = {};
	isLoading = false;
	error = null;
}

// Public API
export const caseViewModel = {
	// State (readonly)
	get isLoading() {
		return isLoading;
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
	getSelectionIndex,
	isSelected,

	// Actions
	selectCase,
	deselectCase,
	toggleCase,
	reset,
};
