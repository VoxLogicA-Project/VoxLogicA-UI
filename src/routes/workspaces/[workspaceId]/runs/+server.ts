import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_PATH } from '../../../config';
import type { Run } from '$lib/models/types';

export const GET: RequestHandler = async ({ params }) => {
	const { workspaceId } = params;
	const workspacePath = WORKSPACE_PATH(workspaceId);

	try {
		// Get all case directories in the workspace
		const caseDirs = await fs.readdir(workspacePath);
		const runs: Run[] = [];

		// For each case directory, get all run directories
		for (const caseDir of caseDirs) {
			const casePath = path.join(workspacePath, caseDir);
			const caseStats = await fs.stat(casePath);

			if (!caseStats.isDirectory() || caseDir === 'workspace.json') continue;

			// Get all run directories for this case
			const runDirs = await fs.readdir(casePath);

			for (const runDir of runDirs) {
				const runPath = path.join(casePath, runDir);
				const runStats = await fs.stat(runPath);

				if (!runStats.isDirectory()) continue;

				// Read the run.json file
				try {
					const runJson = await fs.readFile(path.join(runPath, 'run.json'), 'utf-8');
					const run = JSON.parse(runJson) as Run;
					runs.push({
						...run,
						timestamp: new Date(run.timestamp), // Convert timestamp back to Date
					});
				} catch (err) {
					console.warn(`Failed to read run.json for case ${caseDir}, run ${runDir}:`, err);
					continue;
				}
			}
		}

		return json(runs);
	} catch (err) {
		console.error('Failed to fetch runs:', err);
		throw error(500, 'Failed to fetch runs');
	}
};
