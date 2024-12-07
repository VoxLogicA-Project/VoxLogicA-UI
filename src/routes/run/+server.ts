import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { DATASET_PATH, RUN_OUTPUT_PATH, VOXLOGICA_BINARY_PATH } from '../config';
import { randomUUID } from 'crypto';
import type { Case, Layer, PrintOutput, Run } from '$lib/models/types';

// Types for API responses and internal data structures
interface VoxLogicaResult {
	print: any[];
	layers: any[];
	log: string;
	error: string;
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
		const response = await fetch(`/datasets/${datasetId}/cases/${case_.name}/layers`);
		const layers: Layer[] = await response.json();

		// Process layer paths
		let processedScript = scriptContent;
		for (const layer of layers) {
			const layerFilename = layer.path.split('/').pop();
			if (!layerFilename) {
				throw error(400, `Invalid layer path for layer ${layer.name}`);
			}

			processedScript = processedScript.replace(
				new RegExp(`\\$\\{LAYER_PATH:${layer.name}\\}`, 'g'),
				path.join(DATASET_PATH, datasetId, case_.name, layerFilename)
			);
		}

		// Process output paths
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
			5 * 60 * 1000 // 5 minutes
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
					// If VoxLogicA returns success but contains error message, treat as error
					// (should never happen)
					if (parsedOutput.error) {
						reject({
							code,
							message: parsedOutput.error,
							voxlogicaResult: parsedOutput,
						});
						return;
					}
					resolve({
						print: parsedOutput.print || [],
						layers: parsedOutput.layers || [],
						log: parsedOutput.log || '',
						error: '',
					});
				} catch (e) {
					reject(new Error(`Failed to parse JSON output: ${e}. Output was: ${stdout}, ${stderr}`));
				}
			} else {
				try {
					const parsedOutput = JSON.parse(stdout);
					reject({
						code,
						message: 'VoxLogicA failed during execution.',
						voxlogicaResult: parsedOutput,
					});
				} catch (e) {
					reject(new Error(`Failed to parse JSON output: ${e}. Output was: ${stdout}, ${stderr}`));
				}
			}
		});

		process.on('error', (err) => {
			clearTimeout(timeout);
			reject(new Error(`Failed to start VoxLogicA: ${err.message}`));
		});
	});
};

// Temporary file cleanup
async function cleanup(outputDir: string): Promise<void> {
	try {
		await fs.rm(outputDir, { recursive: true, force: true });
	} catch (err) {
		console.error(`Failed to cleanup output directory ${outputDir}:`, err);
	}
}

// Main API endpoint handler
export const POST: RequestHandler = async ({ request, fetch }) => {
	const runId = randomUUID();

	let workspaceId: string;
	let scriptContent: string;
	let cases: Case[];

	try {
		const body = await request.json();
		workspaceId = body.workspaceId;
		scriptContent = body.scriptContent;
		cases = body.cases;

		if (!Array.isArray(cases)) {
			throw error(400, '"cases" must be an array');
		}
	} catch (err) {
		throw error(400, 'Missing required fields: workspaceId, scriptContent or cases');
	}

	const results: Run[] = [];

	for (const case_ of cases) {
		const caseOutputDir = RUN_OUTPUT_PATH(workspaceId, case_.id, runId);

		try {
			// Create case-specific directory
			await fs.mkdir(caseOutputDir, { recursive: true });
			const scriptPath = path.join(caseOutputDir, 'script.imgql');

			const substitutedScriptContent = await substituteUiPathVariables(
				scriptContent,
				case_,
				caseOutputDir,
				fetch
			);
			await fs.writeFile(scriptPath, substitutedScriptContent);

			// Verify VoxLogicA binary exists and run the process
			await fs.access(VOXLOGICA_BINARY_PATH);
			const voxlogicaResult = await runVoxLogica(VOXLOGICA_BINARY_PATH, scriptPath);

			const run: Run = {
				id: runId,
				timestamp: new Date(),
				scriptContent: scriptContent,
				outputPrint: voxlogicaResult.print,
				outputLog: voxlogicaResult.log,
				outputError: voxlogicaResult.error,
			};

			// Dump the run into a file
			await fs.writeFile(path.join(caseOutputDir, 'run.json'), JSON.stringify(run, null, 2));

			// Don't cleanup temp directory as we need it for layer access
			results.push(run);
		} catch (err) {
			await cleanup(caseOutputDir);
			if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
				throw error(400, 'VoxLogicA binary not found. Please check your installation.');
			}

			// Handle errors for individual cases but continue processing others
			if (
				err &&
				typeof err === 'object' &&
				'voxlogicaResult' in err &&
				err.voxlogicaResult &&
				typeof err.voxlogicaResult === 'object' &&
				'print' in err.voxlogicaResult &&
				'log' in err.voxlogicaResult &&
				'error' in err.voxlogicaResult
			) {
				console.error(`Error processing case ${case_.name}:`, err);
				results.push({
					id: runId,
					timestamp: new Date(),
					scriptContent: scriptContent,
					outputPrint: err.voxlogicaResult.print as PrintOutput[],
					outputLog: err.voxlogicaResult.log as string,
					outputError: err.voxlogicaResult.error as string,
				});
			}
		}
	}

	return json(results);
};
