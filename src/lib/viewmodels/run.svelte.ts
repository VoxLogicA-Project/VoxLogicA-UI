import { BaseViewModel } from './base.svelte';
import type { Case, Layer, LayerStyle, PresetScript, Run } from '$lib/models/types';
import { LayerViewModel, layerViewModel } from './layer.svelte';
import { apiRepository } from '$lib/models/repository';

interface RunState {
	availablePresets: PresetScript[];
	editorContent: string;
	history: Run[][];
	layersStates: LayerViewModel[];
}

export class RunViewModel extends BaseViewModel {
	private state = $state<RunState>({
		history: [],
		layersStates: [],
		availablePresets: [],
		editorContent: '',
	});

	getState() {
		return this.state;
	}

	get history() {
		return this.state.history;
	}

	get layerStates() {
		return this.state.layersStates;
	}

	get availablePresets() {
		return this.state.availablePresets;
	}

	get editorContent() {
		return this.state.editorContent;
	}

	headerContent = $derived.by(() => {
		const layersIds = layerViewModel.uniqueLayersIds;
		return `import "stdlib.imgql"\n\n// Load layers\n${layersIds
			.map((layerId) => {
				return `load ${layerId} = "\$\{LAYER_PATH:${layerId}\}"`;
			})
			.join('\n')}`;
	});

	get fullScriptContent() {
		return this.headerContent + '\n\n' + this.state.editorContent;
	}

	async loadPresets() {
		this.setLoading(true);
		this.setError(null);

		try {
			const presets = await apiRepository.getPresetScripts();
			this.state.availablePresets = presets;
		} catch (error) {
			this.setError(error instanceof Error ? error.message : 'Failed to load presets');
		} finally {
			this.setLoading(false);
		}
	}

	async loadPresetScript(preset: PresetScript) {
		this.setLoading(true);
		this.setError(null);

		try {
			const code = await apiRepository.getPresetScriptCode(preset);
			this.state.editorContent = code;
		} catch (error) {
			this.setError(error instanceof Error ? error.message : 'Failed to load preset script');
		} finally {
			this.setLoading(false);
		}
	}

	saveEditorContent(content: string) {
		this.state.editorContent = content;
	}

	private async singleRun(case_: Case): Promise<Run> {
		const response = await fetch('/run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ scriptContent: this.fullScriptContent, case_ }),
		});

		const result = await response.json();
		if (!response.ok) {
			const errorMessage = result.message || response.statusText;
			throw new Error(errorMessage);
		}

		return {
			id: result.id,
			scriptContent: this.fullScriptContent,
			case: case_,
			timestamp: new Date(),
			outputPrint: result.print,
			outputLayers: result.layers,
			outputError: result.error,
			outputLog: result.log,
		};
	}

	async runAll(cases: Case[]) {
		this.setLoading(true);
		this.setError(null);

		try {
			const runs: Run[] = [];

			// Run all cases sequentially (TODO: Run in parallel)
			for (const case_ of cases) {
				try {
					const run = await this.singleRun(case_);
					runs.push(run);
				} catch (error) {
					// If a single run fails, add the error to the run array
					const errorRun: Run = {
						id: '',
						scriptContent: this.fullScriptContent,
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
			this.state.history = [...this.state.history, runs];

			// Initialize new layersState
			const newLayerViewModel = new LayerViewModel();

			// Populate availableByCase and styles from run results
			runs.forEach((run) => {
				newLayerViewModel.loadLayersFromRun(run.case, run.outputLayers);
			});

			console.log('newLayerViewModel', newLayerViewModel.getState());
			this.state.layersStates = [...this.state.layersStates, newLayerViewModel];

			// Set error if any run had an error
			const anyError = runs.find((run) => run.outputError);
			if (anyError) {
				this.setError('Some runs failed.');
			}

			return runs;
		} catch (error) {
			this.setError('Frontend Error: please check console');
			console.error(error);
			throw error;
		} finally {
			this.setLoading(false);
		}
	}

	selectedLayersForCase = $derived((caseId: string) => {
		const allSelectedLayers: Layer[] = [];
		this.state.layersStates.forEach((state) => {
			const layersForCase = state.selectedLayersForCase(caseId) || [];
			allSelectedLayers.push(...layersForCase);
		});
		return allSelectedLayers;
	});

	selectedLayersWithStylesForCase = $derived((caseId: string) => {
		const allSelectedLayersWithStyles: { layer: Layer; style: LayerStyle }[] = [];
		this.state.layersStates.forEach((state) => {
			const layersWithStyles = state.selectedLayersWithStylesForCase(caseId);
			allSelectedLayersWithStyles.push(...layersWithStyles);
		});
		return allSelectedLayersWithStyles;
	});

	uniqueLayerIdsByRun = $derived((runIndex: number) => {
		return this.state.layersStates[runIndex]?.uniqueLayersIds || [];
	});

	reset() {
		this.state.history = [];
		this.state.layersStates = [];
		this.setError(null);
		this.setLoading(false);
	}
}

export const runViewModel = new RunViewModel();
