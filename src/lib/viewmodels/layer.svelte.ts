import type { Case, Layer, LayerStyle, LayersState, Run } from '$lib/models/types';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';

const DEFAULT_LAYER_STYLE: LayerStyle = {
	colorMap: 'gray',
	alpha: 1.0,
};

// UI-specific state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Context to determine which layers we're working with
type LayerContext = {
	type: 'dataset' | 'run';
	runId?: Run['id'];
};
let layerContext = $state<LayerContext>({ type: 'dataset' });

const currentLayersByCase = $derived((casePath: Case['path']) => {
	if (layerContext.type === 'dataset') {
		return loadedData.layersByCasePath[casePath] ?? [];
	}
	// For runs, we need to get layers from the specific run
	const runs = loadedData.runsByCasePath[casePath] ?? [];
	const run = runs.find((r) => r.id === layerContext.runId);
	return run?.outputLayers ?? [];
});

const currentLayerState = $derived.by(() => {
	if (layerContext.type === 'dataset') {
		return currentWorkspace.state.datasetLayersState;
	}
	return currentWorkspace.state.runsLayersStates[layerContext.runId ?? ''];
});

// Derived states
const openedLayersPathsByCasePath = $derived(currentLayerState.openedLayersPathsByCasePath);
const stylesByLayerName = $derived(currentLayerState.stylesByLayerName);
const uniqueLayersNames = $derived.by(() => {
	// Return unique layer names from all cases
	const layerNames = new Set<string>();
	currentWorkspace.state.data.openedCasesPaths.forEach((casePath) => {
		const caseLayers = currentLayersByCase(casePath);
		caseLayers.forEach((layer) => {
			layerNames.add(layer.name);
		});
	});
	return Array.from(layerNames);
});

// Queries
const openedLayersByCasePath = $derived((casePath: Case['path']) => {
	return openedLayersPathsByCasePath[casePath]
		?.map((path) => currentLayersByCase(casePath).find((l) => l.path === path))
		.filter((l): l is Layer => l !== undefined);
});

const getSelectedLayers = $derived((casePath: Case['path']) => {
	return openedLayersPathsByCasePath[casePath];
});

const isLayerSelected = $derived((casePath: Case['path'], layerPath: Layer['path']) => {
	const selectedLayers = openedLayersPathsByCasePath[casePath];
	return selectedLayers.includes(layerPath);
});

const isLayerSelectedForAllOpenedCases = $derived((layerName: Layer['name']) => {
	return currentWorkspace.state.data.openedCasesPaths.every((casePath) => {
		if (!openedLayersByCasePath(casePath).some((l) => l.name === layerName)) {
			return false;
		}
		return true;
	});
});

const getAvailableLayerFromName = $derived((casePath: Case['path'], layerName: Layer['name']) => {
	return currentLayersByCase(casePath).find((l) => l.name === layerName);
});

// Context-independent queries
const getAllSelectedLayersNoContext = $derived((casePath: Case['path']) => {
	// Return all opened layers objects from dataset and runs
	const selectedDatasetLayers =
		currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[casePath]
			.map((path) => loadedData.layersByCasePath[casePath].find((l) => l.path === path))
			.filter((l): l is Layer => l !== undefined);
	const selectedRunLayers = Object.values(currentWorkspace.state.runsLayersStates)
		.flatMap((state) => state.openedLayersPathsByCasePath[casePath] ?? [])
		.flatMap(
			(selectedLayerPath) =>
				loadedData.runsByCasePath[casePath]?.flatMap((run) =>
					run.outputLayers.filter((layer) => layer.path === selectedLayerPath)
				) ?? []
		);
	return [...selectedDatasetLayers, ...selectedRunLayers];
});

const getAllSelectedLayersWithLayerStylesNoContext = $derived((casePath: Case['path']) => {
	const selectedDatasetLayersWithStyles =
		currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[casePath]
			.map((path) => loadedData.layersByCasePath[casePath].find((l) => l.path === path))
			.filter((l): l is Layer => l !== undefined)
			.map((layer) => ({
				layer,
				style: currentWorkspace.state.datasetLayersState.stylesByLayerName[layer.name],
			}));

	const selectedRunLayersWithStyles = Object.values(
		currentWorkspace.state.runsLayersStates
	).flatMap((state) => {
		const layerPaths = state.openedLayersPathsByCasePath[casePath] ?? [];
		return layerPaths.flatMap(
			(selectedLayerPath) =>
				loadedData.runsByCasePath[casePath]?.flatMap((run) =>
					run.outputLayers
						.filter((layer) => layer.path === selectedLayerPath)
						.map((layer) => ({
							layer,
							style: state.stylesByLayerName[layer.name],
						}))
				) ?? []
		);
	});

	return [...selectedDatasetLayersWithStyles, ...selectedRunLayersWithStyles];
});

// Actions
function setContext(context: LayerContext): void {
	layerContext = context;
	error = null;
}

function selectLayer(casePath: Case['path'], layerPath: Layer['path']): void {
	const currentLayers = currentLayerState.openedLayersPathsByCasePath[casePath] ?? [];

	if (!currentLayers.includes(layerPath)) {
		currentLayerState.openedLayersPathsByCasePath[casePath] = [...currentLayers, layerPath];
	}
}

function deselectLayer(casePath: Case['path'], layerPath: Layer['path']): void {
	const currentLayers = currentLayerState.openedLayersPathsByCasePath[casePath] ?? [];

	currentLayerState.openedLayersPathsByCasePath[casePath] = currentLayers.filter(
		(path) => path !== layerPath
	);
}

function toggleLayer(casePath: Case['path'], layerPath: Layer['path']): void {
	if (isLayerSelected(casePath, layerPath)) {
		deselectLayer(casePath, layerPath);
	} else {
		selectLayer(casePath, layerPath);
	}
}

function selectLayerForAllOpenedCases(layerName: Layer['name']): void {
	currentWorkspace.state.data.openedCasesPaths.forEach((casePath) => {
		selectLayer(casePath, currentLayersByCase(casePath).find((l) => l.name === layerName)!.path);
	});
}

function deselectLayerForAllOpenedCases(layerName: Layer['name']): void {
	currentWorkspace.state.data.openedCasesPaths.forEach((casePath) => {
		deselectLayer(casePath, currentLayersByCase(casePath).find((l) => l.name === layerName)!.path);
	});
}

function updateLayerStyle(layerName: Layer['name'], style: Partial<LayerStyle>): void {
	currentLayerState.stylesByLayerName[layerName] = {
		...currentLayerState.stylesByLayerName[layerName],
		...style,
	};
}

function reset(): void {
	// Reset the state based on current context
	if (layerContext.type === 'dataset') {
		currentWorkspace.state.datasetLayersState = {
			openedLayersPathsByCasePath: {},
			stylesByLayerName: {},
		};
	} else {
		currentWorkspace.state.runsLayersStates[layerContext.runId ?? ''] = {
			openedLayersPathsByCasePath: {},
			stylesByLayerName: {},
		};
	}

	isLoading = false;
	error = null;
}

// Public API
export const layerViewModel = {
	// Constants
	DEFAULT_LAYER_STYLE,

	// State (readonly)
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get context() {
		return layerContext;
	},
	get stylesByLayerName() {
		return stylesByLayerName;
	},
	get uniqueLayersNames() {
		return uniqueLayersNames;
	},

	// Queries
	currentLayersByCase,
	getSelectedLayers,
	isLayerSelected,
	getAllSelectedLayersNoContext,
	getAllSelectedLayersWithLayerStylesNoContext,
	isLayerSelectedForAllOpenedCases,
	getAvailableLayerFromName,

	// Actions
	setContext,
	selectLayer,
	deselectLayer,
	toggleLayer,
	selectLayerForAllOpenedCases,
	deselectLayerForAllOpenedCases,
	updateLayerStyle,
	reset,
};
