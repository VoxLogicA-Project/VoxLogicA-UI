import { exec } from 'child_process';
import { promisify } from 'util';
import { VOXLOGICA_BINARY_PATH } from '../../routes/config';
import { access } from 'fs/promises';

const execAsync = promisify(exec);

function createRunOperations() {
	return {
		async runVoxLogicA(scriptPath: string, inputDir: string, outputDir: string) {
			try {
				// Check if VoxLogicA binary exists
				await access(VOXLOGICA_BINARY_PATH);

				// Run VoxLogicA
				const { stdout, stderr } = await execAsync(
					`${VOXLOGICA_BINARY_PATH} "${scriptPath}" --input-dir="${inputDir}" --output-dir="${outputDir}"`
				);

				if (stderr) {
					throw new Error(stderr);
				}

				return stdout;
			} catch (error) {
				if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
					throw new Error(`VoxLogicA binary not found at path: ${VOXLOGICA_BINARY_PATH}`);
				}
				throw new Error(`Failed to execute VoxLogicA: ${error}`);
			}
		},
	};
}

export const runOperations = createRunOperations();
