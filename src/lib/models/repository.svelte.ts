import type { Dataset, Case, Layer, PresetScript, Workspace, Run } from './types';

// Types
interface LoadedData {
	availableWorkspacesIdsAndNames: { id: Workspace['id']; name: Workspace['name'] }[];
	datasets: Dataset[];
	cases: Case[];
	layersByCasePath: Record<Case['path'], Layer[]>;
	runsByCasePath: Record<Case['path'], Run[]>;
	presetScripts: PresetScript[];
}

// State Management
export const loadedData = $state<LoadedData>({
	availableWorkspacesIdsAndNames: [],
	datasets: [],
	cases: [],
	layersByCasePath: {},
	runsByCasePath: {},
	presetScripts: [],
});

const initialWorkspaceState: Workspace['state'] = {
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
			layerContext: { type: 'dataset' },
		},
		scriptEditor: {
			content: '',
		},
	},
};

export const currentWorkspace = $state<Workspace>({
	id: '',
	name: '',
	createdAt: new Date(),
	updatedAt: new Date(),
	state: initialWorkspaceState,
});

// Error Handling
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

// API Utilities
const api = {
	async fetch<T>(url: string, options?: RequestInit): Promise<T> {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new RepositoryError(
					errorData?.message || `API Error: ${response.statusText}`,
					response.status
				);
			}
			return response.json();
		} catch (error) {
			if (error instanceof RepositoryError) throw error;
			throw new RepositoryError('Failed to fetch data', undefined, error);
		}
	},

	async fetchText(url: string): Promise<string> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new RepositoryError(`Failed to fetch text from ${url}`, response.status);
		}
		return response.text();
	},
};

// Repository Functions
export const apiRepository = {
	async fetchDatasets() {
		loadedData.datasets = await api.fetch<Dataset[]>('/datasets');
	},

	async fetchCases(dataset: Dataset) {
		loadedData.cases = await api.fetch<Case[]>(`/datasets/${dataset.name}/cases`);
	},

	async fetchLayers(caseData: Case) {
		loadedData.layersByCasePath[caseData.path] = await api.fetch<Layer[]>(caseData.path);
	},

	async fetchPresetsScripts() {
		loadedData.presetScripts = await api.fetch<PresetScript[]>('/scripts');
	},

	async fetchPresetScriptCode(script: PresetScript) {
		return api.fetchText(script.path);
	},

	async fetchWorkspaces() {
		loadedData.availableWorkspacesIdsAndNames =
			await api.fetch<Array<Pick<Workspace, 'id' | 'name'>>>('/workspaces');
	},

	async fetchWorkspace(workspaceId: Workspace['id']) {
		const workspace = await api.fetch<Workspace>(`/workspaces/${workspaceId}`);
		Object.assign(currentWorkspace, workspace);
	},

	async saveWorkspace(workspace: Workspace) {
		await api.fetch(`/workspaces/${workspace.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(workspace),
		});
	},

	async createWorkspace(workspaceName: string) {
		const newWorkspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> = {
			name: workspaceName,
			state: initialWorkspaceState,
		};

		return api.fetch<Workspace>('/workspaces', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newWorkspace),
		});
	},

	async fetchWorkspaceRuns(workspaceId: Workspace['id']) {
		const runs = await api.fetch<Run[]>(`/workspaces/${workspaceId}/runs`);

		// Process the runs and organize them by case ID
		const runsByCasePath: Record<Case['path'], Run[]> = {};

		// TODO: Fix this, is not working.
		// for (const run of runs) {
		// 	for (const casePath of Object.keys(run.caseResults)) {
		// 		if (!runsByCasePath[casePath]) {
		// 			runsByCasePath[casePath] = [];
		// 		}
		// 		runsByCasePath[casePath].push({
		// 			...run,
		// 			...run.caseResults[casePath],
		// 		});
		// 	}
		// }
	},

	async fetchRunLayers(workspaceId: Workspace['id'], caseId: Case['id'], runId: Run['id']) {
		return api.fetch<Layer[]>(`/workspaces/${workspaceId}/runs/${caseId}/${runId}/layers`);
	},
};
