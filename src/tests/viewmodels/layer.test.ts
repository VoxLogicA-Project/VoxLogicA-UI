import { describe, it, expect, beforeEach } from 'vitest';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Layer, LayerStyle } from '$lib/models/types';

describe('layerViewModel', () => {
	resetTestState();

	const mockCase = { path: '/datasets/dataset1/case1', name: 'Case 1' };
	const mockLayer: Layer = { name: 'layer1', path: '/layer1' };

	const mockColorMap = {
		R: [0, 255],
		G: [0, 0],
		B: [0, 0],
		A: [255, 255],
		I: [0, 1],
	};

	describe('layer selection', () => {
		beforeEach(() => {
			// Set up initial state
			currentWorkspace.state.ui.layers.layerContext = { type: 'dataset' };
			loadedData.layersByCasePath[mockCase.path] = [mockLayer];
			currentWorkspace.state.data.openedCasesPaths = [mockCase.path];
		});

		it('should select a layer and update workspace state', () => {
			layerViewModel.selectLayer(mockCase.path, mockLayer.path);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(true);
			expect(layerViewModel.getSelectedLayers(mockCase.path)).toContain(mockLayer.path);
		});

		it('should deselect a layer and update workspace state', () => {
			// First select the layer
			layerViewModel.selectLayer(mockCase.path, mockLayer.path);
			// Then deselect it
			layerViewModel.deselectLayer(mockCase.path, mockLayer.path);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(false);
			expect(layerViewModel.getSelectedLayers(mockCase.path)).not.toContain(mockLayer.path);
		});

		it('should toggle layer selection', () => {
			// Toggle on
			layerViewModel.toggleLayer(mockCase.path, mockLayer.path);
			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(true);

			// Toggle off
			layerViewModel.toggleLayer(mockCase.path, mockLayer.path);
			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(false);
		});

		it('should select layer for all opened cases', () => {
			const mockCase2 = { path: '/datasets/dataset1/case2', name: 'Case 2' };
			currentWorkspace.state.data.openedCasesPaths.push(mockCase2.path);
			loadedData.layersByCasePath[mockCase2.path] = [{ ...mockLayer }];

			layerViewModel.selectLayerForAllOpenedCases(mockLayer.name);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(true);
			expect(layerViewModel.isLayerSelected(mockCase2.path, mockLayer.path)).toBe(true);
		});
	});

	describe('layer styles', () => {
		beforeEach(() => {
			currentWorkspace.state.ui.layers.layerContext = { type: 'dataset' };
		});

		it('should update layer style', () => {
			const style: Partial<LayerStyle> = {
				colorMap: mockColorMap,
				alpha: 0.5,
			};

			layerViewModel.updateLayerStyle(mockLayer.name, style);

			expect(layerViewModel.stylesByLayerName[mockLayer.name]).toEqual(style);
		});

		it('should merge new style with existing style', () => {
			const initialStyle: Partial<LayerStyle> = {
				colorMap: mockColorMap,
				alpha: 0.5,
			};

			layerViewModel.updateLayerStyle(mockLayer.name, initialStyle);

			const updateStyle: Partial<LayerStyle> = { alpha: 0.8 };
			layerViewModel.updateLayerStyle(mockLayer.name, updateStyle);

			expect(layerViewModel.stylesByLayerName[mockLayer.name]).toEqual({
				colorMap: mockColorMap,
				alpha: 0.8,
			});
		});
	});

	describe('layer queries', () => {
		beforeEach(() => {
			currentWorkspace.state.ui.layers.layerContext = { type: 'dataset' };
			loadedData.layersByCasePath[mockCase.path] = [mockLayer];
			currentWorkspace.state.data.openedCasesPaths = [mockCase.path];
		});

		it('should return current layers by case', () => {
			const layers = layerViewModel.currentLayersByCase(mockCase.path);
			expect(layers).toEqual([mockLayer]);
		});

		it('should return unique layer names', () => {
			expect(layerViewModel.uniqueLayersNames).toEqual([mockLayer.name]);
		});

		it('should check if layer is selected for all opened cases', () => {
			layerViewModel.selectLayer(mockCase.path, mockLayer.path);
			expect(layerViewModel.isLayerSelectedForAllOpenedCases(mockLayer.name)).toBe(true);
		});
	});

	describe('reset', () => {
		beforeEach(() => {
			currentWorkspace.state.ui.layers.layerContext = { type: 'dataset' };
			layerViewModel.selectLayer(mockCase.path, mockLayer.path);
			layerViewModel.updateLayerStyle(mockLayer.name, {
				colorMap: mockColorMap,
				alpha: 0.5,
			});
		});

		it('should reset dataset layers state', () => {
			layerViewModel.reset();

			expect(layerViewModel.isLoading).toBe(false);
			expect(layerViewModel.error).toBeNull();
			expect(layerViewModel.getSelectedLayers(mockCase.path)).toBeUndefined();
			expect(layerViewModel.stylesByLayerName[mockLayer.name]).toBeUndefined();
		});
	});
});
