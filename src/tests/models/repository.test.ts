import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRepository, loadedData } from '$lib/models/repository.svelte';
import type { Dataset, Case, Layer, PresetScript } from '$lib/models/types';
import { initialWorkspaceState, resetTestState } from '../viewmodels/viewmodel-test-utils';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiRepository', () => {
	// Use the shared test state reset utility
	resetTestState();

	// Clear mock between tests
	beforeEach(() => {
		mockFetch.mockClear();
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
			expect(mockFetch).toHaveBeenCalledWith('/datasets', undefined);
			expect(loadedData.datasets).toEqual(mockDatasets);
		});

		it('should handle fetch errors', async () => {
			// Arrange
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// Act & Assert
			await expect(apiRepository.fetchDatasets()).rejects.toThrow('Failed to fetch data');
		});
	});

	describe('getCases', () => {
		it('should fetch and update cases state', async () => {
			// Arrange
			const mockDataset: Dataset = { name: 'dataset1', layout: 'brats' };
			const mockCases: Case[] = [
				{ name: 'case1', path: 'dataset1/case1' },
				{ name: 'case2', path: 'dataset1/case2' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockCases),
			});

			// Act
			await apiRepository.fetchCases(mockDataset);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(`/datasets/${mockDataset.name}/cases`, undefined);
			expect(loadedData.casesByDataset[mockDataset.name]).toEqual(mockCases);
		});
	});

	describe('getLayers', () => {
		it('should fetch and update layers state', async () => {
			// Arrange
			const mockCase: Case = { name: 'case1', path: 'dataset1/case1' };
			const mockLayers: Layer[] = [
				{ name: 'layer1', path: 'layer1.nii.gz' },
				{ name: 'layer2', path: 'layer2.nii.gz' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockLayers),
			});

			// Act
			await apiRepository.fetchLayers(mockCase);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(mockCase.path, undefined);
			expect(loadedData.layersByCasePath[mockCase.path]).toEqual(mockLayers);
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
			expect(mockFetch).toHaveBeenCalledWith('/scripts', undefined);
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

	// Add new tests for workspace-related functionality
	describe('workspace operations', () => {
		it('should fetch and load workspace data', async () => {
			// Arrange
			const mockWorkspace = {
				id: 'workspace1',
				name: 'Test Workspace',
				createdAt: new Date(),
				updatedAt: new Date(),
				state: {
					data: {
						openedDatasetsNames: ['dataset1'],
						openedCasesPaths: ['dataset1/case1'],
						openedRunsIds: [],
					},
					datasetLayersState: {
						openedLayersPathsByCasePath: {},
						stylesByLayerName: {},
					},
					runsLayersStates: {},
					ui: {
						isDarkMode: false,
						sidebars: {
							datasetCollapsed: false,
							layerCollapsed: false,
							scriptCollapsed: false,
						},
						viewers: {
							fullscreenCasePath: null,
						},
						layers: {
							layerContext: { type: 'dataset' },
						},
						scriptEditor: {
							content: '',
						},
					},
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockWorkspace),
			});

			// Mock subsequent data fetches
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([]), // datasets
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([]), // preset scripts
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([]), // runs
			});

			// Act
			await apiRepository.fetchAndLoadWorkspace('workspace1');

			// Assert
			expect(mockFetch).toHaveBeenNthCalledWith(1, '/workspaces/workspace1', undefined);

			// Add more specific assertions for subsequent calls
			expect(mockFetch).toHaveBeenNthCalledWith(2, '/datasets', undefined);
			expect(mockFetch).toHaveBeenNthCalledWith(3, '/scripts', undefined);
			expect(mockFetch).toHaveBeenNthCalledWith(4, '/workspaces/workspace1/runs', undefined);
		});

		it('should handle workspace creation', async () => {
			// Arrange
			const mockWorkspace = {
				id: 'new-workspace',
				name: 'New Workspace',
				createdAt: new Date(),
				updatedAt: new Date(),
				state: initialWorkspaceState,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockWorkspace),
			});

			// Act
			const result = await apiRepository.createWorkspace('New Workspace');

			// Assert
			expect(mockFetch).toHaveBeenCalledWith('/workspaces', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceId: undefined,
					workspace: { name: 'New Workspace', state: initialWorkspaceState },
				}),
			});
			expect(result).toEqual(mockWorkspace);
		});
	});
});
