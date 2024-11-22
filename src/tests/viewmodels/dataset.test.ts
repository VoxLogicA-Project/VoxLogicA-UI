import { describe, it, expect, beforeEach, vi } from 'vitest';
import { datasetViewModel } from '../../lib/viewmodels/dataset.svelte';
import { apiRepository } from '$lib/models/repository';
import type { Dataset } from '$lib/models/types';

// Mock the repository
vi.mock('$lib/models/repository', () => ({
	apiRepository: {
		getDatasets: vi.fn(),
	},
}));

describe('DatasetViewModel', () => {
	const mockDatasets: Dataset[] = [
		{ id: 'dataset1', layout: 'brats' },
		{ id: 'dataset2', layout: 'brats' },
	];

	beforeEach(() => {
		// Reset the view model state
		datasetViewModel.reset();
		// Clear mock calls
		vi.clearAllMocks();
	});

	describe('loadDatasets', () => {
		it('should load datasets successfully', async () => {
			// Arrange
			vi.mocked(apiRepository.getDatasets).mockResolvedValue(mockDatasets);

			// Act
			await datasetViewModel.loadDatasets();

			// Assert
			expect(apiRepository.getDatasets).toHaveBeenCalledTimes(1);
			expect(datasetViewModel.datasets).toEqual(mockDatasets);
			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.currentError).toBeNull();
		});

		it('should handle errors when loading datasets', async () => {
			// Arrange
			const error = new Error('Failed to fetch');
			vi.mocked(apiRepository.getDatasets).mockRejectedValue(error);

			// Act
			await datasetViewModel.loadDatasets();

			// Assert
			expect(apiRepository.getDatasets).toHaveBeenCalledTimes(1);
			expect(datasetViewModel.datasets).toEqual([]);
			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.currentError).toBe('Failed to fetch');
		});
	});

	describe('selectDataset', () => {
		it('should select a dataset', () => {
			// Arrange
			const dataset = mockDatasets[0];

			// Act
			datasetViewModel.selectDataset(dataset);

			// Assert
			expect(datasetViewModel.selectedDataset).toEqual(dataset);
		});
	});

	describe('reset', () => {
		it('should reset the view model', () => {
			// Arrange
			datasetViewModel.selectDataset(mockDatasets[0]);

			// Act
			datasetViewModel.reset();

			// Assert
			expect(datasetViewModel.selectedDataset).toBeNull();
			expect(datasetViewModel.datasets).toEqual([]);
		});
	});
});
