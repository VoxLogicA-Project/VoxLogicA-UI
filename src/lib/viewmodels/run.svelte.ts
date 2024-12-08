import type { Case, Layer, LayerStyle, PresetScript, Run } from '$lib/models/types';
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

// Actions
async function loadPresets(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchPresetsScripts();
	} catch (err) {
		error = err instanceof RepositoryError ? err.message : 'Failed to load presets';
	} finally {
		isLoading = false;
	}
}

async function loadPresetScript(preset: PresetScript): Promise<void> {
	isLoading = true;
	error = null;

	try {
		const code = await apiRepository.fetchPresetScriptCode(preset);
		currentWorkspace.state.ui.scriptEditor.content = code;
	} catch (err) {
		error = err instanceof RepositoryError ? err.message : 'Failed to load preset script';
	} finally {
		isLoading = false;
	}
}

function saveEditorContent(content: string): void {
	currentWorkspace.state.ui.scriptEditor.content = content;
}

async function singleRun(caseData: Case): Promise<void> {
	await runAll([caseData]);
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

		const runs: [Case, Run][] = await response.json();

		// Get the run ID (all runs share the same ID)
		const runId = runs[0][1].id;

		currentWorkspace.state.data.openedRunsIds.push(runId);

		// Load the runs into loadedData
		for (const [case_, run] of runs) {
			if (!loadedData.runsByCasePath[case_.path]) {
				loadedData.runsByCasePath[case_.path] = [];
			}
			loadedData.runsByCasePath[case_.path].push(run);
			currentWorkspace.state.runsLayersStates[run.id] = {
				openedLayersPathsByCasePath: {},
				// Initialize styles for each layer
				stylesByLayerName: run.outputLayers.reduce(
					(acc, layer) => {
						acc[layer.name] = layerViewModel.DEFAULT_LAYER_STYLE;
						return acc;
					},
					{} as Record<Layer['name'], LayerStyle>
				),
			};
		}

		// Set error if any run failed
		if (runs.some(([_, run]) => run.outputError)) {
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

function reset(): void {
	currentWorkspace.state.data.openedRunsIds = [];
	currentWorkspace.state.ui.scriptEditor.content = '';
	isLoading = false;
	error = null;
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
	get presetScripts() {
		return loadedData.presetScripts;
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

	// Queries
	getRunsWithErrors,
	getRunPrints,

	// Actions
	loadPresets,
	loadPresetScript,
	saveEditorContent,
	singleRun,
	runAll,
	reset,
};
