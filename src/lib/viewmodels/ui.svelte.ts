import { currentWorkspace } from '$lib/models/repository.svelte';

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

// Public API
export const uiViewModel = {
	// Bindable state
	state: currentWorkspace.state.ui,

	// Actions
	resetUI,
};
