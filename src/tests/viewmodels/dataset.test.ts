import { describe, it, expect, vi } from 'vitest';
import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
import { apiRepository, loadedData } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';

vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchDatasets: vi.fn(async () => {
				// This function will update loadedData.datasets directly
				// as it would in the real implementation
			}),
			fetchCases: vi.fn(async () => {
				// This function will update loadedData.cases directly
			}),
		},
	};
});

describe('datasetViewModel', () => {
	resetTestState();

	describe('loadDatasets', () => {
		it('should handle successful dataset loading', async () => {
			const mockDatasets = [
				{ name: 'dataset1', layout: 'brats' },
				{ name: 'dataset2', layout: 'custom' },
			];

			vi.mocked(apiRepository.fetchDatasets).mockImplementationOnce(async () => {
				loadedData.datasets = mockDatasets;
			});

			await datasetViewModel.loadDatasets();

			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBeNull();
			expect(datasetViewModel.hasDatasets).toBe(true);
			expect(loadedData.datasets).toEqual(mockDatasets);
		});

		it('should handle loading errors', async () => {
			vi.mocked(apiRepository.fetchDatasets).mockRejectedValueOnce(new Error('Network error'));

			await datasetViewModel.loadDatasets();

			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBe('Network error');
			expect(datasetViewModel.hasDatasets).toBe(false);
			expect(loadedData.datasets).toEqual([]);
		});
	});

	describe('selectDataset', () => {
		it('should handle successful dataset selection', async () => {
			const dataset = { name: 'dataset1', layout: 'brats' };
			const mockCases = [{ name: 'case1', path: '/case1', id: 'dataset1-case1' }];

			// First, ensure the dataset is in the available datasets
			loadedData.datasets = [dataset];

			vi.mocked(apiRepository.fetchCases).mockImplementationOnce(async () => {
				loadedData.cases = mockCases;
			});

			await datasetViewModel.selectDataset(dataset);

			expect(datasetViewModel.selectedDataset).toEqual(dataset);
			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBeNull();
			expect(loadedData.cases).toEqual(mockCases);
		});

		it('should handle selection errors', async () => {
			const dataset = { name: 'dataset1', layout: 'brats' };

			// First, ensure the dataset is in the available datasets
			loadedData.datasets = [dataset];

			vi.mocked(apiRepository.fetchCases).mockRejectedValueOnce(new Error('Failed to load'));

			await datasetViewModel.selectDataset(dataset);

			expect(datasetViewModel.selectedDataset).toBeNull();
			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBe('Failed to load');
			expect(loadedData.cases).toEqual([]);
		});
	});
});
