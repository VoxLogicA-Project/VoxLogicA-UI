import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../config';
import type { Dataset } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const datasetPath = path.join(DATASET_PATH, params.dataset);

		// Check if dataset directory exists
		try {
			await fs.access(datasetPath);
		} catch (err) {
			console.error(`Dataset directory not found: ${datasetPath}`);
			throw error(404, `Dataset not found: ${params.dataset}`);
		}

		const dataset: Dataset = {
			name: params.dataset,
		};

		return json(dataset);
	} catch (err) {
		if (isHttpError(err)) {
			throw err;
		}
		console.error('Unexpected error loading dataset:', err);
		throw error(500, 'Internal server error. Check server console for details.');
	}
};
