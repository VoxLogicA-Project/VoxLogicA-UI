import { mainStore } from './mainStore';
import { get } from 'svelte/store';

function createUiStore() {
	return {
		toggleDatasetSidebar() {
			mainStore.update((state) => ({
				...state,
				ui: {
					...state.ui,
					datasetSidebarCollapsed: !state.ui.datasetSidebarCollapsed,
				},
			}));
		},

		toggleLayerSidebar() {
			mainStore.update((state) => ({
				...state,
				ui: {
					...state.ui,
					layerSidebarCollapsed: !state.ui.layerSidebarCollapsed,
				},
			}));
		},

		isSidebarCollapsed(sidebarId: 'dataset' | 'layer'): boolean {
			const state = get(mainStore);
			return state.ui[`${sidebarId}SidebarCollapsed`];
		},
	};
}

export const uiStore = createUiStore();
