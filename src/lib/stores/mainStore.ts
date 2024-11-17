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

export const mainStore = writable<MainState>(initialState);

// Add subscription with detailed logging
mainStore.subscribe((state) => {
	console.log(state);
});
