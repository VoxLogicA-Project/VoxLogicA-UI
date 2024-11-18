import type { Dataset, Case, Layer } from './types';

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
}

export function createApiRepository(): IDataRepository {
	async function fetchWithError<T>(url: string, defaultErrorMessage: string): Promise<T> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				const errorData = await response.json();
				throw new RepositoryError(errorData?.message || defaultErrorMessage, response.status);
			}
			return await response.json();
		} catch (error) {
			if (error instanceof RepositoryError) {
				throw error;
			}
			throw new RepositoryError(defaultErrorMessage, undefined, error);
		}
	}

	return {
		async getDatasets(): Promise<Dataset[]> {
			return fetchWithError('/datasets', 'Failed to fetch datasets');
		},

		async getCases(dataset: Dataset): Promise<Case[]> {
			return fetchWithError(
				`/datasets/${dataset.path}/cases`,
				`Failed to fetch cases for dataset: ${dataset.id}`
			);
		},

		async getLayers(dataset: Dataset, caseData: Case): Promise<Layer[]> {
			return fetchWithError(
				`/datasets/${dataset.path}/cases/${caseData.id}/layers`,
				`Failed to fetch layers for case: ${caseData.id}`
			);
		},
	};
}

export const apiRepository = createApiRepository();
