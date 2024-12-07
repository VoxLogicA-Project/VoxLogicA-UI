import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import { WORKSPACE_JSON_PATH } from '../../config';
import type { Workspace } from '$lib/models/types';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	const { workspaceId } = params;

	try {
		const fileContent = await fs.readFile(WORKSPACE_JSON_PATH(workspaceId), 'utf-8');
		const workspace = JSON.parse(fileContent) as Workspace;

		// Convert date strings back to Date objects
		workspace.createdAt = new Date(workspace.createdAt);
		workspace.updatedAt = new Date(workspace.updatedAt);

		return json(workspace);
	} catch (err) {
		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			throw error(404, 'Workspace not found');
		}
		throw error(500, 'Failed to load workspace');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { workspaceId } = params;

	try {
		const workspace = (await request.json()) as Workspace;

		// Update the timestamp
		workspace.updatedAt = new Date();

		await fs.writeFile(WORKSPACE_JSON_PATH(workspaceId), JSON.stringify(workspace, null, 2));

		return json({ success: true });
	} catch (err) {
		console.error(err);
		throw error(500, 'Failed to save workspace');
	}
};
