import type { LocalWorkspaceEntry, Workspace } from '$lib/models/types';
import {
	loadedData,
	currentWorkspace,
	apiRepository,
	DEFAULT_WORKSPACE_STATE,
} from '$lib/models/repository.svelte';

// UI state
let isSaving = $state(false);
let isLoading = $state(false);
let errorSaving = $state<string | null>(null);
let error = $state<string | null>(null);

// Derived states
const availableWorkspacesIdsAndNames = $derived(loadedData.availableWorkspacesIdsAndNames);

const hasWorkspaces = $derived(availableWorkspacesIdsAndNames.length > 0);

const selectedWorkspaceId = $derived(currentWorkspace.id);

const selectedWorkspaceName = $derived(currentWorkspace.name);

// Store the initial state snapshot when workspace is loaded
let lastSavedState = $state.raw<string>('');

const hasUnsavedChanges = $derived.by(() => {
	// Skip comparison if no workspace is selected
	if (!selectedWorkspaceId) return false;

	// Compare current state with last saved state
	const currentState = JSON.stringify(currentWorkspace);
	return currentState !== lastSavedState;
});

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

async function getWorkspace(workspaceId: Workspace['id']): Promise<Workspace> {
	isLoading = true;
	error = null;

	try {
		const workspace = await apiRepository.fetchWorkspace(workspaceId);
		return workspace;
	} finally {
		isLoading = false;
	}
}

async function createWorkspace(
	workspaceName: Workspace['name'],
	templateWorkspaceId?: Workspace['id']
): Promise<Workspace> {
	isLoading = true;
	error = null;

	try {
		const newWorkspace = await apiRepository.createWorkspace(workspaceName, templateWorkspaceId);
		return newWorkspace;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to create workspace';
		throw e;
	} finally {
		isLoading = false;
	}
}

async function selectWorkspace(workspaceId: Workspace['id']): Promise<void> {
	if (!workspaceId) return;

	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchAndLoadWorkspace(workspaceId);
		lastSavedState = JSON.stringify(currentWorkspace);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load workspace';
	} finally {
		isLoading = false;
	}
}

async function saveWorkspace(): Promise<void> {
	isSaving = true;
	errorSaving = null;

	try {
		await apiRepository.saveWorkspace(currentWorkspace);
		lastSavedState = JSON.stringify(currentWorkspace);
	} catch (e) {
		errorSaving =
			e instanceof Error
				? e.message
				: 'Failed to save workspace. Please check your internet connection and that the service is running.';
	} finally {
		isSaving = false;
	}
}

async function deleteWorkspace(workspaceId: Workspace['id']): Promise<void> {
	isLoading = true;
	error = null;

	try {
		await apiRepository.deleteWorkspace(workspaceId);

		// If we're deleting the current workspace, reset the state
		if (workspaceId === currentWorkspace.id) {
			reset();
		}

		// Refresh the workspace list
		await loadWorkspaces();
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to delete workspace';
		throw e;
	} finally {
		isLoading = false;
	}
}

function getLocalWorkspaces(): LocalWorkspaceEntry[] {
	return apiRepository.getLocalWorkspaces();
}

function saveLocalWorkspaces(workspaces: LocalWorkspaceEntry[]): void {
	apiRepository.saveLocalWorkspaces(workspaces);
}

function removeLocalWorkspace(workspaceId: Workspace['id']): void {
	apiRepository.removeLocalWorkspace(workspaceId);

	// If we're removing the current workspace, reset the state
	if (workspaceId === currentWorkspace.id) {
		reset();
	}
}

function reset(): void {
	// Reset workspace state to initial values
	currentWorkspace.id = '';
	currentWorkspace.name = '';
	Object.assign(currentWorkspace, DEFAULT_WORKSPACE_STATE);

	loadedData.availableWorkspacesIdsAndNames = [];
	loadedData.datasets = [];
	loadedData.casesByDataset = {};
	loadedData.layersByCasePath = {};
	loadedData.runsByCasePath = {};
	loadedData.exampleScripts = [];

	isLoading = false;
	error = null;
	lastSavedState = '';
}

// Public API
export const sessionViewModel = {
	// States (readonly)
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
		return !!selectedWorkspaceId;
	},
	get isSaving() {
		return isSaving;
	},
	get errorSaving() {
		return errorSaving;
	},

	// Actions
	loadWorkspaces,
	getWorkspace,
	createWorkspace,
	selectWorkspace,
	saveWorkspace,
	deleteWorkspace,
	getLocalWorkspaces,
	saveLocalWorkspaces,
	removeLocalWorkspace,
	reset,
} as const;
