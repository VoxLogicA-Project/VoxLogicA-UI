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

const substituteoutputDir = (str: string, outputDir: string) => {
	// The idea was to remove any temp dir path information from the log/error
	// but we would loose the formating this way
	// Leaving this here for now, but it's not used
	const strNoNewLines = str.replace(/^\s+/gm, '').replace(/[\r\n]/g, '');
	const outputDirEscaped = outputDir.replace(/\\/g, '\\\\');
	return strNoNewLines.replace(new RegExp(outputDirEscaped, 'gm'), '');
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
	const outputDir = RUN_OUTPUT_PATH(runId);

	let scriptContent: string;
	let case_: Case;

	try {
		const body = await request.json();
		scriptContent = body.scriptContent;
		case_ = body.case_;
	} catch (err) {
		throw error(400, 'Missing required fields: scriptContent or case_');
	}

	try {
		// Create the temporary directory and write the script
		await fs.mkdir(outputDir, { recursive: true });
		const scriptPath = path.join(outputDir, 'script.imgql');
		const substitutedScriptContent = await substituteUiPathVariables(
			scriptContent,
			case_,
			outputDir,
			fetch
		);
		await fs.writeFile(scriptPath, substitutedScriptContent);

		// Verify VoxLogicA binary exists and run the process
		await fs.access(VOXLOGICA_BINARY_PATH);
		const voxlogicaResult = await runVoxLogica(VOXLOGICA_BINARY_PATH, scriptPath);

		// Convert VoxLogicA layers to Layer objects
		const layers = voxlogicaResult.layers.map((layer) => ({
			id: layer.name,
			path: `/run/${runId}/layers/${layer.name}.nii.gz`,
		}));

		// Create a Run object using the Run type
		const run: Run = {
			id: runId,
			timestamp: new Date(),
			scriptContent: scriptContent,
			case: case_,
			outputPrint: voxlogicaResult.print,
			outputLayers: layers,
			outputLog: voxlogicaResult.log,
			outputError: voxlogicaResult.error,
		};

		// Dump the run into a file
		await fs.writeFile(path.join(outputDir, 'run.json'), JSON.stringify(run, null, 2));

		// Don't cleanup temp directory as we need it for layer access
		return json(run);
	} catch (err) {
		await cleanup(outputDir);

		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			throw error(400, 'VoxLogicA binary not found. Please check your installation.');
		}

		console.error(err);
		if (
			err &&
			typeof err === 'object' &&
			'voxlogicaResult' in err &&
			err.voxlogicaResult &&
			typeof err.voxlogicaResult === 'object' &&
			'print' in err.voxlogicaResult &&
			'layers' in err.voxlogicaResult &&
			'log' in err.voxlogicaResult &&
			'error' in err.voxlogicaResult
		) {
			const run: Run = {
				id: runId,
				timestamp: new Date(),
				scriptContent: scriptContent || '',
				case: case_ || null,
				outputPrint: err.voxlogicaResult.print as PrintOutput[],
				outputLayers: err.voxlogicaResult.layers as Layer[],
				outputLog: err.voxlogicaResult.log as string,
				outputError: err.voxlogicaResult.error as string,
			};
			return json(run);
		}

		throw error(500, err instanceof Error ? err.message : String(err));
	}
};
