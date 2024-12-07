import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import { WORKSPACE_PATH } from '../../config';
import type { Workspace } from '$lib/models/types';
import path from 'path';

const getWorkspaceJsonPath = (workspaceId: string) =>
	path.join(WORKSPACE_PATH(workspaceId), 'workspace.json');

export const GET: RequestHandler = async ({ params }) => {
	const { workspaceId } = params;
	const workspaceJsonPath = getWorkspaceJsonPath(workspaceId);

	try {
		const fileContent = await fs.readFile(workspaceJsonPath, 'utf-8');
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
	const workspaceJsonPath = getWorkspaceJsonPath(workspaceId);

	try {
		const workspace = (await request.json()) as Workspace;

		// Update the timestamp
		workspace.updatedAt = new Date();

		await fs.writeFile(workspaceJsonPath, JSON.stringify(workspace, null, 2));

		return json({ success: true });
	} catch (err) {
		throw error(500, 'Failed to save workspace');
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

		await fs.writeFile(getWorkspaceJsonPath(newId), JSON.stringify(newWorkspace, null, 2));

		return json(newWorkspace);
	} catch (err) {
		throw error(500, 'Failed to create workspace');
	}
};
