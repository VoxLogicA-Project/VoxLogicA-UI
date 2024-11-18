import { json } from '@sveltejs/kit';
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
						return null;
					})
			)
		).filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null);

		return json(datasets);
	} catch (error) {
		return new Response('Failed to load datasets', { status: 500 });
	}
};
