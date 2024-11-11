import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async () => {
	try {
		const datasetsPath = path.join(process.cwd(), 'static/datasets');
		const entries = await fs.readdir(datasetsPath, { withFileTypes: true });

		const datasets = await Promise.all(
			entries
				.filter((entry) => entry.isDirectory())
				.map(async (entry) => {
					const datasetPath = path.join(datasetsPath, entry.name);
					const configPath = path.join(datasetPath, 'dataset.json');
					const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

					return {
						...config,
						path: entry.name,
					};
				})
		);

		return json(datasets);
	} catch (error) {
		return new Response('Failed to load datasets', { status: 500 });
	}
};
