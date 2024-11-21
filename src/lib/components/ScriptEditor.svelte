<script lang="ts">
	import { onMount } from 'svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { EditorState } from '@codemirror/state';
	import { EditorView, basicSetup } from '@codemirror/basic-setup';
	import { lineNumbers } from '@codemirror/view';
	import { imgql } from './common/imgql-lang';
	import type { Case } from '$lib/models/types';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	const toastStore = getToastStore();

	let fileInput: HTMLInputElement;
	let editorView: EditorView;
	let headerView: EditorView | undefined;
	let isHeaderCollapsed = $state(false);
	let showCaseDropdown = $state(false);

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

			if (runViewModel.currentError) {
				toastStore.trigger({
					message: runViewModel.currentError ?? 'Run failed',
					background: 'variant-filled-error',
				});
			} else {
				// Switch to the newly created run tab
				const newRunIndex = runViewModel.history.length - 1;
				uiViewModel.bottomPanelTab = `run-${newRunIndex}`;

				toastStore.trigger({
					message: 'Run completed successfully!',
					background: 'variant-filled-success',
				});
			}
		} catch (error) {
			toastStore.trigger({
				message: runViewModel.currentError ?? 'Run failed',
				background: 'variant-filled-error',
			});
		}
	}

	async function handleSingleRun(case_: Case) {
		showCaseDropdown = false;
		try {
			await runViewModel.runAll([case_]);

			if (runViewModel.currentError) {
				toastStore.trigger({
					message: runViewModel.currentError ?? 'Single run failed',
					background: 'variant-filled-error',
				});
			} else {
				toastStore.trigger({
					message: `Single run completed successfully for ${case_.id}!`,
					background: 'variant-filled-success',
				});
			}
		} catch (error) {
			toastStore.trigger({
				message: runViewModel.currentError ?? 'Single run failed',
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
	<div class="border-t border-surface-500/30 p-4">
		<button
			class="w-full p-2 bg-surface-200-700-token flex items-center justify-between"
			onclick={() => (isHeaderCollapsed = !isHeaderCollapsed)}
		>
			<span class="text-sm font-medium flex items-center gap-2"> Script Header </span>
			<i class="fa-solid {isHeaderCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
		</button>
		{#if !isHeaderCollapsed}
			<div id="header-editor"></div>
		{/if}
	</div>

	<!-- Main editor -->
	<div id="editor" class="flex-1 p-4 overflow-auto"></div>

	<!-- Run buttons at bottom -->
	<div class="p-4 border-t border-surface-500/30 flex gap-2">
		<button
			class="btn variant-filled-surface flex-1"
			disabled={!runViewModel.editorContent.trim()}
			onclick={handleSave}
		>
			<i class="fa-solid fa-download mr-2"></i>
			Download
		</button>
		<div class="flex gap-1 flex-1">
			<button
				class="btn variant-filled-primary flex-1"
				disabled={!runViewModel.editorContent.trim()}
				onclick={handleRun}
			>
				<i class="fa-solid fa-play mr-2"></i>
				Run All
			</button>
			<button
				class="btn variant-filled-primary p-1"
				disabled={!runViewModel.editorContent.trim()}
				onclick={() => (showCaseDropdown = !showCaseDropdown)}
				aria-label="Run Script for Selected Case"
			>
				<i class="fa-solid fa-chevron-up text-sm"></i>
			</button>
			{#if showCaseDropdown}
				<div
					class="absolute bottom-[4.5rem] right-4 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/10 dark:ring-white/10 shadow-surface-900/20"
				>
					<div class="py-1" role="menu">
						{#each caseViewModel.selectedCases as case_}
							<button
								class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
								onclick={() => handleSingleRun(case_)}
							>
								Run Case <strong>{case_.id}</strong>
							</button>
							{#if caseViewModel.selectedCases.length - 1 !== caseViewModel.selectedCases.indexOf(case_)}
								<hr class="border-surface-500/30" />
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
