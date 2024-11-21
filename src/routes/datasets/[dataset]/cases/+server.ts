import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../../config';
import type { Case } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }: { params: { dataset: string } }) => {
	try {
		// Check if dataset exists
		const datasetPath = path.join(DATASET_PATH, params.dataset);

		// Get directory entries
		let entries;
		try {
			entries = await fs.readdir(datasetPath, { withFileTypes: true });
		} catch (err) {
			console.error(`Error reading dataset directory: ${err}`);
			throw error(500, 'Failed to read dataset directory. Check server console for details.');
		}

		// Map directories to cases
		const cases: Case[] = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => ({
				id: entry.name,
				path: path.join(params.dataset, entry.name),
			}));

		if (cases.length === 0) {
			throw error(404, 'No cases found in dataset');
		}

		return json(cases);
	} catch (err) {
		if (isHttpError(err)) {
			throw err;
		}
		console.error('Unexpected error loading cases:', err);
		throw error(500, 'Internal server error. Check server console for details.');
	}
};
