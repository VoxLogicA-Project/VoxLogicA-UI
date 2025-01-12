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

/** Global application state containing all loaded data */
export const loadedData = $state<LoadedData>({
	availableWorkspacesIdsAndNames: [],
	datasets: [],
	casesByDataset: {},
	layersByCasePath: {},
	runsByCasePath: {},
	exampleScripts: [],
});

/** Default state for new workspaces */
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

/** Currently active workspace */
export const currentWorkspace = $state<Workspace>({
	id: '',
	name: '',
	createdAt: new Date(),
	updatedAt: new Date(),
	state: DEFAULT_WORKSPACE_STATE,
});

/** Custom error class for repository-related errors */
export class RepositoryError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'RepositoryError';
		Object.setPrototypeOf(this, RepositoryError.prototype);
	}

	get isNotFound() {
		return this.statusCode === 404;
	}

	get isServerError() {
		return this.statusCode ? this.statusCode >= 500 : false;
	}
}

/** API utility functions for making HTTP requests */
const api = {
	/**
	 * Fetch JSON data from the API
	 * @throws {RepositoryError} If the request fails or returns non-200 status
	 */
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

	/**
	 * Fetch text content from the API
	 * @throws {RepositoryError} If the request fails or returns non-200 status
	 */
	async fetchText(url: string): Promise<string> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new RepositoryError(`Failed to fetch text from ${url}`, response.status);
		}
		return response.text();
	},
} as const;

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
} as const;

async function loadWorkspaceData(workspace: Workspace) {
	// Extract dataset name from case path
	const getDatasetName = (casePath: string) => {
		return casePath.split('/')[2];
	};

	// Get unique dataset names from workspace state
	const getRequiredDatasets = (workspace: Workspace) => {
		const datasets = new Set<string>();

		// Add explicitly opened datasets
		workspace.state.data.openedDatasetsNames.forEach((name) => datasets.add(name));

		// Add datasets from opened cases
		workspace.state.data.openedCasesPaths.forEach((path) => {
			const datasetName = getDatasetName(path);
			if (datasetName) datasets.add(datasetName);
		});

		return datasets;
	};

	try {
		// Load basic data
		await Promise.all([
			apiRepository.fetchDatasets(),
			apiRepository.fetchExampleScripts(),
			apiRepository.fetchWorkspaceRuns(workspace.id), // TODO: this could be optimized by fetching only the runs that are needed
		]);

		// Load required datasets and cases
		const requiredDatasets = getRequiredDatasets(workspace);
		await Promise.all(
			Array.from(requiredDatasets).map(async (datasetName) => {
				const dataset = loadedData.datasets.find((d) => d.name === datasetName);
				if (dataset) await apiRepository.fetchCases(dataset);
			})
		);

		// Load layers for opened cases
		await Promise.all(
			workspace.state.data.openedCasesPaths.map(async (casePath) => {
				const datasetName = getDatasetName(casePath);
				const case_ = loadedData.casesByDataset[datasetName]?.find((c) => c.path === casePath);
				if (case_) await apiRepository.fetchLayers(case_);
			})
		);
	} catch (error) {
		throw new RepositoryError('Failed to load workspace data', undefined, error);
	}
}
