<script lang="ts">
	import { slide } from 'svelte/transition';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import type { Run } from '$lib/models/types';

	let { run }: { run: Run } = $props();

	function toggleRunDetails(runId: string, event: MouseEvent) {
		event.stopPropagation();
		uiViewModel.toggleRunExpansion(runId);
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
			class:variant-filled-error={run.outputError}
			onclick={() => runViewModel.toggleRun(run.id)}
		>
			<i
				class="fa-solid mr-2 opacity-70 flex-shrink-0"
				class:fa-circle-play={!run.outputError}
				class:fa-circle-exclamation={run.outputError}
			></i>
			<span class="truncate flex-1 text-sm flex items-center gap-2">
				{new Date(run.timestamp).toLocaleString(undefined, {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}
				<span class="opacity-50 truncate">({run.id})</span>
			</span>
		</button>
		{#if run.outputPrint?.length > 0}
			<button
				type="button"
				title="Show run prints"
				aria-label="Show run prints"
				class="btn-icon btn-sm variant-soft hover:variant-soft-primary rounded-token h-8 w-8"
				onclick={(e) => toggleRunDetails(run.id, e)}
			>
				<i
					class="fa-solid fa-chevron-{uiViewModel.expandedRunIds.has(run.id)
						? 'up'
						: 'down'} text-sm"
				></i>
			</button>
		{/if}
	</div>

	{#if uiViewModel.expandedRunIds.has(run.id)}
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
