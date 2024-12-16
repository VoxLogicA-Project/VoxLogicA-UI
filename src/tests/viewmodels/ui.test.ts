import { describe, it, expect, vi } from 'vitest';
import { uiViewModel } from '$lib/viewmodels/ui.svelte';
import { currentWorkspace, apiRepository } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { LayerContext } from '$lib/models/types';

// Mock repository
vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchExampleScripts: vi.fn(),
			fetchExampleScriptCode: vi.fn(),
		},
	};
});

describe('uiViewModel', () => {
	resetTestState();

	describe('dark mode', () => {
		it('should toggle dark mode', () => {
			expect(uiViewModel.state.isDarkMode).toBe(true);
			uiViewModel.toggleDarkMode();
			expect(uiViewModel.state.isDarkMode).toBe(false);
			expect(currentWorkspace.state.ui.isDarkMode).toBe(false);
		});
	});

	describe('layer context', () => {
		it('should set layer context', () => {
			const newContext: LayerContext = { type: 'run', runId: '123' };
			uiViewModel.setLayerContext(newContext);
			expect(uiViewModel.layerContext).toEqual(newContext);
			expect(currentWorkspace.state.ui.layers.layerContext).toEqual(newContext);
		});

		it('should handle blinking tab layer context', () => {
			const context: LayerContext = { type: 'dataset' };
			expect(uiViewModel.blinkingTabLayerContext).toBeNull();
			uiViewModel.blinkingTabLayerContext = context;
			expect(uiViewModel.blinkingTabLayerContext).toEqual(context);
		});
	});

	describe('script handling', () => {
		it('should load script content correctly', () => {
			const script = '// END load layers\nconst x = 1;';
			uiViewModel.loadScript(script);
			expect(uiViewModel.editorContent).toBe('const x = 1;');
		});

		it('should handle script without load layers marker', () => {
			const script = 'const x = 1;';
			uiViewModel.loadScript(script);
			expect(uiViewModel.editorContent).toBe('const x = 1;');
		});

		it('should load example scripts', async () => {
			vi.mocked(apiRepository.fetchExampleScripts).mockResolvedValueOnce();

			await uiViewModel.loadExampleScripts();

			expect(apiRepository.fetchExampleScripts).toHaveBeenCalled();
			expect(uiViewModel.isEditorLoading).toBe(false);
			expect(uiViewModel.editorError).toBeNull();
		});

		it('should handle example script loading error', async () => {
			vi.mocked(apiRepository.fetchExampleScripts).mockRejectedValueOnce(new Error('Failed'));

			await uiViewModel.loadExampleScripts();

			expect(uiViewModel.editorError).toBe('Failed to load example scripts');
			expect(uiViewModel.isEditorLoading).toBe(false);
		});
	});

	describe('case and run visibility', () => {
		it('should toggle case runs visibility', () => {
			const casePath = '/datasets/test/case1';
			expect(uiViewModel.expandedCasePaths.has(casePath)).toBe(false);

			uiViewModel.showRunsForCase(casePath);
			expect(uiViewModel.expandedCasePaths.has(casePath)).toBe(true);

			uiViewModel.hideRunsForCase(casePath);
			expect(uiViewModel.expandedCasePaths.has(casePath)).toBe(false);

			uiViewModel.toggleRunsVisibility(casePath);
			expect(uiViewModel.expandedCasePaths.has(casePath)).toBe(true);
		});

		it('should toggle run expansion', () => {
			const runId = 'run123';
			expect(uiViewModel.expandedRunIds.has(runId)).toBe(false);

			uiViewModel.toggleRunExpansion(runId);
			expect(uiViewModel.expandedRunIds.has(runId)).toBe(true);

			uiViewModel.toggleRunExpansion(runId);
			expect(uiViewModel.expandedRunIds.has(runId)).toBe(false);
		});
	});

	describe('reset', () => {
		it('should reset all UI state to defaults', () => {
			// Set some non-default values
			uiViewModel.toggleDarkMode();
			uiViewModel.showRunsForCase('test-case');
			uiViewModel.toggleRunExpansion('test-run');
			uiViewModel.editorContent = 'test content';
			uiViewModel.blinkingTabLayerContext = { type: 'dataset' };

			// Reset
			uiViewModel.reset();

			// Verify defaults
			expect(uiViewModel.state.isDarkMode).toBe(false);
			expect(uiViewModel.state.sidebars.datasetCollapsed).toBe(false);
			expect(uiViewModel.editorContent).toBe('');
			expect(uiViewModel.expandedCasePaths.size).toBe(0);
			expect(uiViewModel.expandedRunIds.size).toBe(0);
			expect(uiViewModel.blinkingTabLayerContext).toBeNull();
		});
	});
});
