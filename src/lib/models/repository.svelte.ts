import type {
	Dataset,
	Case,
	Layer,
	ExampleScript,
	Run,
	LoadedData,
	Workspace,
	LocalWorkspaceEntry,
} from './types';

// State Management
export const loadedData = $state<LoadedData>({
	availableWorkspacesIdsAndNames: [],
	datasets: [],
	casesByDataset: {},
	layersByCasePath: {},
	runsByCasePath: {},
	exampleScripts: [],
});

export const DEFAULT_WORKSPACE_STATE: Workspace['state'] = {
	data: {
		openedDatasetsNames: [],
		openedCasesPaths: [],
		openedRunsIds: [],
	},
	lastGlobalStylesByLayerName: {},
	datasetLayersState: {
		openedLayersPathsByCasePath: {},
		stylesByLayerName: {},
	},
	runsLayersStates: {},
	ui: {
		isDarkMode: true,
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

	get isNotFound() {
		return this.statusCode === 404;
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
		loadedData.casesByDataset[dataset.name] = await api.fetch<Case[]>(
			`/datasets/${dataset.name}/cases`
		);
	},

	async fetchLayers(case_: Case) {
		loadedData.layersByCasePath[case_.path] = await api.fetch<Layer[]>(case_.path);
	},

	async fetchExampleScripts() {
		loadedData.exampleScripts = await api.fetch<ExampleScript[]>('/scripts');
	},

	async fetchExampleScriptCode(script: ExampleScript) {
		return api.fetchText(script.path);
	},

	async fetchWorkspaces() {
		loadedData.availableWorkspacesIdsAndNames = this.getLocalWorkspaces();
	},

	async fetchWorkspace(workspaceId: Workspace['id']) {
		return api.fetch<Workspace>(`/workspaces/${workspaceId}`);
	},

	async fetchAndLoadWorkspace(workspaceId: Workspace['id']) {
		try {
			const workspace = await this.fetchWorkspace(workspaceId);

			// Reset current state before loading new workspace
			loadedData.datasets = [];
			loadedData.casesByDataset = {};
			loadedData.layersByCasePath = {};
			loadedData.runsByCasePath = {};
			loadedData.exampleScripts = [];

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
		const workspace = await api.fetch<Workspace>('/workspaces', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sourceId: templateWorkspaceId,
				workspace: { name: workspaceName, state: DEFAULT_WORKSPACE_STATE },
			}),
		});

		// Add to localStorage after successful creation
		const localWorkspaces = this.getLocalWorkspaces();
		localWorkspaces.push({ id: workspace.id, name: workspace.name });
		this.saveLocalWorkspaces(localWorkspaces);

		return workspace;
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

	async deleteWorkspace(workspaceId: Workspace['id']) {
		await api.fetch(`/workspaces/${workspaceId}`, {
			method: 'DELETE',
		});

		// Remove from localStorage
		const localWorkspaces = this.getLocalWorkspaces();
		this.saveLocalWorkspaces(localWorkspaces.filter((w) => w.id !== workspaceId));
	},

	getLocalWorkspaces(): LocalWorkspaceEntry[] {
		const stored = localStorage.getItem('workspaces');
		return stored ? JSON.parse(stored) : [];
	},

	saveLocalWorkspaces(workspaces: LocalWorkspaceEntry[]): void {
		localStorage.setItem('workspaces', JSON.stringify(workspaces));
	},

	removeLocalWorkspace(workspaceId: Workspace['id']): void {
		const workspaces = this.getLocalWorkspaces();
		this.saveLocalWorkspaces(workspaces.filter((w) => w.id !== workspaceId));
	},
};

async function loadWorkspaceData(workspace: Workspace) {
	// Load datasets, preset scripts and runs
	await apiRepository.fetchDatasets();
	await apiRepository.fetchExampleScripts();

	// TODO: this could be optimized by fetching only the runs that are needed
	await apiRepository.fetchWorkspaceRuns(workspace.id);

	// Create a Set of required dataset names based on opened cases and explicitly opened datasets
	const requiredDatasets = new Set<string>();

	// Add explicitly opened datasets
	workspace.state.data.openedDatasetsNames.forEach((name) => requiredDatasets.add(name));

	// Find which datasets contain the opened cases
	for (const casePath of workspace.state.data.openedCasesPaths) {
		const datasetName = casePath.split('/')[2]; // Assuming path format is '/datasets/datasetName/...'
		if (datasetName) {
			requiredDatasets.add(datasetName);
		}
	}

	// Load cases for all required datasets
	for (const datasetName of requiredDatasets) {
		const dataset = loadedData.datasets.find((d) => d.name === datasetName);
		if (dataset) {
			await apiRepository.fetchCases(dataset);
		}
	}

	// Load layers for opened cases
	for (const casePath of workspace.state.data.openedCasesPaths) {
		const datasetName = casePath.split('/')[2];
		const case_ = loadedData.casesByDataset[datasetName]?.find((c) => c.path === casePath);
		if (case_) {
			await apiRepository.fetchLayers(case_);
		}
	}
}
