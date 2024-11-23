import { uiViewModel } from '$lib/viewmodels/ui.svelte';
import { caseViewModel } from '$lib/viewmodels/case.svelte';
import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
import { layerViewModel } from '$lib/viewmodels/layer.svelte';
import { runViewModel } from '$lib/viewmodels/run.svelte';

interface ApplicationState {
	ui: ReturnType<typeof uiViewModel.getState>;
	case: ReturnType<typeof caseViewModel.getState>;
	dataset: ReturnType<typeof datasetViewModel.getState>;
	layer: ReturnType<typeof layerViewModel.getState>;
	run: ReturnType<typeof runViewModel.getState>;
}

class StateManager {
	private hasUnsavedChanges = $state(false);

	markAsUnsaved() {
		this.hasUnsavedChanges = true;
	}

	markAsSaved() {
		this.hasUnsavedChanges = false;
	}

	hasChanges(): boolean {
		return this.hasUnsavedChanges;
	}

	private getState(): ApplicationState {
		this.markAsSaved();
		return {
			ui: uiViewModel.getState(),
			case: caseViewModel.getState(),
			dataset: datasetViewModel.getState(),
			layer: layerViewModel.getState(),
			run: runViewModel.getState(),
		};
	}

	loadState(state: ApplicationState) {
		// Reset all viewmodels first
		uiViewModel.reset();
		caseViewModel.reset();
		datasetViewModel.reset();
		layerViewModel.reset();
		runViewModel.reset();

		// Load the saved state into each viewmodel
		Object.assign(uiViewModel.getState(), state.ui);
		Object.assign(caseViewModel.getState(), state.case);
		Object.assign(datasetViewModel.getState(), state.dataset);
		Object.assign(layerViewModel.getState(), state.layer);
		Object.assign(runViewModel.getState(), state.run);
	}

	saveToLocalStorage(key: string = 'app_state') {
		const state = this.getState();
		localStorage.setItem(key, JSON.stringify(state));
		this.markAsSaved();
	}

	loadFromLocalStorage(key: string = 'app_state') {
		const savedState = localStorage.getItem(key);
		if (savedState) {
			const state = JSON.parse(savedState) as ApplicationState;
			this.loadState(state);
			this.markAsSaved();
		}
	}
}

export const stateManager = new StateManager();
