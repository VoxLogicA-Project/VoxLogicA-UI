import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Layer } from '$lib/models/dataset';
import fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const casePath = path.join(process.cwd(), 'static/datasets', params.dataset, params.case);
		const files = await fs.readdir(casePath);

		// Convert files to Layer objects
		const layers: Layer[] = files
			.filter((file) => file.endsWith('.nii.gz'))
			.map((file) => {
				const match = file.match(/.*_(.+)\.nii\.gz$/);
				return {
					id: match ? match[1] : file,
					path: path.join(params.dataset, params.case, file),
				};
			});

		return json(layers);
	} catch (error) {
		return new Response('Failed to load layers', { status: 500 });
	}
};
