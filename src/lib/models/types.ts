export interface Dataset {
	name: string;
	layout: string;
}

export interface Case {
	name: string;
	path: string;
}

export interface Layer {
	name: string;
	path: string;
}

export interface ColorMap {
	R: number[];
	G: number[];
	B: number[];
	A: number[];
	I: number[];
}

export interface LayerStyle {
	colorMap: ColorMap | string; // Either a color map or a string representing a color map name
	alpha: number;
}

export interface PresetScript {
	name: string;
	path: string;
}

export interface PrintOutput {
	name: string;
	vltype: string;
	value: string;
}

export interface Run {
	id: string;
	timestamp: Date;
	casePath: Case['path'];
	scriptContent: string;
	outputLayers: Layer[];
	outputPrint: PrintOutput[];
	outputLog?: string;
	outputError?: string;
}

export interface LoadedData {
	availableWorkspacesIdsAndNames: LocalWorkspaceEntry[];
	datasets: Dataset[];
	casesByDataset: Record<Dataset['name'], Case[]>;
	layersByCasePath: Record<Case['path'], Layer[]>;
	runsByCasePath: Record<Case['path'], Run[]>;
	presetScripts: PresetScript[];
}

export interface LayersState {
	openedLayersPathsByCasePath: Record<Case['path'], Layer['path'][]>;
	stylesByLayerName: Record<Layer['name'], LayerStyle>;
}

export interface LayerContext {
	type: 'dataset' | 'run';
	runId?: Run['id'];
}

export interface SerializedWorkspaceState {
	data: {
		openedDatasetsNames: Dataset['name'][]; // TODO: we actually don't need them here: right now it's just used for expanding/collapsing the datasets in the UI
		openedCasesPaths: Case['path'][];
		openedRunsIds: Run['id'][];
	};
	datasetLayersState: LayersState;
	runsLayersStates: Record<Run['id'], LayersState>;
	ui: {
		isDarkMode: boolean;
		sidebars: {
			datasetCollapsed: boolean;
			layerCollapsed: boolean;
			scriptCollapsed: boolean;
		};
		viewers: {
			fullscreenCasePath: Case['path'] | null;
		};
		layers: {
			layerContext: LayerContext;
		};
		scriptEditor: {
			content: string;
		};
	};
}

export interface Workspace {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	state: SerializedWorkspaceState;
}

export interface LocalWorkspaceEntry {
	id: Workspace['id'];
	name: Workspace['name'];
}
