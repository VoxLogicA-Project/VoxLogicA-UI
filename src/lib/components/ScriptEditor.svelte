<script lang="ts">
	import { onMount } from 'svelte';
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { scriptOperations } from '$lib/modelviews/scriptsOperations.svelte';
	import { apiRepository } from '$lib/models/repository';
	import type { Script } from '$lib/models/types';
	import { EditorState } from '@codemirror/state';
	import { EditorView, basicSetup } from '@codemirror/basic-setup';
	import { lineNumbers } from '@codemirror/view';
	import { imgql } from './common/imgql-lang';

	let editorContent = $state('');
	let fileInput: HTMLInputElement;
	let editorView: EditorView;

	// Add these theme-related configurations
	const customTheme = EditorView.theme({
		'&': {
			backgroundColor: 'transparent',
		},
		'.cm-gutters': {
			backgroundColor: 'transparent',
			border: 'none',
		},
		'.cm-activeLine': {
			backgroundColor: 'rgba(255, 255, 255, 0.05)',
		},
		'&.cm-focused .cm-activeLine': {
			backgroundColor: 'rgba(255, 255, 255, 0.05)',
		},
		'.cm-selectionBackground': {
			backgroundColor: 'rgb(var(--color-primary-500) / 0.2) !important',
		},
		'&.cm-focused .cm-selectionBackground': {
			backgroundColor: 'rgb(var(--color-primary-500) / 0.3) !important',
		},
		'.cm-content': {
			caretColor: 'rgb(var(--color-surface-900-50-token))',
		},
		'.cm-cursor': {
			borderLeftColor: 'rgb(var(--color-surface-900-50-token))',
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
		},
	});

	// Update the editor content and save to mainState
	function handleEditorUpdate() {
		editorContent = editorView.state.doc.toString();
		scriptOperations.saveScriptContent(editorContent);
	}

	// Initialize CodeMirror editor and setup auto-save
	onMount(() => {
		editorView = new EditorView({
			state: EditorState.create({
				doc: editorContent,
				extensions: [
					basicSetup,
					lineNumbers(),
					customTheme,
					EditorView.lineWrapping,
					imgql(),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							handleEditorUpdate();
						}
					}),
				],
			}),
			parent: document.querySelector('#editor') || undefined,
		});

		scriptOperations.loadScripts();
	});

	// Load script's content
	async function loadScriptContent(script: Script) {
		try {
			const content = await apiRepository.getScriptCode(script);
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: content },
			});
		} catch (error) {
			console.error('Failed to load script content:', error);
		}
	}

	// Load script from dropdown
	function handleScriptSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		const script = mainState.scripts.availablePresets.find((s) => s.id === select.value);
		if (script) {
			scriptOperations.selectScript(script);
			loadScriptContent(script);
		}
	}

	// Load script from file
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file && file.name.endsWith('.imgql')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				editorView.dispatch({
					changes: { from: 0, to: editorView.state.doc.length, insert: content },
				});
			};
			reader.readAsText(file);
		}
		scriptOperations.clearScript();
	}

	// Download the current script content
	function handleSave() {
		const blob = new Blob([editorContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${mainState.scripts.selectedPreset?.id?.replace(/\.imgql$/, '') || 'script'}-${new Date().toISOString()}.imgql`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex flex-col h-full">
	<div class="p-4 border-b border-surface-500/30 flex gap-2">
		<select
			class="select flex-1"
			value={mainState.scripts.selectedPreset?.id ?? ''}
			onchange={handleScriptSelect}
		>
			<option value="" disabled selected={!mainState.scripts.selectedPreset}
				>Choose a preset script...</option
			>
			{#each mainState.scripts.availablePresets as script}
				<option value={script.id}>{script.id}</option>
			{/each}
		</select>

		<button
			class="btn btn-icon variant-ghost-surface"
			title="Open File"
			aria-label="Open File"
			onclick={() => fileInput.click()}
		>
			<i class="fa-solid fa-folder-open"></i>
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept=".imgql"
			class="hidden"
			onchange={handleFileSelect}
		/>
	</div>

	<!-- Editor area -->
	<div id="editor" class="flex-1 p-4 overflow-auto"></div>

	<!-- Run button at bottom -->
	<div class="p-4 border-t border-surface-500/30 flex gap-2">
		<button
			class="btn variant-filled-surface flex-1"
			disabled={!editorContent.trim()}
			onclick={handleSave}
		>
			<i class="fa-solid fa-download mr-2"></i>
			Download
		</button>
		<button
			class="btn variant-filled-primary flex-1"
			disabled={!editorContent.trim()}
			onclick={() => console.warn('To be implemented')}
		>
			<i class="fa-solid fa-play mr-2"></i>
			Run Script
		</button>
	</div>
</div>
