import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import { RUN_OUTPUT_PATH } from '../../../../../config';
import type { Layer } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	const { workspaceId, caseId, runId } = params;
	const runPath = RUN_OUTPUT_PATH(workspaceId, caseId, runId);

	// Read the case directory
	let files: string[];
	try {
		files = await fs.readdir(runPath);
	} catch (e) {
		throw error(404, `Run directory not found: ${runId}`);
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
			path: `/run/${caseId}/${runId}/layers/${file}`,
		});
	}

	if (layers.length === 0) {
		throw error(404, `No valid layers found for case: ${caseId}`);
	}

	return json(layers);
};
