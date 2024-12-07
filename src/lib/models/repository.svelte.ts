import type { Dataset, Case, Layer, PresetScript, Workspace, Run } from './types';

interface LoadedData {
	availableWorkspacesIds: Workspace['id'][];
	datasets: Dataset[];
	cases: Case[];
	layersByCaseId: Record<Case['id'], Layer[]>;
	runsByCaseId: Record<Case['id'], Run[]>;
	presetScripts: PresetScript[];
}

export const loadedData = $state<LoadedData>({
	availableWorkspacesIds: [],
	datasets: [],
	cases: [],
	layersByCaseId: {},
	runsByCaseId: {},
	presetScripts: [],
});

export const currentWorkspace = $state<Workspace>({
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

export async function fetchDatasets(): Promise<void> {
	const response = await fetchWithError('/datasets', 'Failed to fetch datasets');
	loadedData.datasets = await response.json();
}

export async function fetchCases(dataset: Dataset): Promise<void> {
	const response = await fetchWithError(
		`/datasets/${dataset.name}/cases`,
		`Failed to fetch cases for dataset: ${dataset.name}`
	);
	loadedData.cases = await response.json();
}

export async function fetchLayers(dataset: Dataset, caseData: Case): Promise<void> {
	const response = await fetchWithError(
		`/datasets/${dataset.name}/cases/${caseData.name}/layers`,
		`Failed to fetch layers for case: ${caseData.path}`
	);
	loadedData.layersByCaseId[caseData.id] = await response.json();
}

export async function fetchPresetsScripts(): Promise<void> {
	const response = await fetchWithError('/scripts', 'Failed to fetch scripts');
	loadedData.presetScripts = await response.json();
}

export async function fetchPresetScriptCode(script: PresetScript): Promise<string> {
	const response = await fetchWithError(script.path, `Failed to fetch script: ${script.name}`);
	return response.text();
}

export async function fetchWorkspaces(): Promise<void> {
	const response = await fetchWithError('/workspaces', 'Failed to fetch workspaces');
	loadedData.availableWorkspacesIds = await response.json();
}

export async function fetchWorkspace(workspaceId: Workspace['id']): Promise<void> {
	const response = await fetchWithError(
		`/workspaces/${workspaceId}`,
		`Failed to fetch workspace: ${workspaceId}`
	);
	Object.assign(currentWorkspace, await response.json());
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
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

export async function createWorkspace(
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

export async function fetchWorkspaceRuns(workspaceId: Workspace['id']): Promise<void> {
	const response = await fetchWithError(
		`/workspaces/${workspaceId}/runs`,
		`Failed to fetch runs for workspace: ${workspaceId}`
	);

	// Process the runs and organize them by case ID
	const runs = await response.json();
	const runsByCaseId: Record<Case['id'], Run[]> = {};

	for (const run of runs) {
		for (const caseId of Object.keys(run.caseResults)) {
			if (!runsByCaseId[caseId]) {
				runsByCaseId[caseId] = [];
			}
			runsByCaseId[caseId].push({
				...run,
				...run.caseResults[caseId],
			});
		}
	}

	loadedData.runsByCaseId = runsByCaseId;
}

export async function fetchRunLayers(
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
