import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '$lib/config/config';
import type { Case } from '$lib/models/dataset';

export const GET: RequestHandler = async ({ params }: { params: { dataset: string } }) => {
	try {
		const datasetPath = path.join(DATASET_PATH, params.dataset);
		const entries = await fs.readdir(datasetPath, { withFileTypes: true });

		const cases: Case[] = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => ({
				id: entry.name,
				path: path.join(params.dataset, entry.name),
			}));

		return json(cases);
	} catch (error) {
		return new Response('Failed to load cases', { status: 500 });
	}
};
