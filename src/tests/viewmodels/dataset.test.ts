import { describe, it, expect, vi, beforeEach } from 'vitest';
import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
import { apiRepository, loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Dataset } from '$lib/models/types';

vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchDatasets: vi.fn(),
			fetchCases: vi.fn(),
		},
	};
});

describe('datasetViewModel', () => {
	resetTestState();

	describe('loadDatasets', () => {
		it('should handle successful dataset loading', async () => {
			const mockDatasets: Dataset[] = [{ name: 'dataset1' }, { name: 'dataset2' }];

			vi.mocked(apiRepository.fetchDatasets).mockImplementationOnce(async () => {
				loadedData.datasets = mockDatasets;
			});

			await datasetViewModel.loadDatasets();

			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBeNull();
			expect(datasetViewModel.hasDatasets).toBe(true);
			expect(datasetViewModel.datasets).toEqual(mockDatasets);
		});

		it('should handle loading errors', async () => {
			vi.mocked(apiRepository.fetchDatasets).mockRejectedValueOnce(new Error('Network error'));

			await datasetViewModel.loadDatasets();

			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBe('Network error');
			expect(datasetViewModel.hasDatasets).toBe(false);
			expect(datasetViewModel.datasets).toEqual([]);
		});
	});

	describe('dataset selection', () => {
		const dataset = { name: 'dataset1', layout: 'brats' };
		const mockCases = [{ name: 'case1', path: '/case1' }];

		beforeEach(() => {
			loadedData.datasets = [dataset];
			loadedData.casesByDataset = {};
		});

		it('should handle successful dataset selection', async () => {
			vi.mocked(apiRepository.fetchCases).mockImplementationOnce(async () => {
				loadedData.casesByDataset[dataset.name] = mockCases;
			});

			await datasetViewModel.selectDataset(dataset);

			expect(datasetViewModel.isSelected(dataset)).toBe(true);
			expect(currentWorkspace.state.data.openedDatasetsNames).toContain(dataset.name);
			expect(datasetViewModel.error).toBeNull();
			expect(loadedData.casesByDataset[dataset.name]).toEqual(mockCases);
		});

		it('should handle selection errors', async () => {
			vi.mocked(apiRepository.fetchCases).mockRejectedValueOnce(new Error('Failed to load'));

			await datasetViewModel.selectDataset(dataset);

			expect(datasetViewModel.isSelected(dataset)).toBe(false);
			expect(currentWorkspace.state.data.openedDatasetsNames).not.toContain(dataset.name);
			expect(datasetViewModel.error).toBe('Failed to load');
			expect(loadedData.casesByDataset[dataset.name]).toBeUndefined();
		});

		it('should deselect dataset', () => {
			// First select the dataset
			currentWorkspace.state.data.openedDatasetsNames = [dataset.name];
			expect(datasetViewModel.isSelected(dataset)).toBe(true);

			// Then deselect it
			datasetViewModel.deselectDataset(dataset);

			expect(datasetViewModel.isSelected(dataset)).toBe(false);
			expect(currentWorkspace.state.data.openedDatasetsNames).not.toContain(dataset.name);
		});

		it('should toggle dataset selection', async () => {
			vi.mocked(apiRepository.fetchCases).mockImplementationOnce(async () => {
				loadedData.casesByDataset[dataset.name] = mockCases;
			});

			// Toggle on
			await datasetViewModel.toggleDataset(dataset);
			expect(datasetViewModel.isSelected(dataset)).toBe(true);

			// Toggle off
			datasetViewModel.toggleDataset(dataset);
			expect(datasetViewModel.isSelected(dataset)).toBe(false);
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			// Set some initial state
			loadedData.datasets = [{ name: 'dataset1' }];
			currentWorkspace.state.data.openedDatasetsNames = ['dataset1'];
			loadedData.casesByDataset = { dataset1: [{ name: 'case1', path: '/case1' }] };

			datasetViewModel.reset();

			expect(datasetViewModel.datasets).toEqual([]);
			expect(datasetViewModel.selectedDatasets).toEqual([]);
			expect(datasetViewModel.isLoading).toBe(false);
			expect(datasetViewModel.error).toBeNull();
			expect(currentWorkspace.state.data.openedDatasetsNames).toEqual([]);
			expect(loadedData.casesByDataset).toEqual({});
		});
	});
});
