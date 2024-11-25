import { uiViewModel } from '$lib/viewmodels/ui.svelte';
import { caseViewModel } from '$lib/viewmodels/case.svelte';
import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
import { LayerViewModel, layerViewModel } from '$lib/viewmodels/layer.svelte';
import { runViewModel } from '$lib/viewmodels/run.svelte';
import { BaseViewModel } from '$lib/viewmodels/base.svelte';
import type { Run } from '$lib/models/types';

interface SerializedApplicationState {
	dataset: {
		selectedId: string | null;
	};
	case: {
		selectedIds: string[];
	};
	layer: {
		selected: Record<string, { id: string }[]>;
		styles: ReturnType<typeof layerViewModel.getState>['styles'];
	};
	run: {
		history: ReturnType<typeof runViewModel.getState>['history'];
		layersStates: ReturnType<typeof layerViewModel.getState>[];
		editorContent: ReturnType<typeof runViewModel.getState>['editorContent'];
	};
	ui: ReturnType<typeof uiViewModel.getState>;
}

class StateManager extends BaseViewModel {
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

	private getState(): SerializedApplicationState {
		this.markAsSaved();
		const runState = runViewModel.getState();

		return {
			dataset: {
				selectedId: datasetViewModel.selectedDataset?.id || null,
			},
			case: {
				selectedIds: caseViewModel.selectedCases.map((c) => c.id),
			},
			layer: {
				selected: Object.fromEntries(
					Object.entries(layerViewModel.getState().selected).map(([caseId, layers]) => [
						caseId,
						layers.map((l) => ({ id: l.id })),
					])
				),
				styles: layerViewModel.styles,
			},
			run: {
				history: runState.history,
				layersStates: runState.layersStates.map((vm) => vm.getState()),
				editorContent: runState.editorContent,
			},
			ui: uiViewModel.getState(),
		};
	}

	async loadState(state: SerializedApplicationState) {
		this.setLoading(true);
		// Reset all viewmodels first
		caseViewModel.reset();
		datasetViewModel.reset();
		layerViewModel.reset();
		runViewModel.reset();
		uiViewModel.reset();

		try {
			// Load and validate datasets
			await datasetViewModel.loadDatasets();
			const availableDataset = datasetViewModel.datasets.find(
				(d) => d.id === state.dataset.selectedId
			);
			if (availableDataset) {
				datasetViewModel.selectDataset(availableDataset);

				// Load and validate cases
				await caseViewModel.loadCases();
				const validSelectedCases = caseViewModel.cases.filter((c) =>
					state.case.selectedIds.includes(c.id)
				);

				// Load cases and their layers sequentially (TODO: add method to select multiple cases at once)
				for (const caseToSelect of validSelectedCases) {
					await caseViewModel.selectCase(caseToSelect);
				}

				// Restore layer selections and styles for valid cases/layers
				console.log(state.layer.selected);
				for (const [caseId, selectedLayers] of Object.entries(state.layer.selected)) {
					const availableLayers = layerViewModel.getAvailableLayersForCase(caseId);
					const validLayers = availableLayers.filter((l) =>
						selectedLayers.some((sl) => sl.id === l.id)
					);

					validLayers.forEach((layer) => {
						layerViewModel.selectLayer(caseId, layer);
						if (state.layer.styles[layer.id]) {
							layerViewModel.styles[layer.id] = state.layer.styles[layer.id];
						}
					});
				}
			}

			// Validate and restore runs
			const validatedRuns: Run[][] = [];
			const validatedLayersStates: LayerViewModel[] = [];

			for (const [index, runGroup] of state.run.history.entries()) {
				const validatedRunGroup: Run[] = [];
				const serializedLayerState = state.run.layersStates[index];

				for (const run of runGroup) {
					try {
						// Get first available layer path from the serialized state
						const firstLayer = Object.values(serializedLayerState.availableByCase[run.case.id])[0];
						if (!firstLayer) {
							console.warn(`No layers found for run ${run.id}`);
							continue;
						}

						// Check if run still exists on server
						const response = await fetch(firstLayer.path);
						if (response.ok) {
							validatedRunGroup.push(run);
						}
					} catch (error) {
						console.warn(`Run ${run.id} is no longer available:`, error);
					}
				}

				if (validatedRunGroup.length > 0) {
					validatedRuns.push(validatedRunGroup);

					// Reconstruct LayerViewModel from serialized state
					const layerVM = new LayerViewModel();
					Object.assign(layerVM.getState(), serializedLayerState);
					validatedLayersStates.push(layerVM);
				}
			}

			// Update run state with validated runs and reconstructed LayerViewModels
			Object.assign(runViewModel.getState(), {
				history: validatedRuns,
				layersStates: validatedLayersStates,
				editorContent: state.run.editorContent,
			});

			await runViewModel.loadPresets();

			// Restore UI state
			Object.assign(uiViewModel.getState(), state.ui);
			if (
				state.ui.fullscreenCaseId &&
				!caseViewModel.cases.some((c) => c.id === state.ui.fullscreenCaseId)
			) {
				uiViewModel.fullscreenCaseId = null;
			}
		} catch (error) {
			console.error('Error loading application state:', error);
			this.setError('Failed to restore application state. Some selections may be missing.');
		} finally {
			this.setLoading(false);
		}
	}

	saveToLocalStorage(key: string = 'app_state') {
		const state = this.getState();
		localStorage.setItem(key, JSON.stringify(state));
		this.markAsSaved();
	}

	loadFromLocalStorage(key: string = 'app_state') {
		const savedState = localStorage.getItem(key);
		if (savedState) {
			const state = JSON.parse(savedState) as SerializedApplicationState;
			this.loadState(state);
			this.markAsSaved();
		}
	}
}

export const stateManager = new StateManager();
