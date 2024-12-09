import type { Case, Layer, LayerStyle, Run } from '$lib/models/types';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';

const DEFAULT_LAYER_STYLE: LayerStyle = {
	colorMap: 'gray',
	alpha: 1.0,
};

// UI state
let isLoading = $state(false);
let error = $state<string | null>(null);

// Context-dependent states
const currentLayersByCase = $derived((casePath: Case['path']) => {
	if (currentWorkspace.state.ui.layers.layerContext.type === 'dataset') {
		return loadedData.layersByCasePath[casePath] ?? [];
	}
	// For runs, we need to get layers from the specific run
	const runs = loadedData.runsByCasePath[casePath] ?? [];
	const run = runs.find((r) => r.id === currentWorkspace.state.ui.layers.layerContext.runId);
	return run?.outputLayers ?? [];
});
const currentLayerState = $derived.by(() => {
	if (currentWorkspace.state.ui.layers.layerContext.type === 'dataset') {
		return currentWorkspace.state.datasetLayersState;
	}
	return currentWorkspace.state.runsLayersStates[
		currentWorkspace.state.ui.layers.layerContext.runId ?? ''
	];
});

// Derived states
const openedLayersPathsByCasePath = $derived(currentLayerState.openedLayersPathsByCasePath);
const stylesByLayerName = $derived(currentLayerState.stylesByLayerName);
const datasetUniqueLayersNames = $derived.by(() => {
	if (currentWorkspace.state.data.openedCasesPaths.length === 0) {
		return [];
	}

	const layerNames = new Set<string>();
	currentWorkspace.state.data.openedCasesPaths.forEach((casePath) => {
		const caseLayers = loadedData.layersByCasePath[casePath] ?? [];
		caseLayers.forEach((layer) => {
			layerNames.add(layer.name);
		});
	});
	return Array.from(layerNames);
});
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
	const selectedLayers = openedLayersPathsByCasePath[casePath] ?? [];
	return selectedLayers.includes(layerPath);
});

const isLayerSelectedForAllOpenedCases = $derived((layerName: Layer['name']) => {
	return currentWorkspace.state.data.openedCasesPaths.every((casePath) => {
		// Get available layers for this case
		const availableLayers = currentLayersByCase(casePath);
		// If layer doesn't exist in this case, consider it as selected
		if (!availableLayers.some((l) => l.name === layerName)) {
			return true;
		}
		// Otherwise check if it's in the opened layers
		const layers = openedLayersByCasePath(casePath) ?? [];
		return layers.some((l) => l.name === layerName);
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
			?.map((path) => loadedData.layersByCasePath[casePath].find((l) => l.path === path))
			.filter((l): l is Layer => l !== undefined) ?? [];

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
			?.map((path) => loadedData.layersByCasePath[casePath].find((l) => l.path === path))
			.filter((l): l is Layer => l !== undefined)
			.map((layer) => ({
				layer,
				style: currentWorkspace.state.datasetLayersState.stylesByLayerName[layer.name],
			})) ?? [];

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
function selectLayer(casePath: Case['path'], layerPath: Layer['path']): void {
	const currentLayers = currentLayerState.openedLayersPathsByCasePath[casePath];

	if (!currentLayers) {
		currentLayerState.openedLayersPathsByCasePath[casePath] = [layerPath];
	} else if (!currentLayers.includes(layerPath)) {
		currentLayerState.openedLayersPathsByCasePath[casePath].push(layerPath);
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
	if (currentWorkspace.state.ui.layers.layerContext.type === 'dataset') {
		currentWorkspace.state.datasetLayersState = {
			openedLayersPathsByCasePath: {},
			stylesByLayerName: {},
		};
	} else {
		currentWorkspace.state.runsLayersStates[
			currentWorkspace.state.ui.layers.layerContext.runId ?? ''
		] = {
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
	get stylesByLayerName() {
		return stylesByLayerName;
	},
	get datasetUniqueLayersNames() {
		return datasetUniqueLayersNames;
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
	selectLayer,
	deselectLayer,
	toggleLayer,
	selectLayerForAllOpenedCases,
	deselectLayerForAllOpenedCases,
	updateLayerStyle,
	reset,
};
