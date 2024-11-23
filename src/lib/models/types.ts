export interface Dataset {
	id: string;
	layout: string;
}

export interface Case {
	id: string;
	path: string;
}

export interface Layer {
	id: string;
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

export interface PresetScript {
	id: string;
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
	case: Case;
	outputPrint: PrintOutput[];
	outputLayers: Layer[];
	outputLog?: string;
	outputError?: string;
}
