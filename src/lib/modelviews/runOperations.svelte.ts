import type { Case } from '$lib/models/types';

function createRunOperations() {
	return {
		async runVoxLogicA(scriptContent: string, case_: Case) {
			const payload = {
				scriptContent: scriptContent,
				case_: case_,
			};

			const response = await fetch('/run', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Failed to run VoxLogicA: ${errorData.error || response.statusText}`);
			}

			return await response.json();
		},
	};
}

export const runOperations = createRunOperations();
