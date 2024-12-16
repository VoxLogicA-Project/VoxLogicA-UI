import { beforeEach } from 'vitest';
import {
	loadedData,
	currentWorkspace,
	DEFAULT_WORKSPACE_STATE,
} from '$lib/models/repository.svelte';

// Reset all state before each test
export function resetTestState() {
	beforeEach(() => {
		// Reset loadedData
		Object.assign(loadedData, {
			availableWorkspacesIdsAndNames: [],
			datasets: [],
			casesByDataset: {},
			layersByCasePath: {},
			runsByCasePath: {},
			exampleScripts: [],
		});

		// Reset currentWorkspace with a deep clone of DEFAULT_WORKSPACE_STATE
		Object.assign(currentWorkspace, {
			id: '',
			name: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			state: structuredClone(DEFAULT_WORKSPACE_STATE),
		});
	});
}
