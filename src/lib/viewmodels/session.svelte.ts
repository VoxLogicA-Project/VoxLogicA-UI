import type { Workspace, SerializedWorkspaceState } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';

// UI-specific state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Track last saved state for comparison
let lastSavedState = $state<SerializedWorkspaceState | null>(null);

// Derived states
const availableWorkspaces = $derived(loadedData.availableWorkspacesIds);
const hasWorkspaces = $derived(availableWorkspaces.length > 0);
const selectedWorkspaceId = $derived(currentWorkspace.id);
const hasUnsavedChanges = $derived.by(() => {
	if (!lastSavedState) return false;
	return !isEqual(lastSavedState, currentWorkspace.state);
});

// Helper function to deep compare states
function isEqual(saved: SerializedWorkspaceState, current: SerializedWorkspaceState): boolean {
	return JSON.stringify(saved) === JSON.stringify(current);
}

// Helper function to safely clone workspace state
function cloneState(state: SerializedWorkspaceState): SerializedWorkspaceState {
	return JSON.parse(JSON.stringify(state));
}

async function loadWorkspaces(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchWorkspaces();
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load workspaces';
	} finally {
		isLoading = false;
	}
}

async function selectWorkspace(workspaceId: Workspace['id']): Promise<void> {
	if (!workspaceId) return;

	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchWorkspace(workspaceId);
		// Store the initial state as last saved state
		lastSavedState = cloneState(currentWorkspace.state);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load workspace';
		lastSavedState = null;
	} finally {
		isLoading = false;
	}
}

async function saveWorkspace(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.saveWorkspace(currentWorkspace);
		// Update last saved state
		lastSavedState = cloneState(currentWorkspace.state);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to save workspace';
	} finally {
		isLoading = false;
	}
}

function reset(): void {
	// Reset workspace state to initial values
	Object.assign(currentWorkspace, {
		id: '',
		name: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		state: {
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
		},
	});

	// Reset loaded data and state tracking
	loadedData.availableWorkspacesIds = [];
	lastSavedState = null;
	isLoading = false;
	error = null;
}

// Public API
export const sessionViewModel = {
	// State (readonly)
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get availableWorkspaces() {
		return availableWorkspaces;
	},
	get hasWorkspaces() {
		return hasWorkspaces;
	},
	get selectedWorkspaceId() {
		return selectedWorkspaceId;
	},
	get hasUnsavedChanges() {
		return hasUnsavedChanges;
	},

	// Actions
	loadWorkspaces,
	selectWorkspace,
	saveWorkspace,
	reset,
};
