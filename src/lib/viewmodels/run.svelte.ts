import type { Case, Layer, LayerStyle, ExampleScript, Run } from '$lib/models/types';
import {
	loadedData,
	currentWorkspace,
	apiRepository,
	RepositoryError,
} from '$lib/models/repository.svelte';
import { layerViewModel } from './layer.svelte';

// UI state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Print filters
interface PrintFilter {
	label: string;
	operation: string;
	value: string;
}
let printFilters = $state<PrintFilter[]>([]);

// Derived states
const headerContent = $derived.by(() => {
	const layersIds = layerViewModel.datasetUniqueLayersNames;
	return [
		'import "stdlib.imgql"',
		'',
		'// Load layers',
		...layersIds.map((layerId) => `load ${layerId} = "\$\{LAYER_PATH:${layerId}\}"`),
	].join('\n');
});
const fullScriptContent = $derived(
	`${headerContent}\n\n${currentWorkspace.state.ui.scriptEditor.content}`
);
const openedRunsIds = $derived(currentWorkspace.state.data.openedRunsIds);
const uniquePrintLabels = $derived.by(() => {
	const labels = new Set<string>();

	// Iterate through all runs in all cases
	for (const casePath in loadedData.runsByCasePath) {
		const runs = loadedData.runsByCasePath[casePath];
		for (const run of runs) {
			run.outputPrint.forEach((print) => labels.add(print.name));
		}
	}

	return Array.from(labels).sort();
});

// Queries
const getRunsWithErrors = $derived((runId: Run['id']) => {
	const runsErrors: Record<Case['path'], Run> = {};
	for (const casePath in loadedData.runsByCasePath) {
		const runs = loadedData.runsByCasePath[casePath];
		// Find run with given runId
		const run = runs.find((r) => r.id === runId);
		if (run && run.outputError) {
			runsErrors[casePath] = run;
		}
	}
	return runsErrors;
});
const getRunPrints = $derived((runId: Run['id'], casePath: Case['path']) => {
	const runsForCase = loadedData.runsByCasePath[casePath];
	if (!runsForCase) return [];
	const run = runsForCase.find((r) => r.id === runId);
	if (!run) return [];
	return run.outputPrint;
});
const getRunsForCase = $derived((casePath: Case['path']) => {
	const runs = loadedData.runsByCasePath[casePath] ?? [];

	// If no filters, return all runs
	if (printFilters.length === 0) return runs;

	// Get only valid filters (non-empty values)
	const validFilters = printFilters.filter((f) => f.label.trim() !== '' && f.value.trim() !== '');

	// If no valid filters, return all runs
	if (validFilters.length === 0) return runs;

	return runs.filter((run) => {
		// Run must match all valid filters (AND logic)
		return validFilters.every((filter) => {
			const print = run.outputPrint.find((p) => p.name === filter.label);
			if (!print) return false;

			const printValue = parseFloat(print.value);
			const filterValue = parseFloat(filter.value);

			// Skip invalid numbers
			if (isNaN(printValue) || isNaN(filterValue)) return false;

			switch (filter.operation) {
				case '>':
					return printValue > filterValue;
				case '<':
					return printValue < filterValue;
				case '>=':
					return printValue >= filterValue;
				case '<=':
					return printValue <= filterValue;
				case '=':
					return printValue === filterValue;
				default:
					return false;
			}
		});
	});
});
const isRunSelected = $derived((runId: Run['id']) => {
	return currentWorkspace.state.data.openedRunsIds.some((id) => id === runId);
});
const getSuccessfulCasesForRun = $derived((runId: Run['id']) => {
	const successfulCases: Case[] = [];

	for (const casePath in loadedData.runsByCasePath) {
		const runs = loadedData.runsByCasePath[casePath];
		const run = runs.find((r) => r.id === runId);
		if (run && !run.outputError && run.outputLayers.length > 0) {
			// Find the case object from all datasets
			const datasetName = casePath.split('/')[2];
			const case_ = loadedData.casesByDataset[datasetName]?.find((c) => c.path === casePath);
			if (case_) {
				successfulCases.push(case_);
			}
		}
	}

	return successfulCases;
});

// Actions
async function loadExampleScripts(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchExampleScripts();
	} catch (err) {
		error = err instanceof RepositoryError ? err.message : 'Failed to load example scripts';
	} finally {
		isLoading = false;
	}
}

async function loadExampleScript(example: ExampleScript): Promise<void> {
	isLoading = true;
	error = null;

	try {
		const code = await apiRepository.fetchExampleScriptCode(example);
		currentWorkspace.state.ui.scriptEditor.content = code;
	} catch (err) {
		error = err instanceof RepositoryError ? err.message : 'Failed to load example script';
	} finally {
		isLoading = false;
	}
}

function saveEditorContent(content: string): void {
	currentWorkspace.state.ui.scriptEditor.content = content;
}

async function singleRun(case_: Case): Promise<void> {
	await runAll([case_]);
}

async function runAll(cases: Case[]): Promise<Run['id']> {
	isLoading = true;
	error = null;

	try {
		const response = await fetch('/run', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				workspaceId: currentWorkspace.id,
				scriptContent: fullScriptContent,
				cases: cases,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || response.statusText);
		}

		const runs: Run[] = await response.json();

		// Get the run ID (all runs share the same ID)
		const runId = runs[0].id;

		// Update the state by adding the new runs
		const runsByCasePath: Record<Case['path'], Run[]> = {};

		for (const run of runs) {
			if (!runsByCasePath[run.casePath]) {
				runsByCasePath[run.casePath] = [];
			}
			runsByCasePath[run.casePath].push(run);
		}

		// Update the state by adding the new runs
		for (const casePath in runsByCasePath) {
			const runs = runsByCasePath[casePath];
			if (!loadedData.runsByCasePath[casePath]) {
				loadedData.runsByCasePath[casePath] = [];
			}
			loadedData.runsByCasePath[casePath].push(...runs);
		}

		// Select the run
		selectRun(runId);

		// Set error if any run failed
		if (runs.some((run) => run.outputError)) {
			error = 'Some runs failed. Check individual results for details.';
		}

		return runId;
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to execute runs';
		throw err;
	} finally {
		isLoading = false;
	}
}

function selectRun(runId: Run['id']): void {
	if (isRunSelected(runId)) return;

	// Initialize layer states for this run if not already present
	if (!currentWorkspace.state.runsLayersStates[runId]) {
		// Find all layers for this run across all cases
		const runLayers = new Set<Layer['name']>();
		for (const casePath in loadedData.runsByCasePath) {
			const run = loadedData.runsByCasePath[casePath].find((r) => r.id === runId);
			if (run) {
				run.outputLayers.forEach((layer) => runLayers.add(layer.name));
			}
		}

		// Initialize the run's layer state
		currentWorkspace.state.runsLayersStates[runId] = {
			openedLayersPathsByCasePath: {},
			stylesByLayerName: Array.from(runLayers).reduce(
				(acc, layerName) => {
					acc[layerName] = layerViewModel.DEFAULT_LAYER_STYLE;
					return acc;
				},
				{} as Record<Layer['name'], LayerStyle>
			),
		};
	}

	currentWorkspace.state.data.openedRunsIds.push(runId);
}

function deselectRun(runId: Run['id']): void {
	if (!isRunSelected(runId)) return;

	const index = currentWorkspace.state.data.openedRunsIds.indexOf(runId);
	if (index !== -1) {
		currentWorkspace.state.data.openedRunsIds.splice(index, 1);
	}

	delete currentWorkspace.state.runsLayersStates[runId];
}

function toggleRun(runId: Run['id']): void {
	if (isRunSelected(runId)) {
		deselectRun(runId);
	} else {
		selectRun(runId);
	}
}

// Actions for filter management
function addPrintFilter(filter: PrintFilter): void {
	printFilters = [...printFilters, filter];
}

function removePrintFilter(index: number): void {
	printFilters = printFilters.filter((_, i) => i !== index);
}

function updatePrintFilter(index: number, filter: Partial<PrintFilter>): void {
	printFilters = printFilters.map((f, i) => (i === index ? { ...f, ...filter } : f));
}

function clearPrintFilters(): void {
	printFilters = [];
}

function reset(): void {
	currentWorkspace.state.data.openedRunsIds = [];
	currentWorkspace.state.ui.scriptEditor.content = '';
	isLoading = false;
	error = null;
	printFilters = [];
}

// Public API
export const runViewModel = {
	// State (readonly)
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get exampleScripts() {
		return loadedData.exampleScripts;
	},
	get headerContent() {
		return headerContent;
	},
	get editorContent() {
		return currentWorkspace.state.ui.scriptEditor.content;
	},
	get fullScriptContent() {
		return fullScriptContent;
	},
	get openedRunsIds() {
		return openedRunsIds;
	},
	get printFilters() {
		return printFilters;
	},
	get uniquePrintLabels() {
		return uniquePrintLabels;
	},

	// Queries
	getRunsWithErrors,
	getRunPrints,
	getRunsForCase,
	isRunSelected,
	getSuccessfulCasesForRun,

	// Actions
	loadExampleScripts,
	loadExampleScript,
	saveEditorContent,
	singleRun,
	runAll,
	selectRun,
	deselectRun,
	toggleRun,
	addPrintFilter,
	removePrintFilter,
	updatePrintFilter,
	clearPrintFilters,
	reset,
};
