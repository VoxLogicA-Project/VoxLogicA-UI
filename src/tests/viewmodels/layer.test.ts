import { describe, it, expect, beforeEach, vi } from 'vitest';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';
import { apiRepository } from '$lib/models/repository';
import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
import { caseViewModel } from '$lib/viewmodels/case.svelte';
import type { Case, Dataset, Layer } from '$lib/models/types';

// Mock dependencies
vi.mock('$lib/models/repository', () => ({
	apiRepository: {
		getLayers: vi.fn(),
	},
}));

vi.mock('$lib/viewmodels/dataset.svelte', () => ({
	datasetViewModel: {
		selectedDataset: { id: 'dataset1', layout: 'brats' },
	},
}));

vi.mock('$lib/viewmodels/case.svelte', () => ({
	caseViewModel: {
		selectedCases: [],
	},
}));

describe('LayerViewModel', () => {
	const mockDataset: Dataset = { id: 'dataset1', layout: 'brats' };
	const mockCase: Case = { id: 'case1', path: 'dataset1/case1' };
	const mockLayers: Layer[] = [
		{ id: 'layer1', path: 'layer1.nii.gz' },
		{ id: 'layer2', path: 'layer2.nii.gz' },
	];

	beforeEach(() => {
		layerViewModel.reset();
		vi.clearAllMocks();
	});

	describe('loadLayersFromDataset', () => {
		it('should load layers successfully', async () => {
			// Arrange
			vi.mocked(apiRepository.getLayers).mockResolvedValue(mockLayers);

			// Act
			await layerViewModel.loadLayersFromDataset(mockCase);

			// Assert
			expect(apiRepository.getLayers).toHaveBeenCalledWith(mockDataset, mockCase);
			expect(layerViewModel.getState().availableByCase[mockCase.id]).toEqual(mockLayers);
			expect(layerViewModel.isLoading).toBe(false);
			expect(layerViewModel.currentError).toBeNull();
		});

		it('should initialize default styles for new layers', async () => {
			// Arrange
			vi.mocked(apiRepository.getLayers).mockResolvedValue(mockLayers);

			// Act
			await layerViewModel.loadLayersFromDataset(mockCase);

			// Assert
			mockLayers.forEach((layer) => {
				expect(layerViewModel.layerStyle(layer.id)).toEqual({
					color: { r: 255, g: 255, b: 255, a: 1 },
				});
			});
		});
	});

	describe('layer selection', () => {
		beforeEach(async () => {
			vi.mocked(apiRepository.getLayers).mockResolvedValue(mockLayers);
			await layerViewModel.loadLayersFromDataset(mockCase);
		});

		it('should select a layer for a case', () => {
			// Act
			layerViewModel.selectLayer(mockCase.id, mockLayers[0]);

			// Assert
			expect(layerViewModel.selectedLayersForCase(mockCase.id)).toContainEqual(mockLayers[0]);
		});

		it('should unselect a layer for a case', () => {
			// Arrange
			layerViewModel.selectLayer(mockCase.id, mockLayers[0]);

			// Act
			layerViewModel.unselectLayer(mockCase.id, mockLayers[0]);

			// Assert
			expect(layerViewModel.selectedLayersForCase(mockCase.id)).not.toContainEqual(mockLayers[0]);
		});

		it('should toggle layer selection', () => {
			// Act - select
			layerViewModel.toggleLayer(mockCase.id, mockLayers[0]);
			expect(layerViewModel.selectedLayersForCase(mockCase.id)).toContainEqual(mockLayers[0]);

			// Act - unselect
			layerViewModel.toggleLayer(mockCase.id, mockLayers[0]);
			expect(layerViewModel.selectedLayersForCase(mockCase.id)).not.toContainEqual(mockLayers[0]);
		});
	});

	describe('layer styles', () => {
		it('should set and get layer style color', () => {
			// Arrange
			const layerId = 'layer1';
			const newColor = { r: 100, g: 150, b: 200, a: 0.5 };
			layerViewModel.getState().styles[layerId] = { color: { r: 255, g: 255, b: 255, a: 1 } };

			// Act
			layerViewModel.setLayerStyleColor(layerId, newColor);

			// Assert
			expect(layerViewModel.layerStyle(layerId).color).toEqual(newColor);
		});
	});

	describe('reset', () => {
		it('should reset all state', async () => {
			// Arrange
			vi.mocked(apiRepository.getLayers).mockResolvedValue(mockLayers);
			await layerViewModel.loadLayersFromDataset(mockCase);
			layerViewModel.selectLayer(mockCase.id, mockLayers[0]);

			// Act
			layerViewModel.reset();

			// Assert
			expect(layerViewModel.getState().availableByCase).toEqual({});
			expect(layerViewModel.getState().selected).toEqual({});
			expect(layerViewModel.getState().styles).toEqual({});
			expect(layerViewModel.currentError).toBeNull();
			expect(layerViewModel.isLoading).toBe(false);
		});
	});
});
