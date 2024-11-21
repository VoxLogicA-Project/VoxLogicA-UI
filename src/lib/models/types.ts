import type { RgbaColor } from 'svelte-awesome-color-picker';

export interface Dataset {
	id: string;
	layout: string;
}

export interface Case {
	id: string;
	path: string;
}

// TODO: Add name so that we can fix run having layers with same ID
export interface Layer {
	id: string;
	path: string;
}

export interface LayerStyle {
	color?: RgbaColor;
}

export interface PresetScript {
	id: string;
	path: string;
}

// TODO: Use this for runOperations
export interface Run {
	id: string;
	timestamp: Date;
	scriptContent: string;
	case: Case;
	outputPrint: string[];
	outputLayers: Layer[];
	outputLog?: string;
	outputError?: string;
}
