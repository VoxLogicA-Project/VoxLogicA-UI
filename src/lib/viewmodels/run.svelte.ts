import { BaseViewModel } from './base.svelte';
import type { Case, ColorMap, Layer, PresetScript, Run } from '$lib/models/types';
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
		availablePresets: [],
		editorContent: '',
		history: [],
		layersStates: [],
	});

	// State Access Methods
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

	// Script Content Management
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

	saveEditorContent(content: string) {
		this.state.editorContent = content;
	}

	// Preset Management
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
			this.state.availablePresets = [];
			this.setError(error instanceof Error ? error.message : 'Failed to load preset script');
		} finally {
			this.setLoading(false);
		}
	}

	// Run Execution Methods
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

		const run: Run = {
			id: result.id,
			scriptContent: result.scriptContent,
			case: result.case,
			timestamp: result.timestamp,
			outputPrint: result.outputPrint,
			outputLayers: result.outputLayers,
			outputError: result.outputError,
			outputLog: result.outputLog,
		};

		return run;
	}

	async runAll(cases: Case[]) {
		this.setLoading(true);
		this.setError(null);

		try {
			// Run all cases in parallel
			const runPromises = cases.map(async (case_) => {
				try {
					return await this.singleRun(case_);
				} catch (error) {
					// If a single run fails, return an error run object
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
					return errorRun;
				}
			});

			const runs = await Promise.all(runPromises);

			// Add runs to history and initialize a new layersState
			this.state.history = [...this.state.history, runs];

			// Initialize new layersState
			const newLayerViewModel = new LayerViewModel();

			// Populate availableByCase and styles from run results
			runs.forEach((run) => {
				newLayerViewModel.loadLayersFromRun(run.case, run.outputLayers);
			});

			this.state.layersStates = [...this.state.layersStates, newLayerViewModel];

			// Set error if any run had an error
			const anyError = runs.find((run) => run.outputError);
			if (anyError) {
				this.setError('Some (or all) runs failed.');
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

	// Layer Selection Derived Properties
	selectedLayersForCase = $derived((caseId: string) => {
		const allSelectedLayers: Layer[] = [];
		this.state.layersStates.forEach((state) => {
			const layersForCase = state.selectedLayersForCase(caseId) || [];
			allSelectedLayers.push(...layersForCase);
		});
		return allSelectedLayers;
	});

	selectedLayersWithColorMapsForCase = $derived((caseId: string) => {
		const allSelectedLayersWithColorMaps: {
			runIndex: number;
			layer: Layer;
			colorMap: ColorMap | string;
		}[] = [];
		this.state.layersStates.forEach((state, index) => {
			const layersWithColorMaps = state.selectedLayersWithColorMapsForCase(caseId);
			allSelectedLayersWithColorMaps.push(
				...layersWithColorMaps.map((item) => ({
					...item,
					runIndex: index,
				}))
			);
		});
		return allSelectedLayersWithColorMaps;
	});

	uniqueLayerIdsByRun = $derived((runIndex: number) => {
		return this.state.layersStates[runIndex]?.uniqueLayersIds || [];
	});

	// State Management
	reset() {
		this.state.history = [];
		this.state.layersStates = [];
		this.state.availablePresets = [];
		this.state.editorContent = '';
		this.setError(null);
		this.setLoading(false);
	}
}

export const runViewModel = new RunViewModel();
