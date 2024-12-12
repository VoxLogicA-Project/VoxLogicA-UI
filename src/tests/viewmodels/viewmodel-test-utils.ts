import { beforeEach } from 'vitest';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import type { SerializedWorkspaceState } from '$lib/models/types';

// Initial workspace state matching the reset state in session viewmodel
export const initialWorkspaceState: SerializedWorkspaceState = {
	data: {
		openedDatasetName: null,
		openedCasesPaths: [],
		openedRunsIds: [],
	},
	datasetLayersState: {
		openedLayersPathsByCasePath: {},
		stylesByLayerName: {},
	},
	runsLayersStates: [],
	ui: {
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
	},
};

// Reset all state before each test
export function resetTestState() {
	beforeEach(() => {
		// Reset loadedData
		Object.assign(loadedData, {
			availableWorkspacesIds: [],
			datasets: [],
			cases: [],
			layersByCaseId: {},
			runsByCaseId: {},
			presetScripts: [],
		});

		// Reset currentWorkspace
		Object.assign(currentWorkspace, {
			id: '',
			name: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			state: structuredClone(initialWorkspaceState),
		});
	});
}
