import path from 'path';
import { platform } from 'os';

const STATIC_PATH = path.join(process.cwd(), 'static');

export const DATASET_PATH = process.env.DATASET_PATH || path.join(STATIC_PATH, 'datasets');
export const SCRIPTS_PATH = process.env.SCRIPTS_PATH || path.join(STATIC_PATH, 'scripts');

export const VOXLOGICA_BINARY_PATH = (() => {
	const binPath = path.join(STATIC_PATH, 'bin');
	switch (platform()) {
		case 'win32':
			return path.join(binPath, 'windows', 'voxlogica.exe');
		case 'darwin':
			return path.join(binPath, 'macos', 'voxlogica');
		case 'linux':
			return path.join(binPath, 'linux', 'voxlogica');
		default:
			throw new Error(`Unsupported platform: ${platform()}`);
	}
})();
