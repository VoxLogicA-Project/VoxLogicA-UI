import { BaseViewModel } from './base.svelte';

interface UIState {
	datasetSidebarCollapsed: boolean;
	layerSidebarCollapsed: boolean;
	scriptSidebarCollapsed: boolean;
	bottomPanelTab: string;
	isDarkMode: boolean;
}

export class UIViewModel extends BaseViewModel {
	private state = $state<UIState>({
		datasetSidebarCollapsed: false,
		layerSidebarCollapsed: false,
		scriptSidebarCollapsed: false,
		bottomPanelTab: 'layers',
		isDarkMode: false,
	});

	getState() {
		return this.state;
	}

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

	get bottomPanelTab() {
		return this.state.bottomPanelTab;
	}

	get bottomPanelRunIndex() {
		if (this.state.bottomPanelTab.startsWith('run-')) {
			return parseInt(this.state.bottomPanelTab.split('-')[1]);
		}
		return -1;
	}

	set bottomPanelTab(value: string) {
		this.state.bottomPanelTab = value;
	}

	get isDarkMode() {
		return this.state.isDarkMode;
	}

	set isDarkMode(value: boolean) {
		this.state.isDarkMode = value;
	}

	toggleDarkMode() {
		this.state.isDarkMode = !this.state.isDarkMode;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', this.state.isDarkMode);
		}
	}

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
