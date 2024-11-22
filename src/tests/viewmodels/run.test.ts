import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runViewModel } from '$lib/viewmodels/run.svelte';
import { apiRepository } from '$lib/models/repository';
import type { Case, PresetScript } from '$lib/models/types';

// Mock the repository, fetch and layerViewModel
vi.mock('$lib/models/repository', () => ({
	apiRepository: {
		getPresetScripts: vi.fn(),
		getPresetScriptCode: vi.fn(),
	},
}));

global.fetch = vi.fn();

vi.mock('$lib/viewmodels/layer.svelte', () => ({
	layerViewModel: {
		uniqueLayersIds: ['layer1', 'layer2'],
	},
	LayerViewModel: vi.fn().mockImplementation(() => ({
		loadLayersFromRun: vi.fn(),
		reset: vi.fn(),
	})),
}));

describe('RunViewModel', () => {
	const mockPresets: PresetScript[] = [
		{ id: 'preset1', path: 'preset1.imgql' },
		{ id: 'preset2', path: 'preset2.imgql' },
	];

	const mockCases: Case[] = [
		{ id: 'case1', path: 'dataset1/case1' },
		{ id: 'case2', path: 'dataset1/case2' },
	];

	beforeEach(() => {
		runViewModel.reset();
		vi.clearAllMocks();
	});

	describe('loadPresets', () => {
		it('should load presets successfully', async () => {
			// Arrange
			vi.mocked(apiRepository.getPresetScripts).mockResolvedValue(mockPresets);

			// Act
			await runViewModel.loadPresets();

			// Assert
			expect(apiRepository.getPresetScripts).toHaveBeenCalledTimes(1);
			expect(runViewModel.availablePresets).toEqual(mockPresets);
			expect(runViewModel.isLoading).toBe(false);
			expect(runViewModel.currentError).toBeNull();
		});

		it('should handle errors when loading presets', async () => {
			// Arrange
			const error = new Error('Failed to load presets');
			vi.mocked(apiRepository.getPresetScripts).mockRejectedValue(error);

			// Act
			await runViewModel.loadPresets();

			// Assert
			expect(apiRepository.getPresetScripts).toHaveBeenCalledTimes(1);
			expect(runViewModel.availablePresets).toEqual([]);
			expect(runViewModel.isLoading).toBe(false);
			expect(runViewModel.currentError).toBe('Failed to load presets');
		});
	});

	describe('loadPresetScript', () => {
		it('should load preset script code successfully', async () => {
			// Arrange
			const mockCode = 'test script content';
			const preset = mockPresets[0];
			vi.mocked(apiRepository.getPresetScriptCode).mockResolvedValue(mockCode);

			// Act
			await runViewModel.loadPresetScript(preset);

			// Assert
			expect(apiRepository.getPresetScriptCode).toHaveBeenCalledWith(preset);
			expect(runViewModel.editorContent).toBe(mockCode);
			expect(runViewModel.isLoading).toBe(false);
			expect(runViewModel.currentError).toBeNull();
		});
	});

	describe('runAll', () => {
		it('should execute runs for all cases successfully', async () => {
			// Arrange
			const mockResponse = {
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'run1',
						print: [],
						layers: [],
						error: null,
						log: '',
					}),
			};
			vi.mocked(fetch).mockResolvedValue(mockResponse as any);

			// Act
			const runs = await runViewModel.runAll(mockCases);

			// Assert
			expect(fetch).toHaveBeenCalledTimes(mockCases.length);
			expect(runs).toHaveLength(mockCases.length);
			expect(runViewModel.history[0]).toHaveLength(mockCases.length);
			expect(runViewModel.layerStates).toHaveLength(1);
		});

		it('should handle individual run failures', async () => {
			// Arrange
			const mockErrorResponse = {
				ok: false,
				statusText: 'Internal Server Error',
				json: () => Promise.resolve({ message: 'Run failed' }),
			};
			vi.mocked(fetch).mockResolvedValue(mockErrorResponse as any);

			// Act
			const runs = await runViewModel.runAll(mockCases);

			// Assert
			expect(runs).toHaveLength(mockCases.length);
			expect(runViewModel.currentError).toBe('Some (or all) runs failed.');
			runs.forEach((run) => {
				expect(run.outputError).toBeTruthy();
			});
		});
	});

	describe('script content management', () => {
		it('should correctly generate header content', () => {
			// Act
			const header = runViewModel.headerContent;

			// Assert
			const expectedHeader =
				'import "stdlib.imgql"\n\n// Load layers\nload layer1 = "${LAYER_PATH:layer1}"\nload layer2 = "${LAYER_PATH:layer2}"';
			expect(header).toBe(expectedHeader);
		});

		it('should save and retrieve editor content', () => {
			// Arrange
			const content = 'test content';

			// Act
			runViewModel.saveEditorContent(content);

			// Assert
			expect(runViewModel.editorContent).toBe(content);
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			// Arrange
			runViewModel.saveEditorContent('test');
			const mockResponse = {
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'run1',
						print: [],
						layers: [],
						error: null,
						log: '',
					}),
			};
			vi.mocked(fetch).mockResolvedValue(mockResponse as any);

			// Act
			runViewModel.reset();

			// Assert
			expect(runViewModel.history).toEqual([]);
			expect(runViewModel.layerStates).toEqual([]);
			expect(runViewModel.currentError).toBeNull();
			expect(runViewModel.isLoading).toBe(false);
		});
	});
});
