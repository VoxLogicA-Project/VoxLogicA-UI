import type { Dataset, Case, Layer, PresetScript } from './types';

export class RepositoryError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'RepositoryError';
	}
}

export interface IDataRepository {
	getDatasets(): Promise<Dataset[]>;
	getCases(dataset: Dataset): Promise<Case[]>;
	getLayers(dataset: Dataset, caseData: Case): Promise<Layer[]>;
	getPresetScripts(): Promise<PresetScript[]>;
	getPresetScriptCode(script: PresetScript): Promise<string>;
}

export function createApiRepository(): IDataRepository {
	async function fetchWithError(url: string, defaultErrorMessage: string): Promise<Response> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				const errorData = await response.json();
				throw new RepositoryError(errorData?.message || defaultErrorMessage, response.status);
			}
			return response;
		} catch (error) {
			if (error instanceof RepositoryError) {
				throw error;
			}
			throw new RepositoryError(defaultErrorMessage, undefined, error);
		}
	}

	return {
		async getDatasets(): Promise<Dataset[]> {
			const response = await fetchWithError('/datasets', 'Failed to fetch datasets');
			return response.json();
		},

		async getCases(dataset: Dataset): Promise<Case[]> {
			const response = await fetchWithError(
				`/datasets/${dataset.id}/cases`,
				`Failed to fetch cases for dataset: ${dataset.id}`
			);
			return response.json();
		},

		async getLayers(dataset: Dataset, caseData: Case): Promise<Layer[]> {
			const response = await fetchWithError(
				`/datasets/${dataset.id}/cases/${caseData.id}/layers`,
				`Failed to fetch layers for case: ${caseData.id}`
			);
			return response.json();
		},

		async getPresetScripts(): Promise<PresetScript[]> {
			const response = await fetchWithError('/scripts', 'Failed to fetch scripts');
			return response.json();
		},

		async getPresetScriptCode(script: PresetScript): Promise<string> {
			const response = await fetchWithError(script.path, `Failed to fetch script: ${script.id}`);
			return response.text();
		},
	};
}

export const apiRepository = createApiRepository();
