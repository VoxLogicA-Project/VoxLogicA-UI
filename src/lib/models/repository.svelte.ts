import type { Dataset, Case, Layer, PresetScript, Workspace } from './types';

interface LoadedData {
	availableWorkspacesIds: Workspace['id'][];
	datasets: Dataset[];
	cases: Case[];
	layersByCasePath: Record<Case['path'], Layer[]>;
	presetScripts: PresetScript[];
}

export const loadedData = $state<LoadedData>({
	availableWorkspacesIds: [],
	datasets: [],
	cases: [],
	layersByCasePath: {},
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
	loadedData.layersByCasePath[caseData.path] = await response.json();
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
	// const response = await fetchWithError('/workspaces', 'Failed to fetch workspaces');
	// loadedData.workspacesId = await response.json();
	// Temporarily, we can fetch them from local storage
	loadedData.availableWorkspacesIds = ['id_test', 'id_test2', 'id_test3'];
}

export async function fetchWorkspace(workspaceId: Workspace['id']): Promise<void> {
	// Temporary data structure updated to match new types
	Object.assign(currentWorkspace, {
		id: 'id_test',
		name: 'My first workspace',
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
}
