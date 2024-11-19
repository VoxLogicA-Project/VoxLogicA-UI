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

		// Check if dataset directory exists
		try {
			await fs.access(datasetPath);
		} catch (err) {
			console.error(`Dataset directory not found: ${datasetPath}`);
			return new Response('Dataset not found', { status: 404 });
		}

		// Read and parse config file
		let config;
		try {
			const configData = await fs.readFile(configPath, 'utf-8');
			config = JSON.parse(configData);
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
				console.error(`Dataset config file not found: ${configPath}`);
				return new Response('Dataset configuration not found', { status: 404 });
			}
			console.error(`Error reading dataset config: ${error}`);
			return new Response('Invalid dataset configuration', { status: 400 });
		}

		// Validate required fields
		if (!config.name || !config.layout) {
			console.error('Dataset config missing required "name" or "layout" field(s)');
			return new Response('Invalid dataset configuration: missing name or layout', { status: 400 });
		}

		const { layout } = config;
		const dataset: Dataset = {
			id: params.dataset,
			layout,
		};

		return json(dataset);
	} catch (error) {
		console.error('Unexpected error loading dataset:', error);
		return new Response('Internal server error', { status: 500 });
	}
};
