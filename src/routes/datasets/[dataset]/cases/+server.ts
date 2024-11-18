import { json } from '@sveltejs/kit';
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
			return new Response('Failed to read dataset directory', { status: 500 });
		}

		// Map directories to cases
		const cases: Case[] = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => ({
				id: entry.name,
				path: path.join(params.dataset, entry.name),
			}));

		if (cases.length === 0) {
			return new Response('No cases found in dataset', { status: 404 });
		}

		return json(cases);
	} catch (error) {
		console.error('Unexpected error loading cases:', error);
		return new Response('Internal server error', { status: 500 });
	}
};
