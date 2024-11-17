import type { Case, Layer, LayerStyle } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import type { MainState } from './mainStore';
import { mainStore } from './mainStore';
import { get, derived, type Readable } from 'svelte/store';

function createLayerStore() {
	return {
		async loadLayers(caseData: Case) {
			const state = get(mainStore);
			if (!state.datasets.selected) return;

			mainStore.update((state: MainState) => ({
				...state,
				layers: {
					...state.layers,
					loading: true,
					error: null,
				},
			}));

			try {
				const layers = await apiRepository.getLayers(state.datasets.selected, caseData);

				// Initialize default styles for new layers
				const newStyles: Record<string, LayerStyle> = {};
				layers.forEach((layer) => {
					if (!state.layers.styles[layer.id]) {
						newStyles[layer.id] = {
							// White color with full opacity
							color: { r: 255, g: 255, b: 255, a: 1 },
						};
					}
				});

				mainStore.update((state: MainState) => ({
					...state,
					layers: {
						...state.layers,
						availableByCase: {
							...state.layers.availableByCase,
							[caseData.id]: layers,
						},
						styles: {
							...state.layers.styles,
							...newStyles,
						},
						loading: false,
					},
				}));
			} catch (error) {
				mainStore.update((state: MainState) => ({
					...state,
					layers: {
						...state.layers,
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to load layers',
					},
				}));
			}
		},

		selectLayer(caseId: string, layer: Layer) {
			mainStore.update((state: MainState) => {
				const currentLayers = state.layers.selected[caseId] || [];
				return {
					...state,
					layers: {
						...state.layers,
						selected: {
							...state.layers.selected,
							[caseId]: [...currentLayers, layer],
						},
					},
				};
			});
		},

		unselectLayer(caseId: string, layer: Layer) {
			mainStore.update((state: MainState) => {
				const currentLayers = state.layers.selected[caseId] || [];
				return {
					...state,
					layers: {
						...state.layers,
						selected: {
							...state.layers.selected,
							[caseId]: currentLayers.filter((l) => l.id !== layer.id),
						},
					},
				};
			});
		},

		toggleLayer(caseId: string, layer: Layer) {
			const state = get(mainStore);
			const currentLayers = state.layers.selected[caseId] || [];
			const isSelected = currentLayers.some((l) => l.id === layer.id);

			if (isSelected) {
				this.unselectLayer(caseId, layer);
			} else {
				this.selectLayer(caseId, layer);
			}
		},

		selectLayerForAllSelectedCases(layer: Layer) {
			const state = get(mainStore);

			// TODO: maybe improve to perform a single update.
			for (const caseId in state.layers.availableByCase) {
				this.selectLayer(caseId, layer);
			}
		},

		unselectLayerForAllSelectedCases(layer: Layer) {
			const state = get(mainStore);

			// TODO: maybe improve to perform a single update.
			for (const caseId in state.layers.availableByCase) {
				this.unselectLayer(caseId, layer);
			}
		},
	};
}

export const layerStore = createLayerStore();

export const uniqueLayers: Readable<Layer[]> = derived(mainStore, ($state) => {
	const layerMap = new Map<string, Layer>();

	$state.cases.selected.forEach((caseData) => {
		const caseLayers = $state.layers.availableByCase[caseData.id] || [];
		caseLayers.forEach((layer) => {
			// Only add if not already present
			if (!layerMap.has(layer.id)) {
				layerMap.set(layer.id, layer);
			}
		});
	});

	return Array.from(layerMap.values());
});
