import type { Workspace } from '$lib/models/types';
import {
	loadedData,
	currentWorkspace,
	apiRepository,
	DEFAULT_WORKSPACE_STATE,
} from '$lib/models/repository.svelte';

// UI state
let isLoading = $state(false);
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

async function selectWorkspace(workspaceId: Workspace['id']): Promise<void> {
	if (!workspaceId) return;

	isLoading = true;
	error = null;

	try {
		await apiRepository.fetchWorkspace(workspaceId);
		lastSavedState = JSON.stringify(currentWorkspace);
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
		lastSavedState = JSON.stringify(currentWorkspace);
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
	Object.assign(currentWorkspace, DEFAULT_WORKSPACE_STATE);

	// Reset loaded data and state tracking
	loadedData.availableWorkspacesIdsAndNames = [];
	isLoading = false;
	error = null;
	lastSavedState = '';
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
		return !!selectedWorkspaceId;
	},

	// Actions
	loadWorkspaces,
	selectWorkspace,
	saveWorkspace,
	createWorkspace,
	reset,
};
