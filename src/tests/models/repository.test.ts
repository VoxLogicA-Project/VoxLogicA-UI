import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRepository, loadedData } from '$lib/models/repository.svelte';
import type { Dataset, Case, Layer, PresetScript } from '$lib/models/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiRepository', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset loadedData state before each test
		Object.assign(loadedData, {
			availableWorkspacesIds: [],
			datasets: [],
			cases: [],
			layersByCaseId: {},
			runsByCaseId: {},
			presetScripts: [],
		});
	});

	describe('getDatasets', () => {
		it('should fetch and update datasets state', async () => {
			// Arrange
			const mockDatasets: Dataset[] = [
				{ name: 'dataset1', layout: 'brats' },
				{ name: 'dataset2', layout: 'custom' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockDatasets),
			});

			// Act
			await apiRepository.fetchDatasets();

			// Assert
			expect(mockFetch).toHaveBeenCalledWith('/datasets');
			expect(loadedData.datasets).toEqual(mockDatasets);
		});

		it('should handle fetch errors', async () => {
			// Arrange
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// Act & Assert
			await expect(apiRepository.fetchDatasets()).rejects.toThrow('Failed to fetch datasets');
		});
	});

	describe('getCases', () => {
		it('should fetch and update cases state', async () => {
			// Arrange
			const mockDataset: Dataset = { name: 'dataset1', layout: 'brats' };
			const mockCases: Case[] = [
				{ name: 'case1', path: 'dataset1/case1', id: 'dataset1-case1' },
				{ name: 'case2', path: 'dataset1/case2', id: 'dataset1-case2' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockCases),
			});

			// Act
			await apiRepository.fetchCases(mockDataset);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(`/datasets/${mockDataset.name}/cases`);
			expect(loadedData.cases).toEqual(mockCases);
		});
	});

	describe('getLayers', () => {
		it('should fetch and update layers state', async () => {
			// Arrange
			const mockDataset: Dataset = { name: 'dataset1', layout: 'brats' };
			const mockCase: Case = { name: 'case1', path: 'dataset1/case1', id: 'dataset1-case1' };
			const mockLayers: Layer[] = [
				{ name: 'layer1', path: 'layer1.nii.gz' },
				{ name: 'layer2', path: 'layer2.nii.gz' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockLayers),
			});

			// Act
			await apiRepository.fetchLayers(mockDataset, mockCase);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(
				`/datasets/${mockDataset.name}/cases/${mockCase.name}/layers`
			);
			expect(loadedData.layersByCaseId[mockCase.id]).toEqual(mockLayers);
		});
	});

	describe('getPresetScripts', () => {
		it('should fetch and update preset scripts state', async () => {
			// Arrange
			const mockPresets: PresetScript[] = [
				{ name: 'preset1', path: 'preset1.imgql' },
				{ name: 'preset2', path: 'preset2.imgql' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockPresets),
			});

			// Act
			await apiRepository.fetchPresetsScripts();

			// Assert
			expect(mockFetch).toHaveBeenCalledWith('/scripts');
			expect(loadedData.presetScripts).toEqual(mockPresets);
		});
	});

	describe('getPresetScriptCode', () => {
		it('should fetch and return script content', async () => {
			// Arrange
			const mockPreset: PresetScript = { name: 'preset1', path: 'preset1.imgql' };
			const mockContent = 'script content';

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(mockContent),
			});

			// Act
			const content = await apiRepository.fetchPresetScriptCode(mockPreset);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(mockPreset.path);
			expect(content).toBe(mockContent);
		});
	});
});
