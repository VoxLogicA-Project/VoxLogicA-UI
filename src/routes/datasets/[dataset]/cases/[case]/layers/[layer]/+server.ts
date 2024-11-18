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
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return new Response('Layer file not found', { status: 404 });
		}
		return new Response('Failed to load layer file', { status: 500 });
	}
};
