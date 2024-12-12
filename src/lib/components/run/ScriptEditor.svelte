<script lang="ts">
	import { onMount } from 'svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { EditorState } from '@codemirror/state';
	import { EditorView, basicSetup } from '@codemirror/basic-setup';
	import { lineNumbers } from '@codemirror/view';
	import { imgql } from './imgql-lang';
	import type { Case, PresetScript } from '$lib/models/types';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { LayerContext } from '$lib/models/types';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { popup } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

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
			backgroundColor: 'rgb(var(--color-surface-500) / 0.2) !important',
		},
		'&.cm-focused .cm-selectionBackground': {
			backgroundColor: 'rgb(var(--color-surface-500) / 0.3) !important',
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
		if (!isHeaderCollapsed && !headerView && layerViewModel.uniqueLayersNames) {
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
	async function handlePresetScriptSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		const scriptName = select.value;
		const script = runViewModel.presetScripts.find((p: PresetScript) => p.name === scriptName);
		if (script) {
			await runViewModel.loadPresetScript(script);
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: runViewModel.editorContent },
			});
			select.value = '';
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
	function handleScriptDownload() {
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

	// Run the script for all selected cases
	async function handleRun() {
		try {
			const runId = await runViewModel.runAll(caseViewModel.selectedCases);

			if (runViewModel.error) {
				toastStore.trigger({
					message: runViewModel.error ?? 'Run failed, check the tab for more details',
					background: 'variant-filled-error',
				});
			} else {
				toastStore.trigger({
					message: 'Run completed successfully!',
					background: 'variant-filled-success',
				});
			}

			// Switch to the newly created run tab
			const newLayerContext: LayerContext = { type: 'run', runId: runId };
			uiViewModel.layerContext = newLayerContext;

			// And make it blink
			uiViewModel.blinkingTabLayerContext = newLayerContext;
		} catch (error) {
			toastStore.trigger({
				message: runViewModel.error ?? 'Run failed (unknown error)',
				background: 'variant-filled-error',
			});
		}
	}

	// Run the script for a single case
	async function handleSingleRun(case_: Case) {
		try {
			await runViewModel.runAll([case_]);

			if (runViewModel.error) {
				toastStore.trigger({
					message: runViewModel.error ?? 'Single run failed',
					background: 'variant-filled-error',
				});
			} else {
				toastStore.trigger({
					message: `Single run completed successfully for ${case_.name}!`,
					background: 'variant-filled-success',
				});
			}
		} catch (error) {
			toastStore.trigger({
				message: runViewModel.error ?? 'Single run failed',
				background: 'variant-filled-error',
			});
		}
	}
</script>

<div class="flex flex-col h-full">
	{#if runViewModel.isLoading}
		<div
			class="absolute inset-0 bg-surface-900/50 backdrop-blur-[1px] z-50 flex items-center justify-center"
		>
			<div class="flex flex-col items-center gap-4">
				<ProgressRadial width="w-12" />
				<p class="text-surface-50">Running script...</p>
			</div>
		</div>
	{/if}
	<div class="p-4 border-b border-surface-500/30 flex gap-2">
		<select
			name="script_preset"
			class="select flex-1"
			value="Load a preset script template..."
			onchange={handlePresetScriptSelect}
		>
			<option value="" disabled>Load a preset script template...</option>
			{#each runViewModel.presetScripts as script}
				<option value={script.name}>{script.name}</option>
			{/each}
		</select>

		<button
			class="btn btn-icon variant-ghost-surface"
			title="Open local .imgql script"
			aria-label="Open local .imgql script"
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
	<div class="border-t border-surface-500/30 p-4">
		<button
			class="w-full p-2 bg-surface-200-700-token flex items-center justify-between"
			onclick={() => (isHeaderCollapsed = !isHeaderCollapsed)}
		>
			<span class="text-sm font-medium flex items-center gap-2"> Script Header </span>
			<i class="fa-solid {isHeaderCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
		</button>
		{#if !isHeaderCollapsed}
			<div id="header-editor" class="text-surface-900-50-token"></div>
		{/if}
	</div>

	<!-- Main editor -->
	<div id="editor" class="flex-1 p-4 overflow-auto text-surface-900-50-token"></div>

	<!-- Run buttons at bottom -->
	<div class="p-4 border-t border-surface-500/30 flex gap-2">
		<button
			class="btn variant-filled-surface flex-1"
			disabled={!runViewModel.editorContent.trim()}
			title="Download the current script content"
			aria-label="Download the current script content"
			onclick={handleScriptDownload}
		>
			<i class="fa-solid fa-download mr-2"></i>
			Download
		</button>
		<div class="flex gap-1 flex-1">
			<button
				class="btn variant-filled-primary flex-1"
				disabled={!runViewModel.editorContent.trim()}
				title="Run the script for all opened cases"
				aria-label="Run the script for all opened cases"
				onclick={handleRun}
			>
				<i class="fa-solid fa-play mr-2"></i>
				Run All
			</button>
			<button
				class="btn variant-filled-primary p-1"
				disabled={!runViewModel.editorContent.trim()}
				use:popup={{
					event: 'click',
					target: 'case-dropdown',
					placement: 'top-end',
				}}
				title="Run Script for a single case"
				aria-label="Run Script for a single case"
			>
				<i class="fa-solid fa-chevron-up text-sm"></i>
			</button>

			<div
				class="card p-0 w-48 bg-surface-50-900-token border border-surface-400-500-token shadow-xl"
				data-popup="case-dropdown"
			>
				<div class="py-1">
					{#each caseViewModel.selectedCases as case_, i}
						<button
							class="w-full text-left px-4 py-2 text-sm hover:bg-surface-500/20"
							title={`Run script for ${case_.name}`}
							aria-label={`Run script for ${case_.name}`}
							onclick={() => handleSingleRun(case_)}
						>
							Run Case <strong class="text-surface-900-50-token">{case_.name}</strong>
						</button>
						{#if i !== caseViewModel.selectedCases.length - 1}
							<hr class="border-surface-500/30" />
						{/if}
					{/each}
				</div>
				<div class="arrow bg-surface-400-500-token"></div>
			</div>
		</div>
	</div>
</div>
