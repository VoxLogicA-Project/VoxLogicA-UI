import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '$lib/config/config';

export const GET: RequestHandler = async () => {
	try {
		const entries = await fs.readdir(DATASET_PATH, { withFileTypes: true });

		const datasets = await Promise.all(
			entries
				.filter((entry) => entry.isDirectory())
				.map(async (entry) => {
					const datasetPath = path.join(DATASET_PATH, entry.name);
					const configPath = path.join(datasetPath, 'dataset.json');
					const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
					// Rename name to id to uniform with the rest of the models
					const { name, ...restConfig } = config;

					return {
						...restConfig,
						id: name,
						path: entry.name,
					};
				})
		);

		return json(datasets);
	} catch (error) {
		return new Response('Failed to load datasets', { status: 500 });
	}
};
