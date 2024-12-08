import { currentWorkspace } from '$lib/models/repository.svelte';
import type { LayerContext } from '$lib/models/types';
function resetUI(): void {
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
			bottomPanelTab: 'layers',
		},
		scriptEditor: {
			content: '',
		},
	});
}

function toggleDarkMode(): void {
	currentWorkspace.state.ui.isDarkMode = !currentWorkspace.state.ui.isDarkMode;
}

function setLayerContext(context: LayerContext): void {
	currentWorkspace.state.ui.layers.layerContext = context;
}

// Public API
export const uiViewModel = {
	// Bindable state
	get state() {
		return currentWorkspace.state.ui;
	},
	get layerContext() {
		return currentWorkspace.state.ui.layers.layerContext;
	},
	set layerContext(context: LayerContext) {
		currentWorkspace.state.ui.layers.layerContext = context;
	},

	// Actions
	toggleDarkMode,
	setLayerContext,
	resetUI,
};
