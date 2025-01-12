<script lang="ts">
	import type { Case, PrintOutput } from '$lib/models/types';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { slide } from 'svelte/transition';

	let { case_ = $bindable<Case>() } = $props();

	let runPrints = $derived.by(() => {
		if (uiViewModel.state.layers.layerContext.type !== 'run') return [];
		if (!uiViewModel.state.layers.layerContext.runId) return [];
		return runViewModel.getRunPrints(uiViewModel.state.layers.layerContext.runId, case_.path);
	});

	let isPrintsExpanded = $state(true);
</script>

<tr
	class="align-middle h-12 hover:bg-surface-400/10 hover:dark:bg-surface-500/20 transition-colors duration-200"
>
	<td class="align-middle border-b border-surface-500/30 {runPrints.length > 0 ? 'w-64' : 'w-48'}">
		<div class="px-4 py-1 rounded bg-surface-200-700-token/50 flex flex-col gap-1">
			<!-- Main case info -->
			<div class="flex items-center gap-2">
				<div class="badge-container">
					<span class="badge variant-filled-primary"
						>{caseViewModel.getSelectionIndex(case_.path)}</span
					>
				</div>
				<span
					class="group-hover:text-primary-500 transition-colors duration-200"
					title={case_.name}
				>
					{case_.name.length > 20 ? '...' + case_.name.slice(-20) : case_.name}
				</span>
				{#if runPrints.length > 0}
					<button
						title={isPrintsExpanded ? 'Hide prints' : 'Show prints'}
						aria-label={isPrintsExpanded ? 'Hide prints' : 'Show prints'}
						class="ml-auto w-7 h-7 btn-icon hover:variant-soft-primary rounded-full"
						onclick={() => (isPrintsExpanded = !isPrintsExpanded)}
					>
						<i class="fa-solid {isPrintsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-sm"
						></i>
					</button>
				{/if}
			</div>

			<!-- Prints section (only shown when expanded and in run view) -->
			{#if runPrints.length > 0 && isPrintsExpanded}
				<div
					class="p-2 rounded-token text-xs font-mono bg-surface-50-900-token text-surface-900-50-token"
					transition:slide|local={{ duration: 200 }}
				>
					<div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
						{#each runPrints as print}
							<span class="select-text truncate">{print.name}:</span>
							<span class="font-bold select-text truncate">{print.value}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</td>
	{#each layerViewModel.uniqueLayersNames as layerName}
		{@const layer = layerViewModel.getAvailableLayerFromName(case_.path, layerName)}
		{@const isAvailable = layer !== undefined}
		<td class="w-32 text-center align-middle px-4 border-b border-surface-500/30">
			<button
				title={isAvailable
					? layerViewModel.isLayerSelected(case_.path, layer.path)
						? `Hide ${layerName} layer`
						: `Show ${layerName} layer`
					: `${layerName} layer not available for this case`}
				aria-label={isAvailable
					? layerViewModel.isLayerSelected(case_.path, layer.path)
						? `Hide ${layerName} layer`
						: `Show ${layerName} layer`
					: `${layerName} layer not available`}
				class="w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none group"
				disabled={!isAvailable}
				onclick={() => layer && layerViewModel.toggleLayer(case_.path, layer.path)}
			>
				{#if isAvailable}
					<i
						class="fa-solid fa-circle-check text-2xl transition-colors duration-200 {layerViewModel.isLayerSelected(
							case_.path,
							layer.path
						)
							? 'text-primary-500 group-hover:text-primary-400'
							: 'text-surface-300/70 group-hover:text-surface-500 dark:text-surface-400/50 dark:group-hover:text-surface-300'}"
					></i>
				{:else}
					<i class="fa-solid fa-circle-xmark text-2xl text-error-500"></i>
				{/if}
			</button>
		</td>
	{/each}
</tr>
