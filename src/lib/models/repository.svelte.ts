import type { Dataset, Case, Layer, PresetScript, Workspace, Run } from './types';

interface LoadedData {
	availableWorkspacesIds: Workspace['id'][];
	datasets: Dataset[];
	cases: Case[];
	layersByCasePath: Record<Case['path'], Layer[]>;
	runsByCasePath: Record<Case['path'], Run[]>;
	presetScripts: PresetScript[];
}

export const loadedData = $state<LoadedData>({
	availableWorkspacesIds: [],
	datasets: [],
	cases: [],
	layersByCasePath: {},
	runsByCasePath: {},
	presetScripts: [],
});

export const currentWorkspace = $state<Workspace>({
	id: 'test',
	name: 'Test',
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
		runsLayersStates: {},
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
				bottomPanelBlinkingTab: null,
			},
			scriptEditor: {
				content: '',
			},
		},
	},
});

export class RepositoryError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'RepositoryError';
	}
}

async function fetchWithError(url: string, defaultErrorMessage: string): Promise<Response> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			const errorData = await response.json();
			throw new RepositoryError(errorData?.message || defaultErrorMessage, response.status);
		}
		return response;
	} catch (error) {
		if (error instanceof RepositoryError) {
			throw error;
		}
		throw new RepositoryError(defaultErrorMessage, undefined, error);
	}
}

async function fetchDatasets(): Promise<void> {
	const response = await fetchWithError('/datasets', 'Failed to fetch datasets');
	loadedData.datasets = await response.json();
}

async function fetchCases(dataset: Dataset): Promise<void> {
	const response = await fetchWithError(
		`/datasets/${dataset.name}/cases`,
		`Failed to fetch cases for dataset: ${dataset.name}`
	);
	loadedData.cases = await response.json();
}

async function fetchLayers(caseData: Case): Promise<void> {
	const response = await fetchWithError(
		caseData.path,
		`Failed to fetch layers for case: ${caseData.path}`
	);
	loadedData.layersByCasePath[caseData.path] = await response.json();
}

async function fetchPresetsScripts(): Promise<void> {
	const response = await fetchWithError('/scripts', 'Failed to fetch scripts');
	loadedData.presetScripts = await response.json();
}

async function fetchPresetScriptCode(script: PresetScript): Promise<string> {
	const response = await fetchWithError(script.path, `Failed to fetch script: ${script.name}`);
	return response.text();
}

async function fetchWorkspaces(): Promise<void> {
	const response = await fetchWithError('/workspaces', 'Failed to fetch workspaces');
	loadedData.availableWorkspacesIds = await response.json();
}

async function fetchWorkspace(workspaceId: Workspace['id']): Promise<void> {
	const response = await fetchWithError(
		`/workspaces/${workspaceId}`,
		`Failed to fetch workspace: ${workspaceId}`
	);
	Object.assign(currentWorkspace, await response.json());
}

async function saveWorkspace(workspace: Workspace): Promise<void> {
	// TODO: Handle method/headers/body in fetchWithError
	const response = await fetch(`/workspaces/${workspace.id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(workspace),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		throw new RepositoryError(
			errorData?.message || `Failed to save workspace: ${workspace.id}`,
			response.status
		);
	}
}

async function createWorkspace(
	workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Workspace> {
	const response = await fetch('/workspaces', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(workspace),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new RepositoryError(errorData?.message || 'Failed to create workspace', response.status);
	}

	return response.json();
}

async function fetchWorkspaceRuns(workspaceId: Workspace['id']): Promise<void> {
	const response = await fetchWithError(
		`/workspaces/${workspaceId}/runs`,
		`Failed to fetch runs for workspace: ${workspaceId}`
	);

	// Process the runs and organize them by case ID
	const runs = await response.json();
	const runsByCasePath: Record<Case['path'], Run[]> = {};

	// TODO: Fix this, is not working.
	for (const run of runs) {
		for (const casePath of Object.keys(run.caseResults)) {
			if (!runsByCasePath[casePath]) {
				runsByCasePath[casePath] = [];
			}
			runsByCasePath[casePath].push({
				...run,
				...run.caseResults[casePath],
			});
		}
	}

	loadedData.runsByCasePath = runsByCasePath;
}

async function fetchRunLayers(
	workspaceId: Workspace['id'],
	caseId: Case['id'],
	runId: Run['id']
): Promise<Layer[]> {
	const response = await fetchWithError(
		`/workspaces/${workspaceId}/runs/${caseId}/${runId}/layers`,
		`Failed to fetch layers for run: ${runId}`
	);
	return await response.json();
}

// Public API
export const apiRepository = {
	fetchDatasets,
	fetchCases,
	fetchLayers,
	fetchPresetsScripts,
	fetchPresetScriptCode,
	fetchWorkspaces,
	fetchWorkspace,
	saveWorkspace,
	createWorkspace,
	fetchWorkspaceRuns,
	fetchRunLayers,
};
