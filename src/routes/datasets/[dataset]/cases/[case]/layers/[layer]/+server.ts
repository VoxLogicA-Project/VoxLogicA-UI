import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { DATASET_PATH } from '../../../../../../config';

export const GET: RequestHandler = async ({ params }) => {
	const filePath = path.join(DATASET_PATH, params.dataset, params.case, params.layer);

	try {
		const fileContent = Uint8Array.from(await fs.readFile(filePath));
		return new Response(fileContent, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename=${params.layer}`,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (err) {
		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			throw error(404, `Layer file '${params.layer}' not found.`);
		}
		console.error('Error loading layer file:', err);
		throw error(500, 'Failed to load layer file. Check server console for details.');
	}
};
