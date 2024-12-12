import { describe, it, expect, beforeEach } from 'vitest';
import { uiViewModel } from '$lib/viewmodels/ui.svelte';
import { currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { LayerContext } from '$lib/models/types';

describe('uiViewModel', () => {
	// Use the shared test state reset utility
	resetTestState();

	describe('dark mode', () => {
		it('should toggle dark mode', () => {
			expect(uiViewModel.state.isDarkMode).toBe(false);
			uiViewModel.toggleDarkMode();
			expect(uiViewModel.state.isDarkMode).toBe(true);
			expect(currentWorkspace.state.ui.isDarkMode).toBe(true);
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
			uiViewModel.state.scriptEditor.content = 'test content';
			uiViewModel.blinkingTabLayerContext = { type: 'dataset' };

			// Reset
			uiViewModel.reset();

			// Verify defaults
			expect(uiViewModel.state.isDarkMode).toBe(false);
			expect(uiViewModel.state.sidebars.datasetCollapsed).toBe(false);
			expect(uiViewModel.state.scriptEditor.content).toBe('');
			expect(uiViewModel.expandedCasePaths.size).toBe(0);
			expect(uiViewModel.expandedRunIds.size).toBe(0);
			expect(uiViewModel.blinkingTabLayerContext).toBeNull();
		});
	});
});
