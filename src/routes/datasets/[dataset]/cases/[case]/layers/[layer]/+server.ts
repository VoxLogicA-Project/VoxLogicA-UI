import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '$lib/config/config';

export const GET: RequestHandler = async ({ params }) => {
	// TODO: fix this. This is currently not serving a file that can be loaded by Niivue.
	try {
		const filePath = path.join(DATASET_PATH, params.dataset, params.case, params.layer + '.nii.gz');
		const fileContent = Uint8Array.from(await fs.readFile(filePath));

		return new Response(fileContent, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename=${params.layer}.nii.gz`,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		return new Response('Failed to load layer file', { status: 500 });
	}
};
