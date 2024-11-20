import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { RUN_OUTPUT_PATH } from '../../../../config';

export const GET: RequestHandler = async ({ params }) => {
	const { runId, layer } = params;
	const layerPath = path.join(RUN_OUTPUT_PATH(runId), layer);
	console.log(layerPath);

	try {
		const fileContent = Uint8Array.from(await fs.readFile(layerPath));
		return new Response(fileContent, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename=${layer}`,
				'Cache-Control': 'no-cache', // Don't cache run outputs as they're temporary
			},
		});
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return new Response('Layer file not found', { status: 404 });
		}
		return new Response('Failed to load layer file', { status: 500 });
	}
};
