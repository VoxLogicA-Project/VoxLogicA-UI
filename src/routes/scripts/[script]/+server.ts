import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { SCRIPTS_PATH } from '../../config';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const filePath = path.join(SCRIPTS_PATH, `${params.script}.imgql`);
		const content = await fs.readFile(filePath, 'utf-8');

		return new Response(content, {
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return new Response('Script not found', { status: 404 });
		}
		return new Response('Failed to load script', { status: 500 });
	}
};
