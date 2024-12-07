import { describe, it, expect, vi } from 'vitest';
import { caseViewModel } from '$lib/viewmodels/case.svelte';
import { apiRepository, loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';

// Mock the repository
vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchLayers: vi.fn(async () => {}),
		},
	};
});

describe('caseViewModel', () => {
	resetTestState();

	const mockDataset = { name: 'dataset1', layout: 'brats' };
	const mockCase = { name: 'case1', path: '/case1', id: 'case1' };

	describe('selectCase', () => {
		it('should handle successful case selection', async () => {
			const mockLayers = [
				{ name: 'layer1', path: '/layer1' },
				{ name: 'layer2', path: '/layer2' },
			];

			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCaseId[mockCase.id] = mockLayers;
			});

			await caseViewModel.selectCase(mockDataset, mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(true);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBeNull();
			expect(loadedData.layersByCaseId[mockCase.id]).toEqual(mockLayers);
			expect(caseViewModel.getSelectionIndex(mockCase.path)).toBe(0);
		});

		it('should handle layer loading errors', async () => {
			vi.mocked(apiRepository.fetchLayers).mockRejectedValueOnce(
				new Error('Failed to load layers')
			);

			await caseViewModel.selectCase(mockDataset, mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBe('Failed to load layers');
			expect(loadedData.layersByCaseId[mockCase.id]).toBeUndefined();
		});

		it('should prevent selecting more than MAX_SELECTED_CASES', async () => {
			// Select maximum number of cases
			for (let i = 0; i < 16; i++) {
				const caseData = { name: `case${i}`, path: `/case${i}`, id: `case${i}` };
				vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
					loadedData.layersByCaseId[caseData.id] = [];
				});
				await caseViewModel.selectCase(mockDataset, caseData);
			}

			// Try to select one more
			const extraCase = { name: 'extraCase', path: '/extraCase', id: 'extraCase' };
			await caseViewModel.selectCase(mockDataset, extraCase);

			expect(caseViewModel.error).toContain('Cannot select more than 16 cases');
			expect(caseViewModel.isSelected(extraCase.path)).toBe(false);
		});
	});

	describe('deselectCase', () => {
		it('should properly deselect a case and clean up associated state', async () => {
			// First select a case
			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCaseId[mockCase.id] = [{ name: 'layer1', path: '/layer1' }];
			});
			await caseViewModel.selectCase(mockDataset, mockCase);

			// Then deselect it
			caseViewModel.deselectCase(mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.selectedCases).toHaveLength(0);
			expect(loadedData.layersByCaseId[mockCase.id]).toBeUndefined();
		});
	});

	describe('toggleCase', () => {
		it('should toggle case selection state', async () => {
			vi.mocked(apiRepository.fetchLayers).mockImplementation(async () => {
				loadedData.layersByCaseId[mockCase.id] = [{ name: 'layer1', path: '/layer1' }];
			});

			// Toggle on
			await caseViewModel.toggleCase(mockDataset, mockCase);
			expect(caseViewModel.isSelected(mockCase.path)).toBe(true);
			expect(loadedData.layersByCaseId[mockCase.id]).toBeDefined();

			// Toggle off
			await caseViewModel.toggleCase(mockDataset, mockCase);
			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(loadedData.layersByCaseId[mockCase.id]).toBeUndefined();
		});

		it('should handle errors during toggle on', async () => {
			vi.mocked(apiRepository.fetchLayers).mockRejectedValueOnce(
				new Error('Failed to load layers')
			);

			await caseViewModel.toggleCase(mockDataset, mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.error).toBe('Failed to load layers');
		});
	});

	describe('reset', () => {
		it('should reset all case-related state', async () => {
			// First set up some state
			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCaseId[mockCase.id] = [{ name: 'layer1', path: '/layer1' }];
			});
			await caseViewModel.selectCase(mockDataset, mockCase);

			// Then reset
			caseViewModel.reset();

			expect(caseViewModel.selectedCases).toHaveLength(0);
			expect(loadedData.cases).toHaveLength(0);
			expect(loadedData.layersByCaseId).toEqual({});
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBeNull();
		});
	});
});
