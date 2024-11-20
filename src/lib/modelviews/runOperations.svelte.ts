import type { Case, Layer, Run } from '$lib/models/types';
import { mainState } from '$lib/modelviews/mainState.svelte';
import type { LayersState } from '$lib/modelviews/mainState.svelte';

function createRunOperations() {
	// Cache for unique layers by run, using WeakMap to avoid memory leaks
	const uniqueLayersCache = new WeakMap<Run[], string[]>();

	async function singleRun(scriptContent: string, case_: Case): Promise<Run> {
		const response = await fetch('/run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ scriptContent, case_ }),
		});

		const result = await response.json();
		if (!response.ok) {
			const errorMessage = result.message || response.statusText;
			throw new Error(errorMessage);
		}

		return {
			id: result.id,
			scriptContent,
			case: case_,
			timestamp: new Date(),
			outputPrint: result.print,
			outputLayers: result.layers,
			outputError: result.error,
			outputLog: result.log,
		};
	}

	return {
		async run(scriptContent: string, cases: Case[]) {
			mainState.runs.loading = true;
			mainState.runs.error = null;

			try {
				const runs: Run[] = [];

				// Run all cases sequentially (TODO: Run in parallel)
				for (const case_ of cases) {
					try {
						const run = await singleRun(scriptContent, case_);
						runs.push(run);
					} catch (error) {
						// If a single run fails, add the error to the run array
						const errorRun: Run = {
							id: '',
							scriptContent,
							case: case_,
							timestamp: new Date(),
							outputPrint: [],
							outputLayers: [],
							outputError: error instanceof Error ? error.message : 'Unknown error',
							outputLog: '',
						};
						runs.push(errorRun);
					}
				}

				// Add runs to history and initialize a new layersState
				mainState.runs.history = [...mainState.runs.history, runs];

				// Initialize new layersState with available layers and styles per case
				const newLayersState: LayersState = {
					availableByCase: {},
					selected: {},
					styles: {},
					loading: false,
					error: null,
				};

				// Populate availableByCase and styles from run results
				runs.forEach((run) => {
					newLayersState.availableByCase[run.case.id] = run.outputLayers;
					run.outputLayers.forEach((layer) => {
						// Initialize default styles for new layers
						newLayersState.styles[layer.id] = {
							color: { r: 255, g: 255, b: 255, a: 1 },
						};
					});
				});

				mainState.runs.layersStates = [...mainState.runs.layersStates, newLayersState];

				// Set error if any run had an error
				const anyError = runs.find((run) => run.outputError);
				mainState.runs.error = anyError ? 'Some runs failed.' : null;

				return runs;
			} catch (error) {
				mainState.runs.error = 'Frontend Error: please check console';
				console.error(error);
				throw error;
			} finally {
				mainState.runs.loading = false;
			}
		},

		clearRunHistory() {
			mainState.runs.history = [];
			mainState.runs.loading = false;
			mainState.runs.error = null;
		},

		selectLayer(runIndex: number, caseId: string, layer: Layer) {
			const layersState = mainState.runs.layersStates[runIndex];
			if (!layersState) return;

			layersState.selected[caseId] = [...(layersState.selected[caseId] || []), layer];
		},

		unselectLayer(runIndex: number, caseId: string, layer: Layer) {
			const layersState = mainState.runs.layersStates[runIndex];
			if (!layersState) return;

			const currentLayers = layersState.selected[caseId] || [];
			layersState.selected[caseId] = currentLayers.filter((l) => l.id !== layer.id);
		},

		toggleLayer(runIndex: number, caseId: string, layer: Layer) {
			const layersState = mainState.runs.layersStates[runIndex];
			if (!layersState) return;

			const currentLayers = layersState.selected[caseId] || [];
			const isSelected = currentLayers.some((l) => l.id === layer.id);

			if (isSelected) {
				this.unselectLayer(runIndex, caseId, layer);
			} else {
				this.selectLayer(runIndex, caseId, layer);
			}
		},

		selectLayerForAllRunCases(runIndex: number, layerId: string) {
			const run = mainState.runs.history[runIndex];
			if (!run) return;

			const layersState = mainState.runs.layersStates[runIndex];
			if (!layersState) return;

			for (const singleRun of run) {
				const layer = layersState.availableByCase[singleRun.case.id]?.find((l) => l.id === layerId);
				if (layer) {
					this.selectLayer(runIndex, singleRun.case.id, layer);
				}
			}
		},

		unselectLayerForAllRunCases(runIndex: number, layerId: string) {
			const run = mainState.runs.history[runIndex];
			if (!run) return;

			const layersState = mainState.runs.layersStates[runIndex];
			if (!layersState) return;

			for (const singleRun of run) {
				const layer = layersState.availableByCase[singleRun.case.id]?.find((l) => l.id === layerId);
				if (layer) {
					this.unselectLayer(runIndex, singleRun.case.id, layer);
				}
			}
		},

		uniqueLayersByRun(runIndex: number): string[] {
			const run = mainState.runs.history[runIndex];
			if (!run) return [];

			// Check cache first
			const cached = uniqueLayersCache.get(run);
			if (cached) return cached;

			// Calculate unique layers
			const layerIds = new Set<string>();
			run.forEach((singleRun) => {
				singleRun.outputLayers.forEach((layer) => {
					layerIds.add(layer.id);
				});
			});

			const result = Array.from(layerIds);
			uniqueLayersCache.set(run, result);
			return result;
		},
	};
}

export const runOperations = createRunOperations();
