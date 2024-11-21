import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../../../../config';
import type { Dataset, Layer } from '$lib/models/types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	// Check if the dataset exists
	const datasetResponse = await fetch(`/datasets/${params.dataset}`);
	if (!datasetResponse.ok) {
		throw error(404, `Dataset ${params.dataset} not found`);
	}

	// Check if the dataset layout is supported
	const dataset: Dataset = await datasetResponse.json();
	if (dataset.layout !== 'brats') {
		throw error(
			400,
			`Dataset layout '${dataset.layout}' is not supported. Only 'brats' is currently supported.`
		);
	}

	// Read the case directory
	const casePath = path.join(DATASET_PATH, params.dataset, params.case);
	let files: string[];
	try {
		files = await fs.readdir(casePath);
	} catch (e) {
		throw error(404, `Case directory not found: ${params.case}`);
	}

	// Parse the layers
	const layers: Layer[] = [];
	for (const file of files.filter((file) => file.endsWith('.nii.gz'))) {
		let layer_id = file.match(new RegExp(`${params.case}_(.+)\\.nii\\.gz$`));
		let filename = file.match(/(.+)\.nii\.gz$/);

		if (!layer_id) {
			layer_id = filename;
		}

		if (!layer_id || !filename) {
			console.error(`Skipping invalid filename format: ${file}`);
			continue;
		}

		layers.push({
			id: layer_id[1],
			path: `/datasets/${params.dataset}/cases/${params.case}/layers/${file}`,
		});
	}

	if (layers.length === 0) {
		throw error(404, `No valid layers found for case: ${params.case}`);
	}

	return json(layers);
};
