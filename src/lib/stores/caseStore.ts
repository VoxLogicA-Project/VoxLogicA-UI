import type { Case } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import type { MainState } from './mainStore';
import { mainStore } from './mainStore';
import { get } from 'svelte/store';

function createCaseStore() {
	return {
		async loadCases() {
			const state = get(mainStore);
			if (!state.datasets.selected) return;

			mainStore.update((state: MainState) => ({
				...state,
				cases: {
					...state.cases,
					loading: true,
					error: null,
				},
			}));

			try {
				const cases = await apiRepository.getCases(state.datasets.selected);
				mainStore.update((state: MainState) => ({
					...state,
					cases: {
						...state.cases,
						available: cases,
						loading: false,
					},
				}));
			} catch (error) {
				mainStore.update((state: MainState) => ({
					...state,
					cases: {
						...state.cases,
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to load cases',
					},
				}));
			}
		},

		toggleCase(caseData: Case) {
			const state = get(mainStore);
			const isSelected = state.cases.selected.some((c) => c.id === caseData.id);

			if (isSelected) {
				this.deselectCase(caseData);
			} else {
				this.selectCase(caseData);
			}
		},

		selectCase(caseData: Case) {
			const state = get(mainStore);

			// Check if we can add more cases
			if (state.cases.selected.length >= state.cases.maxCases) {
				mainStore.update((state: MainState) => ({
					...state,
					cases: {
						...state.cases,
						error: `Cannot select more than ${state.cases.maxCases} cases`,
					},
				}));
				return;
			}

			// Check if case is already selected
			if (state.cases.selected.some((c) => c.id === caseData.id)) {
				return;
			}

			mainStore.update((state: MainState) => ({
				...state,
				cases: {
					...state.cases,
					selected: [...state.cases.selected, caseData],
					error: null,
				},
			}));
		},

		deselectCase(caseData: Case) {
			mainStore.update((state: MainState) => {
				// Create new objects without the case's entries
				const newAvailableByCase = { ...state.layers.availableByCase };
				const newSelected = { ...state.layers.selected };
				delete newAvailableByCase[caseData.id];
				delete newSelected[caseData.id];

				return {
					...state,
					cases: {
						...state.cases,
						selected: state.cases.selected.filter((c) => c.id !== caseData.id),
						error: null,
					},
					layers: {
						...state.layers,
						availableByCase: newAvailableByCase,
						selected: newSelected,
					},
				};
			});
		},

		clearSelectedCases() {
			mainStore.update((state: MainState) => ({
				...state,
				cases: {
					...state.cases,
					selected: [],
					error: null,
				},
				layers: {
					availableByCase: {},
					selected: {},
					styles: {},
					loading: false,
					error: null,
				},
			}));
		},

		canSelectMore(): boolean {
			const state = get(mainStore);
			return state.cases.selected.length < state.cases.maxCases;
		},
	};
}

export const caseStore = createCaseStore();
