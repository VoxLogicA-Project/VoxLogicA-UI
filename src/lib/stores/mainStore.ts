import type { Dataset, Case, Layer, LayerStyle } from '$lib/models/types';
import { writable } from 'svelte/store';

interface DatasetsState {
	available: Dataset[];
	selected: Dataset | null;
	loading: boolean;
	error: string | null;
}

interface CasesState {
	available: Case[];
	selected: Case[];
	maxCases: number;
	loading: boolean;
	error: string | null;
}

interface LayersState {
	availableByCase: Record<string, Layer[]>;
	selected: Record<string, Layer[]>;
	styles: Record<string, LayerStyle>;
	loading: boolean;
	error: string | null;
}

interface UIState {
	datasetSidebarCollapsed: boolean;
	layerSidebarCollapsed: boolean;
}

export interface MainState {
	datasets: DatasetsState;
	cases: CasesState;
	layers: LayersState;
	ui: UIState;
}

const initialState: MainState = {
	datasets: {
		available: [],
		selected: null,
		loading: false,
		error: null,
	},
	cases: {
		available: [],
		selected: [],
		maxCases: 16,
		loading: false,
		error: null,
	},
	layers: {
		availableByCase: {},
		selected: {},
		styles: {},
		loading: false,
		error: null,
	},
	ui: {
		datasetSidebarCollapsed: false,
		layerSidebarCollapsed: false,
	},
};

function logStateChange(prev: MainState, next: MainState) {
	console.group('[MainStore] State Change');

	// Log datasets changes
	if (prev.datasets !== next.datasets) {
		console.log('Datasets changed:', {
			prev: prev.datasets,
			next: next.datasets,
		});
	}

	// Log cases changes
	if (prev.cases !== next.cases) {
		console.log('Cases changed:', {
			prev: prev.cases,
			next: next.cases,
		});
	}

	// Log layers changes
	if (prev.layers !== next.layers) {
		console.log('Layers changed:', {
			prev: prev.layers,
			next: next.layers,
		});
	}

	// Log UI changes
	if (prev.ui !== next.ui) {
		console.log('UI changed:', {
			prev: prev.ui,
			next: next.ui,
		});
	}

	console.groupEnd();
}

let previousState = initialState;
export const mainStore = writable<MainState>(initialState);

// Add subscription with detailed logging
mainStore.subscribe((state) => {
	logStateChange(previousState, state);
	previousState = state;
});
