import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { DATASET_PATH, RUN_OUTPUT_PATH, VOXLOGICA_BINARY_PATH } from '../config';
import { randomUUID } from 'crypto';
import type { Case, Layer, Run } from '$lib/models/types';

interface VoxLogicaResult {
	print: any[];
	layers: any[];
	log: string;
	error: string;
}

async function processLayerPaths(
	scriptContent: string,
	layers: Layer[],
	datasetId: string,
	caseName: string
): Promise<string> {
	let processedScript = scriptContent;

	for (const layer of layers) {
		const layerFilename = layer.path.split('/').pop();
		if (!layerFilename) {
			error(400, `Invalid layer path for layer ${layer.name}`);
		}

		processedScript = processedScript.replace(
			new RegExp(`\\$\\{LAYER_PATH:${layer.name}\\}`, 'g'),
			path.join(DATASET_PATH, datasetId, caseName, layerFilename)
		);
	}

	return processedScript;
}

async function processOutputPaths(scriptContent: string, outputDir: string): Promise<string> {
	return scriptContent.replace(/save\s+"([^"]+)"/g, (match, filepath) => {
		if (filepath.match(/\$\{?OUTPUT_?DIR\}?/)) {
			return match.replace(/[\\,/]/g, path.sep).replace(/\$\{?OUTPUT_?DIR\}?/g, outputDir);
		}
		return `save "${path.join(outputDir, filepath)}"`;
	});
}

async function prepareScript(
	scriptContent: string,
	case_: Case,
	outputDir: string,
	fetch: Function
): Promise<string> {
	const datasetId = case_.path.split('/')[2];
	const response = await fetch(case_.path);
	const layers: Layer[] = await response.json();

	const withLayerPaths = await processLayerPaths(scriptContent, layers, datasetId, case_.name);
	return processOutputPaths(withLayerPaths, outputDir);
}

async function executeVoxLogica(binaryPath: string, scriptPath: string): Promise<VoxLogicaResult> {
	const process = spawn(binaryPath, [scriptPath, '--json']);
	let stdout = '';
	let stderr = '';

	const processPromise = new Promise<VoxLogicaResult>((resolve, reject) => {
		const timeout = setTimeout(
			() => {
				process.kill();
				reject(new Error('VoxLogicA process timed out after 5 minutes'));
			},
			5 * 60 * 1000
		);

		process.stdout.on('data', (data) => (stdout += data.toString()));
		process.stderr.on('data', (data) => (stderr += data.toString()));

		process.on('close', (code) => {
			clearTimeout(timeout);
			try {
				const parsedOutput: VoxLogicaResult = JSON.parse(stdout);
				if (code === 0 && !parsedOutput.error) {
					resolve({
						print: parsedOutput.print,
						layers: parsedOutput.layers,
						log: parsedOutput.log,
						error: parsedOutput.error,
					});
				} else {
					reject({
						code,
						message: 'VoxLogicA execution failed',
						voxlogicaResult: parsedOutput,
					});
				}
			} catch (e) {
				reject(new Error(`Failed to parse output: ${e}. stdout: ${stdout}, stderr: ${stderr}`));
			}
		});

		process.on('error', (err) => {
			clearTimeout(timeout);
			reject(new Error(`Failed to start VoxLogicA: ${err.message}`));
		});
	});

	return processPromise;
}

async function processCase(
	case_: Case,
	runId: string,
	workspaceId: string,
	scriptContent: string,
	fetch: Function
): Promise<Run> {
	// We could use case.path as a unique identifier for the case, but we can save some space this way
	const caseDataset = case_.path.split('/')[2];
	const caseId = caseDataset + '_' + case_.name;

	const runOutputPath = RUN_OUTPUT_PATH(workspaceId, caseId, runId);
	await fs.mkdir(runOutputPath, { recursive: true });

	const scriptPath = path.join(runOutputPath, 'script.imgql');
	const substitutedScript = await prepareScript(scriptContent, case_, runOutputPath, fetch);
	await fs.writeFile(scriptPath, substitutedScript);

	try {
		const voxlogicaResult = await executeVoxLogica(VOXLOGICA_BINARY_PATH, scriptPath);
		const run: Run = {
			id: runId,
			timestamp: new Date(),
			casePath: case_.path,
			scriptContent,
			outputLayers: voxlogicaResult.layers.map((layer) => ({
				name: layer.name,
				path: `/workspaces/${workspaceId}/${caseId}/${runId}/layers/${layer.name}.nii.gz`,
			})),
			outputPrint: voxlogicaResult.print,
			outputLog: voxlogicaResult.log,
			outputError: voxlogicaResult.error,
		};

		await fs.writeFile(path.join(runOutputPath, 'run.json'), JSON.stringify(run, null, 2));
		return run;
	} catch (err: any) {
		if ('voxlogicaResult' in err) {
			const errorRun: Run = {
				id: runId,
				timestamp: new Date(),
				casePath: case_.path,
				scriptContent,
				outputPrint: err.voxlogicaResult.print,
				outputLog: err.voxlogicaResult.log,
				outputError: err.voxlogicaResult.error,
				outputLayers: err.voxlogicaResult.layers,
			};

			await fs.writeFile(path.join(runOutputPath, 'run.json'), JSON.stringify(errorRun, null, 2));
			return errorRun;
		}

		error(500, {
			message: err instanceof Error ? err.message : 'An unexpected error occurred',
		});
	}
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { workspaceId, scriptContent, cases } = await request.json();

	if (!Array.isArray(cases)) {
		error(400, '"cases" must be an array');
	}

	if (!workspaceId || !scriptContent) {
		error(400, 'Missing required fields: workspaceId or scriptContent');
	}

	try {
		await fs.access(VOXLOGICA_BINARY_PATH);
	} catch (err) {
		error(400, 'VoxLogicA binary not found. Please check your installation.');
	}

	const runId = randomUUID();
	const results = await Promise.all(
		cases.map((case_) => processCase(case_, runId, workspaceId, scriptContent, fetch))
	);

	return json(results);
};
