import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import { WORKSPACE_JSON_PATH, WORKSPACE_PATH } from '../config';
import type { Workspace } from '$lib/models/types';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { sourceId, workspace } = (await request.json()) as {
			sourceId?: Workspace['id'];
			workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>;
		};

		const newId = `${Date.now()}_${crypto.randomUUID()}`;

		if (sourceId) {
			try {
				const sourceWorkspaceJson = await fs.readFile(WORKSPACE_JSON_PATH(sourceId), 'utf-8');
				const sourceWorkspace = JSON.parse(sourceWorkspaceJson);

				const newWorkspace: Workspace = {
					...sourceWorkspace,
					id: newId,
					name: workspace.name,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				await fs.cp(WORKSPACE_PATH(sourceId), WORKSPACE_PATH(newId), { recursive: true });
				await fs.writeFile(WORKSPACE_JSON_PATH(newId), JSON.stringify(newWorkspace, null, 2));

				return json(newWorkspace);
			} catch (err) {
				console.error('Failed to clone workspace:', err);
				error(404, {
					message: 'Source workspace not found',
				});
			}
		} else {
			try {
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
				console.error('Failed to create workspace:', err);
				error(500, {
					message: 'Failed to create workspace',
				});
			}
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		error(500, {
			message: 'Internal server error',
		});
	}
};
