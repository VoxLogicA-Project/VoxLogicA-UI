import type { Dataset, Case, Layer, LayerStyle } from '$lib/models/types';

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
	isDarkMode: boolean;
}

export interface MainState {
	datasets: DatasetsState;
	cases: CasesState;
	layers: LayersState;
	ui: UIState;
}

export const mainState = $state<MainState>({
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
		isDarkMode: false,
	},
});
