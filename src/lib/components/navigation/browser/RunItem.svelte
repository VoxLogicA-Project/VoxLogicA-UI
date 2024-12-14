<script lang="ts">
	import { slide } from 'svelte/transition';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import type { Run } from '$lib/models/types';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
	let { run }: { run: Run } = $props();

	const hasActivePrintFilters = $derived(
		runViewModel.printFilters.some((f) => f.label.trim() && f.value.trim())
	);

	function toggleRunDetails(runId: string, event: MouseEvent) {
		event.stopPropagation();
		uiViewModel.toggleRunExpansion(runId);
	}

	function handleLoadScript() {
		modalStore.trigger({
			type: 'confirm',
			title: 'Load Run Script',
			body: 'This will overwrite the current script in the editor. Are you sure?',
			response: (confirmed: boolean) => {
				if (confirmed) {
					uiViewModel.loadScript(run.scriptContent);
				}
			},
		});
	}
</script>

<div class="flex flex-col">
	<div class="flex items-center w-full">
		<button
			type="button"
			class="flex-1 text-left px-3 py-1.5 rounded-token transition-all duration-200 flex items-center min-w-0
                hover:bg-surface-200-700-token hover:pl-4 group
                {runViewModel.isRunSelected(run.id)
				? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
				: 'text-surface-900-50-token'}"
			onclick={() => {
				runViewModel.toggleRun(run.id);
				if (runViewModel.isRunSelected(run.id)) {
					uiViewModel.layerContext = { type: 'run', runId: run.id };
				}
			}}
		>
			<div class="flex justify-center mr-2 flex-shrink-0 w-7">
				<div
					class="badge badge-sm rounded-full h-5 px-2 inline-flex items-center justify-center {runViewModel.isRunSelected(
						run.id
					)
						? 'bg-primary-900 text-primary-200'
						: 'bg-surface-300 dark:bg-surface-500 text-surface-900-50-token'}"
				>
					{run.id}
				</div>
			</div>
			<span class="truncate flex-1 text-sm">
				{new Date(run.timestamp).toLocaleString(undefined, {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}
				{#if run.outputError}
					<i class="fa-solid fa-triangle-exclamation text-red-500 pl-2"></i>
				{/if}
			</span>
		</button>
		<div class="flex gap-1">
			<button
				type="button"
				title="Load run script"
				aria-label="Load run script"
				class="btn-icon btn-sm variant-soft hover:variant-soft-primary rounded-token h-8 w-8"
				onclick={handleLoadScript}
			>
				<i class="fa-solid fa-code text-sm"></i>
			</button>
			{#if !hasActivePrintFilters}
				<button
					type="button"
					title={!run.outputPrint?.length ? 'No prints available' : 'Show run prints'}
					aria-label={!run.outputPrint?.length ? 'No prints available' : 'Show run prints'}
					class="btn-icon btn-sm variant-soft hover:variant-soft-primary rounded-token h-8 w-8"
					onclick={(e) => toggleRunDetails(run.id, e)}
					disabled={!run.outputPrint?.length}
				>
					<i
						class="fa-solid fa-chevron-{uiViewModel.expandedRunIds.has(run.id)
							? 'up'
							: 'down'} text-sm"
					></i>
				</button>
			{/if}
		</div>
	</div>

	{#if uiViewModel.expandedRunIds.has(run.id) && run.outputPrint?.length > 0}
		<div
			class="p-2 rounded-token text-xs font-mono bg-surface-50-900-token text-surface-900-50-token"
			transition:slide|local={{ duration: 200 }}
		>
			<div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
				{#each run.outputPrint as print}
					<span class="select-text truncate">{print.name}:</span>
					<span class="font-bold select-text truncate">{print.value}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
