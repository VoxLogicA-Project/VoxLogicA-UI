import type { Case } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { mainState } from './mainState.svelte';

function createCaseOperations() {
	return {
		async loadCases() {
			if (!mainState.datasets.selected) return;

			mainState.cases.loading = true;
			mainState.cases.error = null;

			try {
				const cases = await apiRepository.getCases(mainState.datasets.selected);
				mainState.cases.available = cases;
				mainState.cases.loading = false;
			} catch (error) {
				mainState.cases.loading = false;
				mainState.cases.error = error instanceof Error ? error.message : 'Failed to load cases';
			}
		},

		toggleCase(caseData: Case) {
			const isSelected = mainState.cases.selected.some((c) => c.id === caseData.id);
			if (isSelected) {
				this.deselectCase(caseData);
			} else {
				this.selectCase(caseData);
			}
		},

		selectCase(caseData: Case) {
			// Check if we can add more cases
			if (mainState.cases.selected.length >= mainState.cases.maxCases) {
				mainState.cases.error = `Cannot select more than ${mainState.cases.maxCases} cases`;
				return;
			}

			// Check if case is already selected
			if (mainState.cases.selected.some((c) => c.id === caseData.id)) {
				return;
			}

			mainState.cases.selected = [...mainState.cases.selected, caseData];
			mainState.cases.error = null;
		},

		deselectCase(caseData: Case) {
			// Remove case's entries from layers
			delete mainState.layers.availableByCase[caseData.id];
			delete mainState.layers.selected[caseData.id];

			mainState.cases.selected = mainState.cases.selected.filter((c) => c.id !== caseData.id);
			mainState.cases.error = null;
		},

		clearSelectedCases() {
			mainState.cases.selected = [];
			mainState.cases.error = null;
			mainState.layers.availableByCase = {};
			mainState.layers.selected = {};
			mainState.layers.styles = {};
			mainState.layers.loading = false;
			mainState.layers.error = null;
		},

		canSelectMore(): boolean {
			return mainState.cases.selected.length < mainState.cases.maxCases;
		},
	};
}

export const caseOperations = createCaseOperations();
