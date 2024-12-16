import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRepository, loadedData } from '$lib/models/repository.svelte';
import type { Dataset, Case, Layer, ExampleScript } from '$lib/models/types';
import { DEFAULT_WORKSPACE_STATE } from '$lib/models/repository.svelte';
import { resetTestState } from '../viewmodels/viewmodel-test-utils';

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
			const mockDatasets: Dataset[] = [{ name: 'dataset1' }, { name: 'dataset2' }];

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
			const mockDataset: Dataset = { name: 'dataset1' };
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

	describe('getExampleScripts', () => {
		it('should fetch and update example scripts state', async () => {
			// Arrange
			const mockScripts: ExampleScript[] = [
				{ name: 'script1', path: 'script1.imgql' },
				{ name: 'script2', path: 'script2.imgql' },
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockScripts),
			});

			// Act
			await apiRepository.fetchExampleScripts();

			// Assert
			expect(mockFetch).toHaveBeenCalledWith('/scripts', undefined);
			expect(loadedData.exampleScripts).toEqual(mockScripts);
		});
	});

	describe('getExampleScriptCode', () => {
		it('should fetch and return script content', async () => {
			// Arrange
			const mockScript: ExampleScript = { name: 'script1', path: 'script1.imgql' };
			const mockContent = 'script content';

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(mockContent),
			});

			// Act
			const content = await apiRepository.fetchExampleScriptCode(mockScript);

			// Assert
			expect(mockFetch).toHaveBeenCalledWith(mockScript.path);
			expect(content).toBe(mockContent);
		});
	});

	describe('workspace operations', () => {
		it('should fetch and load workspace data', async () => {
			// Arrange
			const mockWorkspace = {
				id: 'workspace1',
				name: 'Test Workspace',
				createdAt: new Date(),
				updatedAt: new Date(),
				state: DEFAULT_WORKSPACE_STATE,
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
				json: () => Promise.resolve([]), // example scripts
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([]), // runs
			});

			// Act
			await apiRepository.fetchAndLoadWorkspace('workspace1');

			// Assert
			expect(mockFetch).toHaveBeenNthCalledWith(1, '/workspaces/workspace1', undefined);
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
				state: DEFAULT_WORKSPACE_STATE,
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
					workspace: { name: 'New Workspace', state: DEFAULT_WORKSPACE_STATE },
				}),
			});
			expect(result).toEqual(mockWorkspace);
		});
	});
});
