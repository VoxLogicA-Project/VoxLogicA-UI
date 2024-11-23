import { BaseViewModel } from './base.svelte';

interface UIState {
	datasetSidebarCollapsed: boolean;
	layerSidebarCollapsed: boolean;
	scriptSidebarCollapsed: boolean;
	bottomPanelTab: string;
	isDarkMode: boolean;
	hasUnsavedChanges: boolean;
}

export class UIViewModel extends BaseViewModel {
	private state = $state<UIState>({
		datasetSidebarCollapsed: false,
		layerSidebarCollapsed: false,
		scriptSidebarCollapsed: false,
		bottomPanelTab: 'layers',
		isDarkMode: false,
		hasUnsavedChanges: false,
	});

	// State Access Methods
	getState() {
		return this.state;
	}

	get hasUnsavedChanges() {
		return this.state.hasUnsavedChanges;
	}

	set hasUnsavedChanges(value: boolean) {
		this.state.hasUnsavedChanges = value;
	}

	// Sidebar Collapse State Management
	get datasetSidebarCollapsed() {
		return this.state.datasetSidebarCollapsed;
	}

	set datasetSidebarCollapsed(value: boolean) {
		this.state.datasetSidebarCollapsed = value;
	}

	get layerSidebarCollapsed() {
		return this.state.layerSidebarCollapsed;
	}

	set layerSidebarCollapsed(value: boolean) {
		this.state.layerSidebarCollapsed = value;
	}

	get scriptSidebarCollapsed() {
		return this.state.scriptSidebarCollapsed;
	}

	set scriptSidebarCollapsed(value: boolean) {
		this.state.scriptSidebarCollapsed = value;
	}

	// Bottom Panel Management
	get bottomPanelTab() {
		return this.state.bottomPanelTab;
	}

	set bottomPanelTab(value: string) {
		this.state.bottomPanelTab = value;
	}

	get bottomPanelRunIndex() {
		if (this.state.bottomPanelTab.startsWith('run-')) {
			return parseInt(this.state.bottomPanelTab.split('-')[1]);
		}
		return -1;
	}

	// Theme Management
	get isDarkMode() {
		return this.state.isDarkMode;
	}

	set isDarkMode(value: boolean) {
		this.state.isDarkMode = value;
	}

	toggleDarkMode() {
		this.isDarkMode = !this.isDarkMode;
	}

	// State Management
	reset() {
		this.state.datasetSidebarCollapsed = false;
		this.state.layerSidebarCollapsed = false;
		this.state.scriptSidebarCollapsed = false;
		this.state.isDarkMode = false;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('dark');
		}
	}
}

export const uiViewModel = new UIViewModel();
