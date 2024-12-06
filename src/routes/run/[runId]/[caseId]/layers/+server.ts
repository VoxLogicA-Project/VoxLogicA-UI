import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { RUN_OUTPUT_PATH } from '../../../../config';
import type { Layer } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	const { runId, caseId } = params;
	const casePath = path.join(RUN_OUTPUT_PATH(runId), caseId);

	// Read the case directory
	let files: string[];
	try {
		files = await fs.readdir(casePath);
	} catch (e) {
		throw error(404, `Case directory not found: ${caseId}`);
	}

	// Parse the layers
	const layers: Layer[] = [];
	for (const file of files.filter((file) => file.endsWith('.nii.gz'))) {
		let displayName = file.match(/(.+)\.nii\.gz$/);

		if (!displayName) {
			console.error(`Skipping invalid filename format: ${file}`);
			continue;
		}

		layers.push({
			name: displayName[1],
			path: `/run/${runId}/${caseId}/layers/${file}`,
		});
	}

	if (layers.length === 0) {
		throw error(404, `No valid layers found for case: ${caseId}`);
	}

	return json(layers);
};
