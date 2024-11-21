import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../config';
import type { Dataset } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const datasetPath = path.join(DATASET_PATH, params.dataset);
		const configPath = path.join(datasetPath, 'dataset.json');

		// Check if dataset directory exists
		try {
			await fs.access(datasetPath);
		} catch (err) {
			console.error(`Dataset directory not found: ${datasetPath}`);
			throw error(404, `Dataset not found: ${params.dataset}`);
		}

		// Read and parse config file
		let config;
		try {
			const configData = await fs.readFile(configPath, 'utf-8');
			config = JSON.parse(configData);
		} catch (err) {
			if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
				console.error(`Dataset config file not found: ${configPath}`);
				throw error(404, `Dataset configuration not found: ${params.dataset}`);
			}
			console.error(`Error reading dataset config: ${err}`);
			throw error(400, 'Invalid dataset configuration');
		}

		// Validate required fields
		if (!config.name || !config.layout) {
			console.error('Dataset config missing required "name" or "layout" field(s)');
			throw error(400, 'Invalid dataset configuration: missing name or layout');
		}

		const { layout } = config;
		const dataset: Dataset = {
			id: params.dataset,
			layout,
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
