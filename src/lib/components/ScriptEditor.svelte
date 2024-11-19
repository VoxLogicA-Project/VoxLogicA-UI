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
	import { getUniqueLayers } from '$lib/modelviews/layerOperations.svelte';
	import { runOperations } from '$lib/modelviews/runOperations.svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	let editorContent = $state('');
	let fileInput: HTMLInputElement;
	let editorView: EditorView;
	let headerView: EditorView | undefined;
	let headerContent = $derived(generateHeaderContent());
	let isHeaderCollapsed = $state(false);

	function generateHeaderContent() {
		const layers = getUniqueLayers();
		return `import "stdlib.imgql"\n\n// Load layers\n${layers
			.map((layer) => {
				return `load ${layer.id} = "\$\{LAYER_PATH:${layer.id}\}"`;
			})
			.join('\n')}`;
	}

	// Custom theme for the editor to blend better with Skeleton
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

	// Function to initialize header editor
	function initHeaderCodeBlock() {
		headerView = new EditorView({
			state: EditorState.create({
				doc: headerContent,
				extensions: [
					basicSetup,
					lineNumbers(),
					customTheme,
					imgql(),
					EditorView.editable.of(false),
					EditorState.readOnly.of(true),
				],
			}),
			parent: document.querySelector('#header-editor') || undefined,
		});
	}

	function initEditor() {
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
	}

	onMount(() => {
		scriptOperations.loadScripts();
		initHeaderCodeBlock();
		initEditor();
	});

	// Reinitialize/destroy header editor when uncollapsed/collapsed
	$effect(() => {
		if (!isHeaderCollapsed && !headerView) {
			// Small delay to ensure DOM is updated
			setTimeout(() => {
				initHeaderCodeBlock();
			}, 0);
		} else if (isHeaderCollapsed && headerView) {
			headerView.destroy();
			headerView = undefined;
		}
	});

	// Update header content when it changes
	$effect(() => {
		if (headerView) {
			headerView.dispatch({
				changes: { from: 0, to: headerView.state.doc.length, insert: headerContent },
			});
		}
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
		const fullContent = `${headerContent}\n\n${editorContent}`;
		const blob = new Blob([fullContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${mainState.scripts.selectedPreset?.id?.replace(/\.imgql$/, '') || 'script'}-${new Date().toISOString()}.imgql`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Add this function to handle the run button click
	async function handleRun() {
		const firstCase = mainState.cases.selected[0];
		if (!firstCase) {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: 'No cases available to run the script on.',
			});
			return;
		}

		try {
			const fullContent = `${headerContent}\n\n${editorContent}`;
			const result = await runOperations.runVoxLogicA(fullContent, firstCase);

			modalStore.trigger({
				type: 'alert',
				title: 'Run Result',
				body: `<div class="max-h-[70vh] overflow-auto">
					<pre class="whitespace-pre-wrap p-4 rounded-container-token bg-surface-200-700-token">${JSON.stringify(result, null, 2)}</pre>
				</div>`,
			});
		} catch (error) {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: `Failed to run script: ${error}`,
			});
		}
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

	<!-- Header editor with collapse button -->
	<div class="border-t border-surface-500/30 px-4">
		<div class="flex items-center justify-between p-2 bg-surface-200-700-token">
			<span class="text-sm font-medium">Script Header</span>
			<button
				class="btn btn-sm variant-ghost"
				onclick={() => (isHeaderCollapsed = !isHeaderCollapsed)}
				title={isHeaderCollapsed ? 'Expand' : 'Collapse'}
				aria-label={isHeaderCollapsed ? 'Expand' : 'Collapse'}
			>
				<i class="fa-solid {isHeaderCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
			</button>
		</div>
		{#if !isHeaderCollapsed}
			<div id="header-editor"></div>
		{/if}
	</div>

	<hr />

	<!-- Main editor -->
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
			onclick={handleRun}
		>
			<i class="fa-solid fa-play mr-2"></i>
			Run Script
		</button>
	</div>
</div>
