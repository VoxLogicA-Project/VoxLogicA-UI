import { currentWorkspace } from '$lib/models/repository.svelte';
import type { LayerContext, Case } from '$lib/models/types';

// UI State
let rightSidebarSize = $state(300);
let blinkingTabLayerContext: LayerContext | null = $state(null);
let expandedCasePaths = $state(new Set<string>());
let expandedRunIds = $state(new Set<string>());

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

// Public API
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

	// Actions
	toggleDarkMode,
	setLayerContext,
	showRunsForCase,
	hideRunsForCase,
	toggleRunsVisibility,
	toggleRunExpansion,
	reset,
};
