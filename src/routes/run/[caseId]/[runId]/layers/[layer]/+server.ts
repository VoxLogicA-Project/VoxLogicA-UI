import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { RUN_OUTPUT_PATH } from '../../../../../config';

export const GET: RequestHandler = async ({ params }) => {
	const { caseId, runId, layer } = params;
	const layerPath = path.join(RUN_OUTPUT_PATH(caseId, runId), layer);

	try {
		const fileContent = Uint8Array.from(await fs.readFile(layerPath));
		return new Response(fileContent, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename=${layer}`,
				'Cache-Control': 'no-cache',
			},
		});
	} catch (err) {
		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			throw error(404, 'Layer file not found');
		}
		throw error(500, 'Failed to load layer file');
	}
};
