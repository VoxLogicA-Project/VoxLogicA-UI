import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../config';
import type { Dataset } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const datasetPath = path.join(DATASET_PATH, params.dataset);
		const configPath = path.join(datasetPath, 'dataset.json');

		const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
		const { name, ...restConfig } = config;

		const dataset: Dataset = {
			...restConfig,
			id: name,
			path: params.dataset,
		};

		return json(dataset);
	} catch (error) {
		return new Response('Dataset not found', { status: 404 });
	}
};
