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
	const mockCase = { name: 'case1', path: '/datasets/dataset1/case1' };

	describe('selectCase', () => {
		it('should handle successful case selection', async () => {
			const mockLayers = [
				{ name: 'layer1', path: '/layer1' },
				{ name: 'layer2', path: '/layer2' },
			];

			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCasePath[mockCase.path] = mockLayers;
			});

			await caseViewModel.selectCase(mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(true);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBeNull();
			expect(loadedData.layersByCasePath[mockCase.path]).toEqual(mockLayers);
			expect(caseViewModel.getSelectionIndex(mockCase.path)).toBe('1');
		});

		it('should handle layer loading errors', async () => {
			// Make sure layers are empty before the test
			loadedData.layersByCasePath = {};

			vi.mocked(apiRepository.fetchLayers).mockRejectedValueOnce(
				new Error('Failed to load layers')
			);

			await caseViewModel.selectCase(mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBe('Failed to load layers');
			expect(loadedData.layersByCasePath[mockCase.path]).toBeUndefined();
		});

		it('should prevent selecting more than MAX_SELECTED_CASES', async () => {
			// Reset state before test
			loadedData.layersByCasePath = {};
			currentWorkspace.state.data.openedCasesPaths = [];

			// Add necessary dataset and cases to loadedData
			loadedData.datasets = [{ name: 'dataset1', layout: 'brats' }];
			loadedData.casesByDataset['dataset1'] = Array.from({ length: 17 }, (_, i) => ({
				name: `case${i}`,
				path: `/datasets/dataset1/case${i}`,
			}));

			// Select maximum number of cases
			for (let i = 0; i < 16; i++) {
				const case_ = { name: `case${i}`, path: `/datasets/dataset1/case${i}` };
				vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
					loadedData.layersByCasePath[case_.path] = [];
				});
				await caseViewModel.selectCase(case_);
			}

			// Try to select one more
			const extraCase = { name: 'extraCase', path: '/datasets/dataset1/extraCase' };
			await caseViewModel.selectCase(extraCase);

			expect(caseViewModel.error).toBe(
				`Cannot select more than ${caseViewModel.MAX_SELECTED_CASES} cases`
			);
			expect(caseViewModel.isSelected(extraCase.path)).toBe(false);
		});
	});

	describe('deselectCase', () => {
		it('should properly deselect a case and clean up associated state', async () => {
			// First select a case
			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCasePath[mockCase.path] = [{ name: 'layer1', path: '/layer1' }];
			});
			await caseViewModel.selectCase(mockCase);

			// Then deselect it
			caseViewModel.deselectCase(mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.selectedCases).toHaveLength(0);
			expect(loadedData.layersByCasePath[mockCase.path]).toBeUndefined();
			expect(
				currentWorkspace.state.datasetLayersState.openedLayersPathsByCasePath[mockCase.path]
			).toBeUndefined();
		});
	});

	describe('toggleCase', () => {
		it('should toggle case selection state', async () => {
			vi.mocked(apiRepository.fetchLayers).mockImplementation(async () => {
				loadedData.layersByCasePath[mockCase.path] = [{ name: 'layer1', path: '/layer1' }];
			});

			// Toggle on
			await caseViewModel.toggleCase(mockCase);
			expect(caseViewModel.isSelected(mockCase.path)).toBe(true);
			expect(loadedData.layersByCasePath[mockCase.path]).toBeDefined();

			// Toggle off
			await caseViewModel.toggleCase(mockCase);
			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(loadedData.layersByCasePath[mockCase.path]).toBeUndefined();
		});

		it('should handle errors during toggle on', async () => {
			vi.mocked(apiRepository.fetchLayers).mockRejectedValueOnce(
				new Error('Failed to load layers')
			);

			await caseViewModel.toggleCase(mockCase);

			expect(caseViewModel.isSelected(mockCase.path)).toBe(false);
			expect(caseViewModel.error).toBe('Failed to load layers');
		});
	});

	describe('swapCases', () => {
		it('should swap the position of two cases', async () => {
			// Select two cases
			const case1 = { name: 'case1', path: '/datasets/dataset1/case1' };
			const case2 = { name: 'case2', path: '/datasets/dataset1/case2' };

			vi.mocked(apiRepository.fetchLayers).mockImplementation(async (case_) => {
				loadedData.layersByCasePath[case_.path] = [{ name: 'layer1', path: '/layer1' }];
			});

			await caseViewModel.selectCase(case1);
			await caseViewModel.selectCase(case2);

			// Verify initial order
			expect(currentWorkspace.state.data.openedCasesPaths[0]).toBe(case1.path);
			expect(currentWorkspace.state.data.openedCasesPaths[1]).toBe(case2.path);

			// Swap cases
			caseViewModel.swapCases(0, 1);

			// Verify new order
			expect(currentWorkspace.state.data.openedCasesPaths[0]).toBe(case2.path);
			expect(currentWorkspace.state.data.openedCasesPaths[1]).toBe(case1.path);
		});

		it('should throw error for invalid indices', () => {
			expect(() => caseViewModel.swapCases(-1, 0)).toThrow('Invalid case indices');
			expect(() => caseViewModel.swapCases(0, 999)).toThrow('Invalid case indices');
		});
	});

	describe('reset', () => {
		it('should reset all case-related state', async () => {
			// First set up some state
			vi.mocked(apiRepository.fetchLayers).mockImplementationOnce(async () => {
				loadedData.layersByCasePath[mockCase.path] = [{ name: 'layer1', path: '/layer1' }];
			});
			await caseViewModel.selectCase(mockCase);

			// Then reset
			caseViewModel.reset();

			expect(caseViewModel.selectedCases).toHaveLength(0);
			expect(currentWorkspace.state.data.openedCasesPaths).toHaveLength(0);
			expect(loadedData.casesByDataset).toEqual({});
			expect(loadedData.layersByCasePath).toEqual({});
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.error).toBeNull();
		});
	});
});
