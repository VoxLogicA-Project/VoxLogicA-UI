import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_JSON_PATH, WORKSPACES_PATH, WORKSPACE_PATH } from '../config';
import type { Workspace } from '$lib/models/types';
import crypto from 'crypto';

export const GET: RequestHandler = async () => {
	try {
		// Get all directories in the workspaces path
		const directories = await fs.readdir(WORKSPACES_PATH);

		// Filter for directories only and get their IDs and names
		const workspaces = [];
		for (const dir of directories) {
			const stats = await fs.stat(path.join(WORKSPACES_PATH, dir));
			if (stats.isDirectory()) {
				// Check if workspace.json exists in the directory
				try {
					const workspaceJson = await fs.readFile(WORKSPACE_JSON_PATH(dir), 'utf-8');
					const workspace = JSON.parse(workspaceJson);
					workspaces.push({
						id: dir,
						name: workspace.name,
					});
				} catch {
					// Skip directories without workspace.json
					continue;
				}
			}
		}

		return json(workspaces);
	} catch (err) {
		// If no workspaces are found, return an empty array and create the workspaces directory
		if (err instanceof Error && err.message.includes('ENOENT')) {
			await fs.mkdir(WORKSPACES_PATH, { recursive: true });
			return json([]);
		}

		throw error(500, 'Failed to fetch workspaces');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const workspace = (await request.json()) as Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>;

		// Generate a new workspace ID using timestamp and UUID for uniqueness
		const newId = `${Date.now()}_${crypto.randomUUID()}`;

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
		console.error(err);
		throw error(500, 'Failed to create workspace');
	}
};
