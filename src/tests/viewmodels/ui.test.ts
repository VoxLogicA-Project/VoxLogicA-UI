import { describe, it, expect, beforeEach } from 'vitest';
import { uiViewModel } from '$lib/viewmodels/ui.svelte';
import { currentWorkspace } from '$lib/models/repository.svelte';

describe('uiViewModel', () => {
	beforeEach(() => {
		// Reset workspace UI state before each test
		uiViewModel.resetUI();
	});

	describe('isDarkMode', () => {
		it('should toggle dark mode', () => {
			expect(uiViewModel.state.isDarkMode).toBe(false);
			uiViewModel.state.isDarkMode = true;
			expect(uiViewModel.state.isDarkMode).toBe(true);
			expect(currentWorkspace.state.ui.isDarkMode).toBe(true);
		});
	});

	describe('sidebars', () => {
		it('should toggle dataset sidebar', () => {
			expect(uiViewModel.state.sidebars.datasetCollapsed).toBe(false);
			uiViewModel.state.sidebars.datasetCollapsed = true;
			expect(uiViewModel.state.sidebars.datasetCollapsed).toBe(true);
			expect(currentWorkspace.state.ui.sidebars.datasetCollapsed).toBe(true);
		});

		// Similar tests for other sidebars...
	});

	describe('resetUI', () => {
		it('should reset all UI state to defaults', () => {
			// Set some non-default values
			uiViewModel.state.isDarkMode = true;
			uiViewModel.state.sidebars.datasetCollapsed = true;
			uiViewModel.state.scriptEditor.content = 'test content';

			// Reset
			uiViewModel.resetUI();

			// Verify defaults
			expect(uiViewModel.state.isDarkMode).toBe(false);
			expect(uiViewModel.state.sidebars.datasetCollapsed).toBe(false);
			expect(uiViewModel.state.scriptEditor.content).toBe('');
		});
	});
});
