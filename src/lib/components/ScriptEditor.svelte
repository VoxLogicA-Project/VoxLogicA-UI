<script lang="ts">
	import { onMount } from 'svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { EditorState } from '@codemirror/state';
	import { EditorView, basicSetup } from '@codemirror/basic-setup';
	import { lineNumbers } from '@codemirror/view';
	import { imgql } from './common/imgql-lang';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	let fileInput: HTMLInputElement;
	let editorView: EditorView;
	let headerView: EditorView | undefined;
	let isHeaderCollapsed = $state(false);

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

	// Function to initialize header editor
	function initHeaderCodeBlock() {
		headerView = new EditorView({
			state: EditorState.create({
				doc: runViewModel.headerContent,
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
				doc: runViewModel.editorContent,
				extensions: [
					basicSetup,
					lineNumbers(),
					customTheme,
					EditorView.lineWrapping,
					imgql(),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							runViewModel.saveEditorContent(editorView.state.doc.toString());
						}
					}),
				],
			}),
			parent: document.querySelector('#editor') || undefined,
		});
	}

	onMount(async () => {
		await runViewModel.loadPresets();
		initEditor();
	});

	// Reinitialize/destroy header editor when uncollapsed/collapsed
	$effect(() => {
		if (!isHeaderCollapsed && !headerView && layerViewModel.uniqueLayersIds.length > 0) {
			initHeaderCodeBlock();
		} else if (isHeaderCollapsed && headerView) {
			headerView.destroy();
			headerView = undefined;
		}
	});

	// Update header content when it changes
	$effect(() => {
		if (headerView) {
			headerView.dispatch({
				changes: { from: 0, to: headerView.state.doc.length, insert: runViewModel.headerContent },
			});
		}
	});

	// Load script from dropdown
	async function handleScriptSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		const scriptId = select.value;
		const script = runViewModel.availablePresets.find((p) => p.id === scriptId);
		if (script) {
			await runViewModel.loadPresetScript(script);
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: runViewModel.editorContent },
			});
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
	}

	// Download the current script content
	function handleSave() {
		const blob = new Blob([runViewModel.fullScriptContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `script-${new Date().toISOString()}.imgql`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function handleRun() {
		try {
			await runViewModel.runAll(caseViewModel.selectedCases);
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
			value={runViewModel.availablePresets[0]?.id ?? ''}
			onchange={handleScriptSelect}
		>
			<option value="" disabled selected={!runViewModel.availablePresets[0]}
				>Choose a preset script...</option
			>
			{#each runViewModel.availablePresets as script}
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
			disabled={!runViewModel.editorContent.trim()}
			onclick={handleSave}
		>
			<i class="fa-solid fa-download mr-2"></i>
			Download
		</button>
		<button
			class="btn variant-filled-primary flex-1"
			disabled={!runViewModel.editorContent.trim()}
			onclick={handleRun}
		>
			<i class="fa-solid fa-play mr-2"></i>
			Run Script
		</button>
	</div>
</div>
