import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runViewModel } from '$lib/viewmodels/run.svelte';
import { loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Case, Run } from '$lib/models/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('runViewModel', () => {
	resetTestState();

	const mockCase: Case = {
		path: '/datasets/dataset1/case1',
		name: 'Case 1',
	};

	const mockRun: Run = {
		id: 'run1',
		casePath: mockCase.path,
		outputError: undefined,
		outputLayers: [],
		outputPrint: [
			{ name: 'metric1', value: '10', vltype: 'float' },
			{ name: 'metric2', value: '20', vltype: 'float' },
		],
		timestamp: new Date(),
		scriptContent: 'test script',
	};

	describe('run execution', () => {
		beforeEach(() => {
			mockFetch.mockClear();
		});

		it('should execute single run', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([mockRun]),
			});

			await runViewModel.singleRun(mockCase);

			expect(mockFetch).toHaveBeenCalledWith('/run', expect.any(Object));
			expect(runViewModel.isLoading).toBe(false);
			expect(runViewModel.error).toBeNull();
			expect(loadedData.runsByCasePath[mockCase.path]).toContainEqual(mockRun);
		});

		it('should handle run errors', async () => {
			const errorRun = { ...mockRun, outputError: 'Test error' };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve([errorRun]),
			});

			await runViewModel.singleRun(mockCase);

			expect(runViewModel.error).toBe('Some runs failed. Check individual results for details.');
		});

		it('should handle fetch errors', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			await expect(runViewModel.singleRun(mockCase)).rejects.toThrow('Network error');
			expect(runViewModel.error).toBe('Network error');
		});
	});

	describe('run selection', () => {
		beforeEach(() => {
			loadedData.runsByCasePath[mockCase.path] = [mockRun];
		});

		it('should select and deselect runs', () => {
			runViewModel.selectRun(mockRun.id);
			expect(runViewModel.isRunSelected(mockRun.id)).toBe(true);

			runViewModel.deselectRun(mockRun.id);
			expect(runViewModel.isRunSelected(mockRun.id)).toBe(false);
		});

		it('should toggle run selection', () => {
			runViewModel.toggleRun(mockRun.id);
			expect(runViewModel.isRunSelected(mockRun.id)).toBe(true);

			runViewModel.toggleRun(mockRun.id);
			expect(runViewModel.isRunSelected(mockRun.id)).toBe(false);
		});
	});

	describe('print filters', () => {
		beforeEach(() => {
			loadedData.runsByCasePath[mockCase.path] = [mockRun];
		});

		it('should add and remove print filters', () => {
			const filter = { label: 'metric1', operation: '>', value: '5' };

			runViewModel.addPrintFilter(filter);
			expect(runViewModel.printFilters).toContainEqual(filter);

			runViewModel.removePrintFilter(0);
			expect(runViewModel.printFilters).toHaveLength(0);
		});

		it('should update print filter', () => {
			const filter = { label: 'metric1', operation: '>', value: '5' };
			runViewModel.addPrintFilter(filter);

			runViewModel.updatePrintFilter(0, { value: '10' });
			expect(runViewModel.printFilters[0]).toEqual({
				...filter,
				value: '10',
			});
		});

		it('should clear all print filters', () => {
			runViewModel.addPrintFilter({ label: 'metric1', operation: '>', value: '5' });
			runViewModel.addPrintFilter({ label: 'metric2', operation: '<', value: '25' });

			runViewModel.clearPrintFilters();
			expect(runViewModel.printFilters).toHaveLength(0);
		});

		it('should filter runs based on print filters', () => {
			const run2 = {
				...mockRun,
				id: 'run2',
				outputPrint: [{ name: 'metric1', value: '5', vltype: 'float' }],
			};
			loadedData.runsByCasePath[mockCase.path] = [mockRun, run2];

			runViewModel.addPrintFilter({ label: 'metric1', operation: '>', value: '7' });

			const filteredRuns = runViewModel.getRunsForCase(mockCase.path);
			expect(filteredRuns).toHaveLength(1);
			expect(filteredRuns[0].id).toBe('run1');
		});
	});

	describe('queries', () => {
		beforeEach(() => {
			loadedData.runsByCasePath[mockCase.path] = [mockRun];
		});

		it('should get runs with errors', () => {
			const errorRun = { ...mockRun, outputError: 'Test error' };
			loadedData.runsByCasePath[mockCase.path] = [errorRun];

			const runsWithErrors = runViewModel.getRunsWithErrors(errorRun.id);
			expect(runsWithErrors[mockCase.path]).toEqual(errorRun);
		});

		it('should get run prints', () => {
			const prints = runViewModel.getRunPrints(mockRun.id, mockCase.path);
			expect(prints).toEqual(mockRun.outputPrint);
		});

		it('should get successful cases for run', () => {
			const successfulCases = runViewModel.getSuccessfulCasesForRun(mockRun.id);
			expect(successfulCases).toHaveLength(0); // Empty because no cases in datasets
		});
	});

	describe('reset', () => {
		it('should reset all run-related state', () => {
			// Setup some state
			loadedData.runsByCasePath[mockCase.path] = [mockRun];
			runViewModel.selectRun(mockRun.id);
			runViewModel.addPrintFilter({ label: 'metric1', operation: '>', value: '5' });

			// Reset
			runViewModel.reset();

			expect(runViewModel.isLoading).toBe(false);
			expect(runViewModel.error).toBeNull();
			expect(runViewModel.printFilters).toHaveLength(0);
			expect(currentWorkspace.state.data.openedRunsIds).toHaveLength(0);
			expect(currentWorkspace.state.ui.scriptEditor.content).toBe('');
		});
	});
});
