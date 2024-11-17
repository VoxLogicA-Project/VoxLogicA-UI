import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '$lib/config/config';
import type { Layer } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const casePath = path.join(DATASET_PATH, params.dataset, params.case);
		const files = await fs.readdir(casePath);

		const layers: Layer[] = files
			.filter((file) => file.endsWith('.nii.gz'))
			.map((file) => {
				let layer_id = file.match(new RegExp(`${params.case}_(.+)\\.nii\\.gz$`));
				let filename = file.match(/(.+)\.nii\.gz$/);
				// Fallback to filename without extension if case_layerId pattern is not found
				if (!layer_id) {
					layer_id = filename;
				}
				if (!layer_id || !filename) {
					throw new Error(`Invalid filename format: ${file}`);
				}
				return {
					id: layer_id[1],
					// TODO: fix this. We should not load from static path.
					path: `/datasets/${params.dataset}/${params.case}/${filename[1]}.nii.gz`,
					// path: `/datasets/${params.dataset}/cases/${params.case}/layers/${filename[1]}`,
				};
			});

		return json(layers);
	} catch (error) {
		return new Response('Failed to load layers', { status: 500 });
	}
};
