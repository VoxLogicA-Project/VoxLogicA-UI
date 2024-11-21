import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../config';

export const GET: RequestHandler = async () => {
	try {
		const entries = await fs.readdir(DATASET_PATH, { withFileTypes: true });
		const datasetHandler = (await import('./[dataset]/+server')).GET;

		const datasets = (
			await Promise.all(
				entries
					.filter((entry) => entry.isDirectory())
					.map(async (entry) => {
						const response = await datasetHandler({ params: { dataset: entry.name } } as any);
						if (response.status === 200) {
							return await response.json();
						}
						console.error(`Error loading dataset: ${entry.name}. Skipping. Response:`, response);
						return null;
					})
			)
		).filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null);

		return json(datasets);
	} catch (err) {
		console.error('Error loading datasets:', err);
		throw error(500, 'Failed to load datasets. Check server console for details.');
	}
};
