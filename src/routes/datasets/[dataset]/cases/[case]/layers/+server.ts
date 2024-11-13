import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const casePath = path.join(process.cwd(), 'static/datasets', params.dataset, params.case);
		const files = await fs.readdir(casePath);

		// Extract layer names from .nii.gz files, removing patient ID prefix
		const layers = files
			.filter((file) => file.endsWith('.nii.gz'))
			.map((file) => {
				const match = file.match(/.*_(.+)\.nii\.gz$/);
				return match ? match[1] : file;
			});

		return json(layers);
	} catch (error) {
		return new Response('Failed to load layers', { status: 500 });
	}
};
