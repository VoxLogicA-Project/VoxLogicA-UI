import { BaseViewModel } from './base.svelte';
import { datasetViewModel } from './dataset.svelte';
import type { Case, Layer, ColorMap, LayerStyle } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { caseViewModel } from './case.svelte';
import { stateManager } from './statemanager.svelte';

export interface LayerState {
	availableByCase: Record<string, Layer[]>;
	selected: Record<string, Layer[]>;
	styles: Record<string, LayerStyle>;
}

const defaultLayerStyle: LayerStyle = {
	colorMap: 'gray',
	alpha: 1.0,
};

export class LayerViewModel extends BaseViewModel {
	private state = $state<LayerState>({
		availableByCase: {},
		selected: {},
		styles: {},
	});

	// State Access Methods
	getState() {
		return this.state;
	}

	get styles() {
		return this.state.styles;
	}

	getAvailableLayersForCase(caseId: string) {
		return this.state.availableByCase[caseId] || [];
	}

	// Layer Lookup Methods
	getAvailableLayerFromId(caseId: string, layerId: string) {
		return this.state.availableByCase[caseId]?.find((l) => l.id === layerId);
	}

	getSelectedLayerFromIds(caseId: string, layerId: string) {
		return this.state.selected[caseId]?.find((l) => l.id === layerId);
	}

	// Derived Properties
	uniqueLayersIds = $derived.by(() => {
		const layerIds = new Set<string>();
		caseViewModel.selectedCases.forEach((caseData) => {
			const caseLayers = this.state.availableByCase[caseData.id] || [];
			caseLayers.forEach((layer) => {
				layerIds.add(layer.id);
			});
		});
		return Array.from(layerIds);
	});

	selectedLayersForCase = $derived((caseId: string) => this.state.selected[caseId] || []);

	selectedLayersWithLayerStylesForCase = $derived((caseId: string) => {
		const layers = this.selectedLayersForCase(caseId);
		return layers.map((layer) => ({
			layer,
			style: this.state.styles[layer.id],
		}));
	});

	isLayerSelectedForAllCases = $derived((layerId: string) => {
		return (
			Object.keys(this.state.selected).length > 0 &&
			Object.values(this.state.selected).every((layers) => layers?.some((l) => l.id === layerId))
		);
	});

	// Layer Loading Methods
	async loadLayersFromDataset(caseData: Case) {
		const dataset = datasetViewModel.selectedDataset;
		if (!dataset) return;

		this.setLoading(true);
		this.setError(null);

		try {
			const layers = await apiRepository.getLayers(dataset, caseData);

			// Initialize default styles for new layers
			layers.forEach((layer) => {
				if (!this.state.styles[layer.id]) {
					this.state.styles[layer.id] = { ...defaultLayerStyle };
				}
			});

			this.state.availableByCase[caseData.id] = layers;
			this.state.selected[caseData.id] = [];
		} catch (error) {
			this.setError(
				error instanceof Error ? error.message : 'Failed to load layers for case ' + caseData.id
			);
		} finally {
			this.setLoading(false);
		}
	}

	async loadLayersFromRun(caseData: Case, runOutputLayers: Layer[]) {
		// Initialize default styles for new layers
		runOutputLayers.forEach((layer) => {
			this.state.styles[layer.id] = { ...defaultLayerStyle };
		});
		this.state.availableByCase[caseData.id] = runOutputLayers;
		stateManager.markAsUnsaved();
	}

	// Layer Selection Methods
	selectLayer(caseId: string, layer: Layer) {
		this.state.selected[caseId] = [...(this.state.selected[caseId] || []), layer];
		stateManager.markAsUnsaved();
	}

	unselectLayer(caseId: string, layer: Layer) {
		const currentLayers = this.state.selected[caseId] || [];
		this.state.selected[caseId] = currentLayers.filter((l) => l.id !== layer.id);
		stateManager.markAsUnsaved();
	}

	toggleLayer(caseId: string, layer: Layer) {
		const currentLayers = this.state.selected[caseId] || [];
		const isSelected = currentLayers.some((l) => l.id === layer.id);

		if (isSelected) {
			this.unselectLayer(caseId, layer);
		} else {
			this.selectLayer(caseId, layer);
		}
	}

	selectLayerForAllSelectedCases(layerId: string) {
		caseViewModel.selectedCases.forEach((caseData) => {
			const layer = this.state.availableByCase[caseData.id]?.find((l) => l.id === layerId);
			if (layer) {
				this.selectLayer(caseData.id, layer);
			}
		});
	}

	unselectLayerForAllSelectedCases(layerId: string) {
		caseViewModel.selectedCases.forEach((caseData) => {
			const layer = this.state.availableByCase[caseData.id]?.find((l) => l.id === layerId);
			if (layer) {
				this.unselectLayer(caseData.id, layer);
			}
		});
	}

	// Layer State Check Methods
	isLayerSelectedForCase(caseId: string, layerId: string) {
		return this.state.selected[caseId]?.some((l) => l.id === layerId);
	}

	// Style Management Methods
	setLayerStyleColor(layerId: string, colorMap: ColorMap | string) {
		this.state.styles[layerId] = {
			...(this.state.styles[layerId] || defaultLayerStyle),
			colorMap: colorMap,
		};
		stateManager.markAsUnsaved();
	}

	setLayerStyleAlpha(layerId: string, alpha: number) {
		this.state.styles[layerId] = {
			...(this.state.styles[layerId] || defaultLayerStyle),
			alpha: alpha,
		};
		stateManager.markAsUnsaved();
	}

	// Cleanup Methods
	removeCaseLayers(caseId: string) {
		delete this.state.availableByCase[caseId];
		delete this.state.selected[caseId];
	}

	reset() {
		this.state.availableByCase = {};
		this.state.selected = {};
		this.state.styles = {};
		this.setError(null);
		this.setLoading(false);
	}
}

export const layerViewModel = new LayerViewModel();
