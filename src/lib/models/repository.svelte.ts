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

export const DEFAULT_WORKSPACE_STATE: Workspace['state'] = {
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
	state: DEFAULT_WORKSPACE_STATE,
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
		return api.fetch<Workspace>(`/workspaces/${workspaceId}`);
	},

	async fetchAndLoadWorkspace(workspaceId: Workspace['id']) {
		try {
			const workspace = await this.fetchWorkspace(workspaceId);

			// Reset current state before loading new workspace
			loadedData.datasets = [];
			loadedData.cases = [];
			loadedData.layersByCasePath = {};
			loadedData.runsByCasePath = {};
			loadedData.presetScripts = [];

			// Load all required data based on workspace state
			await loadWorkspaceData(workspace);

			// Finally, update the current workspace
			// TODO: we could check if all the selected data is still available
			Object.assign(currentWorkspace, workspace);
		} catch (error) {
			if (error instanceof RepositoryError) throw error;
			throw new RepositoryError('Failed to fetch workspace data', undefined, error);
		}
	},

	async saveWorkspace(workspace: Workspace) {
		await api.fetch(`/workspaces/${workspace.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(workspace),
		});
	},

	async createWorkspace(workspaceName: string, templateWorkspaceId?: Workspace['id']) {
		return api.fetch<Workspace>('/workspaces', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sourceId: templateWorkspaceId,
				workspace: { name: workspaceName, state: DEFAULT_WORKSPACE_STATE },
			}),
		});
	},

	async fetchWorkspaceRuns(workspaceId: Workspace['id']) {
		const runs = await api.fetch<Run[]>(`/workspaces/${workspaceId}/runs`);

		// Process the runs and organize them by case path
		const runsByCasePath: Record<Case['path'], Run[]> = {};

		for (const run of runs) {
			if (!runsByCasePath[run.casePath]) {
				runsByCasePath[run.casePath] = [];
			}
			runsByCasePath[run.casePath].push(run);
		}

		// Update the state
		loadedData.runsByCasePath = runsByCasePath;
	},
};

async function loadWorkspaceData(workspace: Workspace) {
	// Load datasets, preset scripts and runs
	await apiRepository.fetchDatasets();
	await apiRepository.fetchPresetsScripts();

	// TODO: this could be optimized by fetching only the runs that are needed
	await apiRepository.fetchWorkspaceRuns(workspace.id);

	// Load cases if one is opened
	const dataset = loadedData.datasets.find(
		(d) => d.name === workspace.state.data.openedDatasetName
	);
	if (dataset) {
		await apiRepository.fetchCases(dataset);

		// Load layers for each opened case
		for (const casePath of workspace.state.data.openedCasesPaths) {
			const caseData = loadedData.cases.find((c) => c.path === casePath);
			if (caseData) {
				await apiRepository.fetchLayers(caseData);
			}
		}
	}
}
