import { describe, it, expect, beforeEach } from 'vitest';
import { uiViewModel } from '$lib/viewmodels/ui.svelte';

describe('UIViewModel', () => {
	beforeEach(() => {
		// Reset the view model state before each test
		uiViewModel.getState().datasetSidebarCollapsed = false;
		uiViewModel.getState().layerSidebarCollapsed = false;
		uiViewModel.getState().scriptSidebarCollapsed = false;
		uiViewModel.getState().bottomPanelTab = 'layers';
		uiViewModel.getState().isDarkMode = false;
	});

	describe('sidebar collapse states', () => {
		it('should toggle dataset sidebar', () => {
			expect(uiViewModel.datasetSidebarCollapsed).toBe(false);
			uiViewModel.datasetSidebarCollapsed = true;
			expect(uiViewModel.datasetSidebarCollapsed).toBe(true);
		});

		it('should toggle layer sidebar', () => {
			expect(uiViewModel.layerSidebarCollapsed).toBe(false);
			uiViewModel.layerSidebarCollapsed = true;
			expect(uiViewModel.layerSidebarCollapsed).toBe(true);
		});

		it('should toggle script sidebar', () => {
			expect(uiViewModel.scriptSidebarCollapsed).toBe(false);
			uiViewModel.scriptSidebarCollapsed = true;
			expect(uiViewModel.scriptSidebarCollapsed).toBe(true);
		});
	});

	describe('bottom panel', () => {
		it('should set and get bottom panel tab', () => {
			expect(uiViewModel.bottomPanelTab).toBe('layers');
			uiViewModel.bottomPanelTab = 'run-1';
			expect(uiViewModel.bottomPanelTab).toBe('run-1');
		});

		it('should get correct run index from bottom panel tab', () => {
			uiViewModel.bottomPanelTab = 'layers';
			expect(uiViewModel.bottomPanelRunIndex).toBe(-1);

			uiViewModel.bottomPanelTab = 'run-2';
			expect(uiViewModel.bottomPanelRunIndex).toBe(2);
		});
	});

	describe('dark mode', () => {
		it('should toggle dark mode', () => {
			expect(uiViewModel.isDarkMode).toBe(false);
			uiViewModel.isDarkMode = true;
			expect(uiViewModel.isDarkMode).toBe(true);
		});
	});
});
