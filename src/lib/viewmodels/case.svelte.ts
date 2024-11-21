import { BaseViewModel } from './base.svelte';
import type { Case } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { datasetViewModel } from './dataset.svelte';
import { layerViewModel } from './layer.svelte';

interface CaseState {
	available: Case[];
	selected: Case[];
	maxCases: number;
}

export class CaseViewModel extends BaseViewModel {
	private state = $state<CaseState>({
		available: [],
		selected: [],
		maxCases: 16,
	});

	getState() {
		return this.state;
	}

	get cases() {
		return this.state.available;
	}

	get selectedCases() {
		return this.state.selected;
	}

	get maxCases() {
		return this.state.maxCases;
	}

	async loadCases() {
		this.reset();

		const dataset = datasetViewModel.selectedDataset;
		if (!dataset) return;

		this.setLoading(true);
		this.setError(null);

		try {
			const cases = await apiRepository.getCases(dataset);
			this.state.available = cases;
		} catch (error) {
			this.setError(error instanceof Error ? error.message : 'Failed to load cases');
		} finally {
			this.setLoading(false);
		}
	}

	selectCase(caseData: Case) {
		if (this.state.selected.length >= this.state.maxCases) {
			this.setError(`Cannot select more than ${this.state.maxCases} cases`);
			return;
		}

		if (this.state.selected.some((c) => c.id === caseData.id)) {
			return;
		}

		layerViewModel.loadLayersFromDataset(caseData);

		this.state.selected = [...this.state.selected, caseData];
		this.setError(null);
	}

	deselectCase(caseData: Case) {
		this.state.selected = this.state.selected.filter((c) => c.id !== caseData.id);
		this.setError(null);
		layerViewModel.removeCaseLayers(caseData.id);
	}

	toggleCase(caseData: Case) {
		const isSelected = this.state.selected.some((c) => c.id === caseData.id);
		if (isSelected) {
			this.deselectCase(caseData);
		} else {
			this.selectCase(caseData);
		}
	}

	canSelectMore = $derived(() => this.state.selected.length < this.state.maxCases);

	isSelected = $derived((caseData: Case) => this.state.selected.some((c) => c.id === caseData.id));

	getSelectionIndex = $derived((caseData: Case) =>
		this.state.selected.findIndex((c) => c.id === caseData.id)
	);

	reset() {
		this.state.available = [];
		this.state.selected = [];
		this.setError(null);
		this.setLoading(false);
	}
}

export const caseViewModel = new CaseViewModel();
