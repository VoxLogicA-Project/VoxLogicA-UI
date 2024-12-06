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
	scriptContent: string;
	outputPrint: PrintOutput[];
	outputLog?: string;
	outputError?: string;
}

export interface LayersState {
	openedLayersPathsByCasePath: Record<Case['path'], Layer['path'][]>;
	stylesByLayerName: Record<Layer['name'], LayerStyle>;
}

export interface SerializedWorkspaceState {
	data: {
		openedDatasetName: Dataset['name'] | null;
		openedCasesPaths: Case['path'][];
		openedRunsIds: Run['id'][];
	};
	datasetLayersState: LayersState;
	runsLayersStates: LayersState[];
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
			bottomPanelTab: string;
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
