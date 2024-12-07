import type { Case, Layer, LayerStyle, LayersState } from '$lib/models/types';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';

// UI-specific state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Context to determine which layers we're working with
type LayerContext = {
	type: 'dataset' | 'run';
	runIndex?: number;
};
let layerContext = $state<LayerContext>({ type: 'dataset' });

const currentLayersByCase = $derived.by(() => {
	return (caseId: Case['id']) => {
		if (layerContext.type === 'dataset') {
			return loadedData.layersByCaseId[caseId] ?? [];
		}
		// For runs, we need to get layers from the specific run
		const runs = loadedData.runsByCaseId[caseId] ?? [];
		const run = runs[layerContext.runIndex ?? 0];
		return run?.outputLayers ?? [];
	};
});
const currentLayerState = $derived.by(() => {
	if (layerContext.type === 'dataset') {
		return currentWorkspace.state.datasetLayersState;
	}
	return currentWorkspace.state.runsLayersStates[layerContext.runIndex ?? 0];
});

// Derived states
const selectedLayersByCase = $derived(currentLayerState.openedLayersPathsByCasePath);
const layerStyles = $derived(currentLayerState.stylesByLayerName);

// Queries
const getLayerStyle = $derived((layerName: Layer['name']) => {
	return layerStyles[layerName];
});

const getSelectedLayers = $derived((casePath: Case['path']) => {
	return selectedLayersByCase[casePath] ?? [];
});

const isLayerSelected = $derived((casePath: Case['path'], layerPath: Layer['path']) => {
	const selectedLayers = selectedLayersByCase[casePath] ?? [];
	return selectedLayers.includes(layerPath);
});

// Actions
function setContext(context: LayerContext): void {
	layerContext = context;
	error = null;
}

function selectLayer(casePath: Case['path'], layer: Layer): void {
	const currentLayers = currentLayerState.openedLayersPathsByCasePath[casePath] ?? [];

	if (!currentLayers.includes(layer.path)) {
		currentLayerState.openedLayersPathsByCasePath[casePath] = [...currentLayers, layer.path];
	}
}

function deselectLayer(casePath: Case['path'], layer: Layer): void {
	const currentLayers = currentLayerState.openedLayersPathsByCasePath[casePath] ?? [];

	currentLayerState.openedLayersPathsByCasePath[casePath] = currentLayers.filter(
		(path) => path !== layer.path
	);
}

function toggleLayer(casePath: Case['path'], layer: Layer): void {
	if (isLayerSelected(casePath, layer.path)) {
		deselectLayer(casePath, layer);
	} else {
		selectLayer(casePath, layer);
	}
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
		const runIndex = layerContext.runIndex ?? 0;
		currentWorkspace.state.runsLayersStates[runIndex] = {
			openedLayersPathsByCasePath: {},
			stylesByLayerName: {},
		};
	}

	isLoading = false;
	error = null;
}

// Public API
export const layerViewModel = {
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

	// Queries
	currentLayersByCase,
	getLayerStyle,
	getSelectedLayers,
	isLayerSelected,

	// Actions
	setContext,
	selectLayer,
	deselectLayer,
	toggleLayer,
	updateLayerStyle,
	reset,
};
