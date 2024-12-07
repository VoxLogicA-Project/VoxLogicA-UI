import type { Workspace, SerializedWorkspaceState } from '$lib/models/types';
import { loadedData, currentWorkspace, apiRepository } from '$lib/models/repository.svelte';

// UI-specific state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived states
const availableWorkspacesIdsAndNames = $derived(loadedData.availableWorkspacesIdsAndNames);
const hasWorkspaces = $derived(availableWorkspacesIdsAndNames.length > 0);
const selectedWorkspaceId = $derived(currentWorkspace.id);
const selectedWorkspaceName = $derived(currentWorkspace.name);
const hasUnsavedChanges = $state(true);
const isWorkspaceSelected = $derived(!!selectedWorkspaceId);

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
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load workspace';
	} finally {
		isLoading = false;
	}
}

async function saveWorkspace(): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.saveWorkspace(currentWorkspace);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to save workspace';
	} finally {
		isLoading = false;
	}
}

async function createWorkspace(workspaceName: Workspace['name']): Promise<Workspace> {
	isLoading = true;
	error = null;

	try {
		const newWorkspace = await apiRepository.createWorkspace(workspaceName);
		return newWorkspace;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to create workspace';
		throw e;
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
	loadedData.availableWorkspacesIdsAndNames = [];
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
	get availableWorkspacesIdsAndNames() {
		return availableWorkspacesIdsAndNames;
	},
	get hasWorkspaces() {
		return hasWorkspaces;
	},
	get selectedWorkspaceId() {
		return selectedWorkspaceId;
	},
	get selectedWorkspaceName() {
		return selectedWorkspaceName;
	},
	get hasUnsavedChanges() {
		return hasUnsavedChanges;
	},
	get isWorkspaceSelected() {
		return isWorkspaceSelected;
	},

	// Actions
	loadWorkspaces,
	selectWorkspace,
	saveWorkspace,
	createWorkspace,
	reset,
};
