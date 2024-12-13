import { apiRepository, currentWorkspace, RepositoryError } from '$lib/models/repository.svelte';
import type { LayerContext, Case, ExampleScript } from '$lib/models/types';
import { layerViewModel } from './layer.svelte';

// UI State
let isEditorLoading = $state(false);
let editorError = $state<string | null>(null);
let rightSidebarSize = $state(300);
let blinkingTabLayerContext: LayerContext | null = $state(null);
let expandedCasePaths = $state(new Set<string>());
let expandedRunIds = $state(new Set<string>());

const headerContent = $derived.by(() => {
	const layersIds = layerViewModel.datasetUniqueLayersNames;
	return [
		'import "stdlib.imgql"',
		'',
		'// Load layers',
		...layersIds.map((layerId) => `load ${layerId} = "\$\{LAYER_PATH:${layerId}\}"`),
		'// END load layers',
	].join('\n');
});
const fullScriptContent = $derived(
	`${headerContent}\n\n${currentWorkspace.state.ui.scriptEditor.content}`
);

function reset(): void {
	Object.assign(currentWorkspace.state.ui, {
		isDarkMode: false,
		sidebars: {
			datasetCollapsed: false,
			layerCollapsed: false,
			scriptCollapsed: false,
		},
		viewers: {
			fullscreenCasePath: null,
		},
		layers: {
			layerContext: { type: 'dataset' },
		},
		scriptEditor: {
			content: '',
		},
	});
	expandedCasePaths = new Set();
	expandedRunIds = new Set();
	blinkingTabLayerContext = null;
}

function toggleDarkMode(): void {
	currentWorkspace.state.ui.isDarkMode = !currentWorkspace.state.ui.isDarkMode;
}

function setLayerContext(context: LayerContext): void {
	currentWorkspace.state.ui.layers.layerContext = context;
}

// Case visibility methods
function showRunsForCase(casePath: Case['path']): void {
	expandedCasePaths.add(casePath);
}

function hideRunsForCase(casePath: Case['path']): void {
	expandedCasePaths.delete(casePath);
}

function toggleRunsVisibility(casePath: Case['path']): void {
	if (expandedCasePaths.has(casePath)) {
		hideRunsForCase(casePath);
	} else {
		showRunsForCase(casePath);
	}
}

// Run expansion methods
function toggleRunExpansion(runId: string): void {
	const newSet = new Set(expandedRunIds);
	if (newSet.has(runId)) {
		newSet.delete(runId);
	} else {
		newSet.add(runId);
	}
	expandedRunIds = newSet;
}

function loadScript(script: string): void {
	const endLoadLayersIndex = script.indexOf('// END load layers');
	if (endLoadLayersIndex !== -1) {
		const scriptContent = script.substring(endLoadLayersIndex + '// END load layers'.length).trim();
		currentWorkspace.state.ui.scriptEditor.content = scriptContent;
	} else {
		currentWorkspace.state.ui.scriptEditor.content = script;
	}
}

async function loadExampleScripts(): Promise<void> {
	isEditorLoading = true;
	editorError = null;

	try {
		await apiRepository.fetchExampleScripts();
	} catch (err) {
		editorError = err instanceof RepositoryError ? err.message : 'Failed to load example scripts';
	} finally {
		isEditorLoading = false;
	}
}

async function loadExampleScript(example: ExampleScript): Promise<void> {
	isEditorLoading = true;
	editorError = null;

	try {
		const code = await apiRepository.fetchExampleScriptCode(example);
		loadScript(code);
	} catch (err) {
		editorError = err instanceof RepositoryError ? err.message : 'Failed to load example script';
	} finally {
		isEditorLoading = false;
	}
}

export const uiViewModel = {
	// Bindable state
	get state() {
		return currentWorkspace.state.ui;
	},
	get rightSidebarSize() {
		return rightSidebarSize;
	},
	set rightSidebarSize(size: number) {
		rightSidebarSize = size;
	},
	get blinkingTabLayerContext() {
		return blinkingTabLayerContext;
	},
	set blinkingTabLayerContext(context: LayerContext | null) {
		blinkingTabLayerContext = context;
	},
	get layerContext() {
		return currentWorkspace.state.ui.layers.layerContext;
	},
	set layerContext(context: LayerContext) {
		currentWorkspace.state.ui.layers.layerContext = context;
	},
	get expandedCasePaths() {
		return expandedCasePaths;
	},
	set expandedCasePaths(value: Set<string>) {
		expandedCasePaths = value;
	},
	get expandedRunIds() {
		return expandedRunIds;
	},
	set expandedRunIds(value: Set<string>) {
		expandedRunIds = value;
	},
	get isEditorLoading() {
		return isEditorLoading;
	},
	get editorError() {
		return editorError;
	},
	get headerContent() {
		return headerContent;
	},
	get editorContent() {
		return currentWorkspace.state.ui.scriptEditor.content;
	},
	set editorContent(content: string) {
		currentWorkspace.state.ui.scriptEditor.content = content;
	},
	get fullScriptContent() {
		return fullScriptContent;
	},

	// Actions
	toggleDarkMode,
	setLayerContext,
	showRunsForCase,
	hideRunsForCase,
	toggleRunsVisibility,
	toggleRunExpansion,
	loadScript,
	loadExampleScripts,
	loadExampleScript,
	reset,
};
