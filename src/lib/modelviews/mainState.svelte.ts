import type { Dataset, Case, Layer, LayerStyle, Script } from '$lib/models/types';

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
	scriptSidebarCollapsed: boolean;
	isDarkMode: boolean;
}

interface ScriptsState {
	availablePresets: Script[];
	selectedPreset: Script | null;
	editorContent: string;
	loading: boolean;
	error: string | null;
}

export interface MainState {
	datasets: DatasetsState;
	cases: CasesState;
	layers: LayersState;
	ui: UIState;
	scripts: ScriptsState;
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
		scriptSidebarCollapsed: false,
		isDarkMode: false,
	},
	scripts: {
		availablePresets: [],
		selectedPreset: null,
		editorContent: '',
		loading: false,
		error: null,
	},
});
