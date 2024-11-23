import { BaseViewModel } from './base.svelte';
import { datasetViewModel } from './dataset.svelte';
import type { Case, Layer, ColorMap } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { caseViewModel } from './case.svelte';

export interface LayerState {
	availableByCase: Record<string, Layer[]>;
	selected: Record<string, Layer[]>;
	styles: Record<string, ColorMap | string>; // string is the name of the preset colormap
}

const defaultColorMap = 'gray';

export class LayerViewModel extends BaseViewModel {
	private state = $state<LayerState>({
		availableByCase: {},
		selected: {},
		styles: {},
	});

	getState() {
		return this.state;
	}

	getLayerIdFromName(layerName: string) {
		// We trust that for each layer name there is only one layer id
		// Remember: layer names were introduced to allow ids to be distinguished between runs.
		const layerId = Object.values(this.state.availableByCase)
			.flat()
			.find((l) => l.name === layerName)?.id;
		console.log('layerName', layerName);
		console.log('layerId', layerId);
		return layerId;
	}

	getSelectedLayerFromIds(caseId: string, layerId: string) {
		return this.state.selected[caseId]?.find((l) => l.id === layerId);
	}

	get styles() {
		// For the colorPicker to bind
		return this.state.styles;
	}

	uniqueLayersNames = $derived.by(() => {
		const layerNames = new Set<string>();
		caseViewModel.selectedCases.forEach((caseData) => {
			const caseLayers = this.state.availableByCase[caseData.id] || [];
			caseLayers.forEach((layer) => {
				layerNames.add(layer.name);
			});
		});
		return Array.from(layerNames);
	});

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
					this.state.styles[layer.id] = defaultColorMap;
				}
			});

			this.state.availableByCase[caseData.id] = layers;
		} catch (error) {
			this.setError(error instanceof Error ? error.message : 'Failed to load layers');
		} finally {
			this.setLoading(false);
		}
	}

	async loadLayersFromRun(caseData: Case, runOutputLayers: Layer[]) {
		// Initialize default styles for new layers
		runOutputLayers.forEach((layer) => {
			this.state.styles[layer.id] = defaultColorMap;
		});
		this.state.availableByCase[caseData.id] = runOutputLayers;
	}

	selectLayer(caseId: string, layer: Layer) {
		this.state.selected[caseId] = [...(this.state.selected[caseId] || []), layer];
	}

	unselectLayer(caseId: string, layer: Layer) {
		const currentLayers = this.state.selected[caseId] || [];
		this.state.selected[caseId] = currentLayers.filter((l) => l.id !== layer.id);
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

	isLayerSelectedForCase(caseId: string, layerId: string) {
		return this.state.selected[caseId]?.some((l) => l.id === layerId);
	}

	isLayerSelectedForAllCases(layerId: string) {
		return (
			Object.keys(this.state.selected).length > 0 &&
			Object.values(this.state.selected).every((layers) => layers?.some((l) => l.id === layerId))
		);
	}

	selectedLayersForCase = $derived((caseId: string) => this.state.selected[caseId] || []);

	selectedLayersWithColorMapsForCase = $derived((caseId: string) => {
		const layers = this.selectedLayersForCase(caseId);
		return layers.map((layer) => ({
			layer,
			colorMap: this.layerStyle(layer.id),
		}));
	});

	removeCaseLayers(caseId: string) {
		delete this.state.availableByCase[caseId];
		delete this.state.selected[caseId];
	}

	layerStyle = $derived((layerId: string) => this.state.styles[layerId]);

	setLayerStyleColor(layerId: string, colorMap: ColorMap) {
		this.state.styles[layerId] = colorMap;
	}

	getLayerFromId(caseId: string, layerId: string) {
		return this.state.availableByCase[caseId]?.find((l) => l.id === layerId);
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
