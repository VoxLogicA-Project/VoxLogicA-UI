import path from 'path';
import { platform } from 'os';
import { tmpdir } from 'os';

const STATIC_PATH = path.join(process.cwd(), 'static');

export const DATASET_PATH = process.env.DATASET_PATH || path.join(STATIC_PATH, 'datasets');
export const SCRIPTS_PATH = process.env.SCRIPTS_PATH || path.join(STATIC_PATH, 'scripts');

export const VOXLOGICA_BINARY_PATH = (() => {
	const binPath = path.join(STATIC_PATH, 'bin', 'VoxLogicA');
	switch (platform()) {
		case 'win32':
			return path.join(binPath, 'VoxLogicA.exe');
		default:
			return path.join(binPath, 'VoxLogicA');
	}
})();

export const RUN_OUTPUT_PATH = (runId: string) =>
	path.join(process.env.RUN_OUTPUT_PATH || tmpdir(), `voxlogica_run_${runId}`);
