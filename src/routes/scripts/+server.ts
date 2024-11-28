import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import { SCRIPTS_PATH } from '../config';
import type { PresetScript } from '$lib/models/types';

export const GET: RequestHandler = async () => {
	try {
		const files = await fs.readdir(SCRIPTS_PATH);
		const scripts: PresetScript[] = files
			.filter((file) => file.endsWith('.imgql'))
			.map((file) => ({
				id: file,
				path: `/scripts/${file}`,
			}));

		return json(scripts);
	} catch (error) {
		return new Response('Failed to load scripts', { status: 500 });
	}
};
