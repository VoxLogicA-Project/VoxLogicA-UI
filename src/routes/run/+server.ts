import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { DATASET_PATH, RUN_OUTPUT_PATH, VOXLOGICA_BINARY_PATH } from '../config';
import { randomUUID } from 'crypto';
import type { Case, Run } from '$lib/models/types';
import type { Layer } from '$lib/models/types';

// Types for API responses and internal data structures
interface VoxLogicaResult {
	print: any[];
	layers: any[];
}

// Script variable substitution and path processing
const substituteUiPathVariables = async (
	scriptContent: string,
	case_: Case,
	outputDir: string,
	fetch: Function
): Promise<string> => {
	const datasetId = case_.path.split(path.sep)[0];

	try {
		const response = await fetch(`/datasets/${datasetId}/cases/${case_.id}/layers`);
		const layers = await response.json();

		// Process layer paths
		let processedScript = scriptContent;
		for (const layer of layers) {
			const layerFilename = layer.path.split('/').pop();
			if (!layerFilename) {
				throw error(400, `Invalid layer path for layer ${layer.id}`);
			}

			processedScript = processedScript.replace(
				new RegExp(`\\$\\{LAYER_PATH:${layer.id}\\}`, 'g'),
				path.join(DATASET_PATH, datasetId, case_.id, layerFilename)
			);
		}

		// Process output paths with improved regex
		return processedScript.replace(/save\s+"([^"]+)"/g, (match, filepath) => {
			if (filepath.match(/\$\{?OUTPUT_?DIR\}?/)) {
				return match.replace(/[\\,/]/g, path.sep).replace(/\$\{?OUTPUT_?DIR\}?/g, outputDir);
			}
			return `save "${path.join(outputDir, filepath)}"`;
		});
	} catch (err) {
		throw error(
			400,
			`Failed to process script: ${err instanceof Error ? err.message : String(err)}`
		);
	}
};

// VoxLogicA process execution and output parsing
const runVoxLogica = async (binaryPath: string, scriptPath: string): Promise<VoxLogicaResult> => {
	return new Promise((resolve, reject) => {
		const process = spawn(binaryPath, [scriptPath, '--json']);
		let stdout = '';
		let stderr = '';

		const timeout = setTimeout(
			() => {
				process.kill();
				reject(new Error('VoxLogicA process timed out after 5 minutes'));
			},
			5 * 60 * 1000
		);

		process.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		process.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		process.on('close', (code) => {
			clearTimeout(timeout);
			if (code === 0) {
				try {
					const parsedOutput = JSON.parse(stdout);
					resolve({
						print: parsedOutput.print || [],
						layers: parsedOutput.layers || {},
					});
				} catch (e) {
					reject(new Error(`Failed to parse JSON output: ${e}. Output was: ${stdout}`));
				}
			} else {
				reject(new Error(`Process failed with code ${code}. stderr: ${stderr}`));
			}
		});

		process.on('error', (err) => {
			clearTimeout(timeout);
			reject(new Error(`Failed to start process: ${err.message}. stderr: ${stderr}`));
		});
	});
};

// Temporary file cleanup
async function cleanup(tempDir: string): Promise<void> {
	try {
		await fs.rm(tempDir, { recursive: true, force: true });
	} catch (err) {
		console.error(`Failed to cleanup temporary directory ${tempDir}:`, err);
	}
}

// Main API endpoint handler
export const POST: RequestHandler = async ({ request, fetch }) => {
	const runId = randomUUID();
	const tempDir = RUN_OUTPUT_PATH(runId);

	try {
		const body = await request.text();
		const { scriptContent, case_ } = JSON.parse(body);

		if (!scriptContent || !case_) {
			throw error(400, 'Missing required fields: scriptContent or case_');
		}

		// Create the temporary directory and write the script
		await fs.mkdir(tempDir, { recursive: true });
		const scriptPath = path.join(tempDir, 'script.imgql');
		const substitutedScriptContent = await substituteUiPathVariables(
			scriptContent,
			case_,
			tempDir,
			fetch
		);
		await fs.writeFile(scriptPath, substitutedScriptContent);

		// Verify VoxLogicA binary exists and run the process
		await fs.access(VOXLOGICA_BINARY_PATH);
		const result = await runVoxLogica(VOXLOGICA_BINARY_PATH, scriptPath);

		// TODO: Return the layer files since we are deleting the temp dir
		await cleanup(tempDir);

		return json({
			id: runId,
			...result,
		});
	} catch (err) {
		await cleanup(tempDir);

		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			throw error(400, 'VoxLogicA binary not found. Please check your installation.');
		}

		throw error(
			err instanceof Error && 'status' in err ? (err.status as number) : 500,
			err instanceof Error ? err.message : 'Unknown error occurred'
		);
	}
};
