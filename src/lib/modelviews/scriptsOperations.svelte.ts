import type { Script } from '$lib/models/types';
import { apiRepository } from '$lib/models/repository';
import { mainState } from './mainState.svelte';

function createScriptOperations() {
	return {
		async loadScripts() {
			mainState.scripts.loading = true;
			mainState.scripts.error = null;

			try {
				const scripts = await apiRepository.getScripts();
				mainState.scripts.availablePresets = scripts;
				mainState.scripts.loading = false;
			} catch (error) {
				mainState.scripts.loading = false;
				mainState.scripts.error = error instanceof Error ? error.message : 'Failed to load scripts';
			}
		},

		selectScript(script: Script) {
			mainState.scripts.selectedPreset = script;
			mainState.scripts.error = null;
		},

		clearScript() {
			mainState.scripts.selectedPreset = null;
			mainState.scripts.error = null;
		},

		saveScriptContent(content: string) {
			mainState.scripts.editorContent = content;
		},
	};
}

export const scriptOperations = createScriptOperations();
