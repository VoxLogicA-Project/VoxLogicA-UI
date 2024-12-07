import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_JSON_PATH, WORKSPACES_PATH, WORKSPACE_PATH } from '../config';
import type { Workspace } from '$lib/models/types';

export const GET: RequestHandler = async () => {
	try {
		// Get all directories in the workspaces path
		const directories = await fs.readdir(WORKSPACES_PATH);

		// Filter for directories only and get their IDs
		const workspaceIds = [];
		for (const dir of directories) {
			const stats = await fs.stat(path.join(WORKSPACES_PATH, dir));
			if (stats.isDirectory()) {
				// Check if workspace.json exists in the directory
				try {
					await fs.access(WORKSPACE_JSON_PATH(dir));
					workspaceIds.push(dir);
				} catch {
					// Skip directories without workspace.json
					continue;
				}
			}
		}

		return json(workspaceIds);
	} catch (err) {
		throw error(500, 'Failed to fetch workspaces');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const workspace = (await request.json()) as Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>;

		// Generate a new workspace ID (you might want to use a more sophisticated method)
		const newId = `workspace_${Date.now()}`;

		const newWorkspace: Workspace = {
			...workspace,
			id: newId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await fs.mkdir(WORKSPACE_PATH(newId), { recursive: true });
		await fs.writeFile(WORKSPACE_JSON_PATH(newId), JSON.stringify(newWorkspace, null, 2));

		return json(newWorkspace);
	} catch (err) {
		throw error(500, 'Failed to create workspace');
	}
};
