import { describe, it, expect, vi, beforeEach } from 'vitest';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Layer, LayerStyle } from '$lib/models/types';

describe('layerViewModel', () => {
	resetTestState();

	const mockCase = { id: 'case1', path: '/case1', name: 'Case 1' };
	const mockLayer: Layer = { name: 'layer1', path: '/layer1' };

	const mockColorMap = {
		R: [0, 255],
		G: [0, 0],
		B: [0, 0],
		A: [255, 255],
		I: [0, 1],
	};

	describe('context management', () => {
		it('should set dataset context correctly', () => {
			layerViewModel.setContext({ type: 'dataset' });

			expect(layerViewModel.context.type).toBe('dataset');
			expect(layerViewModel.error).toBeNull();
		});

		it('should set run context correctly', () => {
			currentWorkspace.state.runsLayersStates = [
				{
					openedLayersPathsByCasePath: {},
					stylesByLayerName: {},
				},
			];

			layerViewModel.setContext({ type: 'run', runIndex: 0 });

			expect(layerViewModel.context.type).toBe('run');
			expect(layerViewModel.context.runIndex).toBe(0);
			expect(layerViewModel.error).toBeNull();
		});
	});

	describe('layer selection', () => {
		beforeEach(() => {
			layerViewModel.setContext({ type: 'dataset' });
			loadedData.layersByCaseId[mockCase.id] = [mockLayer];
		});

		it('should select a layer and update workspace state', () => {
			layerViewModel.selectLayer(mockCase.path, mockLayer);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(true);
			expect(layerViewModel.getSelectedLayers(mockCase.path)).toContain(mockLayer.path);

			expect(
				currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[mockCase.path]
			).toContain(mockLayer.path);
		});

		it('should deselect a layer and update workspace state', () => {
			layerViewModel.selectLayer(mockCase.path, mockLayer);
			layerViewModel.deselectLayer(mockCase.path, mockLayer);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(false);
			expect(layerViewModel.getSelectedLayers(mockCase.path)).not.toContain(mockLayer.path);

			expect(
				currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[mockCase.path]
			).not.toContain(mockLayer.path);
		});

		it('should toggle layer selection and update workspace state', () => {
			layerViewModel.toggleLayer(mockCase.path, mockLayer);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(true);
			expect(
				currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[mockCase.path]
			).toContain(mockLayer.path);

			layerViewModel.toggleLayer(mockCase.path, mockLayer);

			expect(layerViewModel.isLayerSelected(mockCase.path, mockLayer.path)).toBe(false);
			expect(
				currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[mockCase.path]
			)?.not.toContain(mockLayer.path);
		});
	});

	describe('layer styles', () => {
		it('should update layer style and workspace state', () => {
			const style: Partial<LayerStyle> = {
				colorMap: mockColorMap,
				alpha: 0.5,
			};

			layerViewModel.updateLayerStyle(mockLayer.name, style);

			expect(layerViewModel.getLayerStyle(mockLayer.name)).toEqual(style);

			expect(currentWorkspace.state.datasetLayersState.stylesByLayerName[mockLayer.name]).toEqual(
				style
			);
		});

		it('should merge new style with existing style and update workspace state', () => {
			const initialStyle: Partial<LayerStyle> = {
				colorMap: mockColorMap,
				alpha: 0.5,
			};
			layerViewModel.updateLayerStyle(mockLayer.name, initialStyle);

			const updateStyle: Partial<LayerStyle> = { alpha: 0.8 };
			layerViewModel.updateLayerStyle(mockLayer.name, updateStyle);

			const expectedStyle = {
				colorMap: mockColorMap,
				alpha: 0.8,
			};

			expect(layerViewModel.getLayerStyle(mockLayer.name)).toEqual(expectedStyle);

			expect(currentWorkspace.state.datasetLayersState.stylesByLayerName[mockLayer.name]).toEqual(
				expectedStyle
			);
		});
	});

	describe('currentLayersByCase', () => {
		it('should return dataset layers when in dataset context', () => {
			layerViewModel.setContext({ type: 'dataset' });
			loadedData.layersByCaseId[mockCase.id] = [mockLayer];

			const layers = layerViewModel.currentLayersByCase(mockCase.id);
			expect(layers).toEqual([mockLayer]);
		});

		it('should return run layers when in run context', () => {
			const runLayer = { name: 'runLayer', path: '/runLayer' };

			currentWorkspace.state.runsLayersStates = [
				{
					openedLayersPathsByCasePath: {},
					stylesByLayerName: {},
				},
			];

			layerViewModel.setContext({ type: 'run', runIndex: 0 });
			loadedData.runsByCaseId[mockCase.id] = [
				{
					id: 'run1',
					timestamp: new Date(),
					scriptContent: '',
					outputLayers: [runLayer],
					outputPrint: [],
				},
			];

			const layers = layerViewModel.currentLayersByCase(mockCase.id);
			expect(layers).toEqual([runLayer]);
		});
	});

	describe('reset', () => {
		it('should reset dataset layers state in workspace', () => {
			layerViewModel.setContext({ type: 'dataset' });
			layerViewModel.selectLayer(mockCase.path, mockLayer);
			layerViewModel.updateLayerStyle(mockLayer.name, {
				colorMap: mockColorMap,
				alpha: 0.5,
			});

			layerViewModel.reset();

			expect(layerViewModel.isLoading).toBe(false);
			expect(layerViewModel.error).toBeNull();
			expect(layerViewModel.getSelectedLayers(mockCase.path)).toEqual([]);
			expect(layerViewModel.getLayerStyle(mockLayer.name)).toBeUndefined();

			expect(currentWorkspace.state.datasetLayersState).toEqual({
				openedLayersPathsByCasePath: {},
				stylesByLayerName: {},
			});
		});

		it('should reset run layers state in workspace', () => {
			currentWorkspace.state.runsLayersStates = [
				{
					openedLayersPathsByCasePath: {},
					stylesByLayerName: {},
				},
			];

			layerViewModel.setContext({ type: 'run', runIndex: 0 });
			layerViewModel.selectLayer(mockCase.path, mockLayer);
			layerViewModel.updateLayerStyle(mockLayer.name, {
				colorMap: mockColorMap,
				alpha: 0.5,
			});

			layerViewModel.reset();

			expect(layerViewModel.isLoading).toBe(false);
			expect(layerViewModel.error).toBeNull();
			expect(layerViewModel.getSelectedLayers(mockCase.path)).toEqual([]);
			expect(layerViewModel.getLayerStyle(mockLayer.name)).toBeUndefined();

			expect(currentWorkspace.state.runsLayersStates[0]).toEqual({
				openedLayersPathsByCasePath: {},
				stylesByLayerName: {},
			});
		});
	});
});
