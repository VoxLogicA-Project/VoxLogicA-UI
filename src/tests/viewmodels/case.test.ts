import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caseViewModel } from '$lib/viewmodels/case.svelte';
import { apiRepository } from '$lib/models/repository';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';
import type { Case } from '$lib/models/types';

// Mock dependencies
vi.mock('$lib/models/repository', () => ({
	apiRepository: {
		getCases: vi.fn(),
	},
}));

vi.mock('$lib/viewmodels/dataset.svelte', () => ({
	datasetViewModel: {
		selectedDataset: { id: 'dataset1', layout: 'brats' },
	},
}));

vi.mock('$lib/viewmodels/layer.svelte', () => ({
	layerViewModel: {
		loadLayersFromDataset: vi.fn(),
		removeCaseLayers: vi.fn(),
	},
}));

describe('CaseViewModel', () => {
	const mockCases: Case[] = [
		{ id: 'case1', path: 'dataset1/case1' },
		{ id: 'case2', path: 'dataset1/case2' },
	];

	beforeEach(() => {
		caseViewModel.reset();
		vi.clearAllMocks();
	});

	describe('loadCases', () => {
		it('should load cases successfully', async () => {
			// Arrange
			vi.mocked(apiRepository.getCases).mockResolvedValue(mockCases);

			// Act
			await caseViewModel.loadCases();

			// Assert
			expect(apiRepository.getCases).toHaveBeenCalledTimes(1);
			expect(caseViewModel.cases).toEqual(mockCases);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.currentError).toBeNull();
		});

		it('should handle errors when loading cases', async () => {
			// Arrange
			const error = new Error('Failed to load cases');
			vi.mocked(apiRepository.getCases).mockRejectedValue(error);

			// Act
			await caseViewModel.loadCases();

			// Assert
			expect(apiRepository.getCases).toHaveBeenCalledTimes(1);
			expect(caseViewModel.cases).toEqual([]);
			expect(caseViewModel.isLoading).toBe(false);
			expect(caseViewModel.currentError).toBe('Failed to load cases');
		});
	});

	describe('case selection', () => {
		it('should select a case and load its layers', () => {
			// Arrange
			const caseData = mockCases[0];

			// Act
			caseViewModel.selectCase(caseData);

			// Assert
			expect(caseViewModel.selectedCases).toContainEqual(caseData);
			expect(layerViewModel.loadLayersFromDataset).toHaveBeenCalledWith(caseData);
		});

		it('should not select the same case twice', () => {
			// Arrange
			const caseData = mockCases[0];

			// Act
			caseViewModel.selectCase(caseData);
			caseViewModel.selectCase(caseData);

			// Assert
			expect(caseViewModel.selectedCases).toHaveLength(1);
			expect(layerViewModel.loadLayersFromDataset).toHaveBeenCalledTimes(1);
		});

		it('should enforce maximum case selection limit', () => {
			// Arrange
			const maxCases = caseViewModel.maxCases;
			const cases = Array.from({ length: maxCases + 1 }, (_, i) => ({
				id: `case${i}`,
				path: `dataset1/case${i}`,
			}));

			// Act
			cases.forEach((c) => caseViewModel.selectCase(c));

			// Assert
			expect(caseViewModel.selectedCases).toHaveLength(maxCases);
			expect(caseViewModel.currentError).toBe(`Cannot select more than ${maxCases} cases`);
		});

		it('should deselect a case and remove its layers', () => {
			// Arrange
			const caseData = mockCases[0];
			caseViewModel.selectCase(caseData);

			// Act
			caseViewModel.deselectCase(caseData);

			// Assert
			expect(caseViewModel.selectedCases).not.toContain(caseData);
			expect(layerViewModel.removeCaseLayers).toHaveBeenCalledWith(caseData.id);
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			// Arrange
			caseViewModel.selectCase(mockCases[0]);

			// Act
			caseViewModel.reset();

			// Assert
			expect(caseViewModel.cases).toEqual([]);
			expect(caseViewModel.selectedCases).toEqual([]);
			expect(caseViewModel.currentError).toBeNull();
			expect(caseViewModel.isLoading).toBe(false);
		});
	});
});
