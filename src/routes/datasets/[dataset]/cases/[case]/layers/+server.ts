import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../../../../config';
import type { Layer } from '$lib/models/types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	// Check if the dataset exists
	const datasetResponse = await fetch(`/datasets/${params.dataset}`);
	if (!datasetResponse.ok) {
		throw error(404, `Dataset ${params.dataset} not found`);
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
		let displayName = file.match(new RegExp(`${params.case}_(.+)\\.nii\\.gz$`));
		let filename = file.match(/(.+)\.nii\.gz$/);

		if (!displayName) {
			displayName = filename;
		}

		if (!displayName || !filename) {
			console.error(`Skipping invalid filename format: ${file}`);
			continue;
		}

		// Remove invalid characters from the display name
		// TODO: Can we do better?
		const displayNameNoInvalidChars = displayName[1].replace(/[^a-zA-Z0-9]/g, '');

		layers.push({
			name: displayNameNoInvalidChars,
			path: `/datasets/${params.dataset}/cases/${params.case}/layers/${file}`,
		});
	}

	if (layers.length === 0) {
		throw error(404, `No valid layers found for case: ${params.case}`);
	}

	return json(layers);
};
