import type { RgbaColor } from 'svelte-awesome-color-picker';

export interface Dataset {
	id: string;
	layout: string;
	path: string;
}

export interface Case {
	id: string;
	path: string;
}

export interface Layer {
	id: string;
	path: string;
}

export interface LayerStyle {
	color?: RgbaColor;
}

export interface Script {
	id: string;
	path: string;
}
