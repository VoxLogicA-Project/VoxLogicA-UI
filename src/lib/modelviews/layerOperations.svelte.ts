import type { Case, Layer, LayerStyle } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { mainState } from './mainState.svelte';

function createLayerOperations() {
	return {
		async loadLayers(caseData: Case) {
			if (!mainState.datasets.selected) return;

			mainState.layers.loading = true;
			mainState.layers.error = null;

			try {
				const layers = await apiRepository.getLayers(mainState.datasets.selected, caseData);

				// Initialize default styles for new layers
				layers.forEach((layer) => {
					if (!mainState.layers.styles[layer.id]) {
						mainState.layers.styles[layer.id] = {
							color: { r: 255, g: 255, b: 255, a: 1 },
						};
					}
				});

				mainState.layers.availableByCase[caseData.id] = layers;
				mainState.layers.loading = false;
			} catch (error) {
				mainState.layers.loading = false;
				mainState.layers.error = error instanceof Error ? error.message : 'Failed to load layers';
			}
		},

		selectLayer(caseId: string, layer: Layer) {
			mainState.layers.selected[caseId] = [...(mainState.layers.selected[caseId] || []), layer];
		},

		unselectLayer(caseId: string, layer: Layer) {
			const currentLayers = mainState.layers.selected[caseId] || [];
			mainState.layers.selected[caseId] = currentLayers.filter((l) => l.id !== layer.id);
		},

		toggleLayer(caseId: string, layer: Layer) {
			const currentLayers = mainState.layers.selected[caseId] || [];
			const isSelected = currentLayers.some((l) => l.id === layer.id);

			if (isSelected) {
				this.unselectLayer(caseId, layer);
			} else {
				this.selectLayer(caseId, layer);
			}
		},

		selectLayerIdForAllSelectedCases(layerId: string) {
			mainState.cases.selected.forEach((caseData) => {
				const layer = mainState.layers.availableByCase[caseData.id]?.find((l) => l.id === layerId);
				if (layer) {
					this.selectLayer(caseData.id, layer);
				}
			});
		},

		unselectLayerIdForAllSelectedCases(layerId: string) {
			mainState.cases.selected.forEach((caseData) => {
				const layer = mainState.layers.availableByCase[caseData.id]?.find((l) => l.id === layerId);
				if (layer) {
					this.unselectLayer(caseData.id, layer);
				}
			});
		},
	};
}

export const layerOperations = createLayerOperations();

export function getUniqueLayers() {
	const layerMap = new Map<string, Layer>();

	mainState.cases.selected.forEach((caseData) => {
		const caseLayers = mainState.layers.availableByCase[caseData.id] || [];
		caseLayers.forEach((layer) => {
			if (!layerMap.has(layer.id)) {
				layerMap.set(layer.id, layer);
			}
		});
	});

	return Array.from(layerMap.values());
}
