<script lang="ts">
	import type { Case, PrintOutput } from '$lib/models/types';
	import { LayerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	let {
		case_ = $bindable<Case>(),
		index = $bindable<number>(),
		uniqueLayers = $bindable<string[]>(),
		layerState = $bindable<LayerViewModel>(),
		isRunView = $bindable<boolean>(),
	} = $props();

	// Get prints for this specific case
	const runPrints = $derived.by(() => {
		if (uiViewModel.bottomPanelRunIndex === -1) return [];
		// Assume there is only one RunPrint[] per case
		return runViewModel.history[uiViewModel.bottomPanelRunIndex]
			?.filter((run) => run.case.id === case_.id)
			.map((run) => run.outputPrint)[0];
	});

	let isPrintsExpanded = $state(true);

	function formatPrint(print: PrintOutput): string {
		if (print.vltype === 'number' || print.vltype === 'string') {
			return `${print.name}: ${print.value}`;
		}
		return `${print.name}: [${print.vltype}] ${print.value}`;
	}
</script>

<tr
	class="align-middle h-12 hover:bg-surface-400/10 hover:dark:bg-surface-500/20 transition-colors duration-200"
>
	<td
		class="align-middle border-b border-surface-500/30 {isRunView &&
		runPrints &&
		runPrints.length > 0
			? 'w-64'
			: 'w-48'}"
	>
		<div class="px-4 py-1 rounded bg-surface-200-700-token/50 flex flex-col gap-1">
			<!-- Main case info -->
			<div class="flex items-center gap-2">
				<div class="badge-container">
					<span class="badge variant-filled-primary">{index + 1}</span>
				</div>
				<span class="group-hover:text-primary-500 transition-colors duration-200" title={case_.id}>
					{case_.id.length > 20 ? '...' + case_.id.slice(-20) : case_.id}
				</span>
				{#if isRunView && runPrints && runPrints.length > 0}
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
			{#if isRunView && runPrints && runPrints.length > 0 && isPrintsExpanded}
				<div class="text-xs font-mono bg-surface-300/30 dark:bg-surface-500/30 rounded p-2">
					<ul class="list-disc list-inside space-y-0.5">
						{#each runPrints as runPrint}
							<li class="break-all select-text" title={formatPrint(runPrint)}>
								{runPrint.name}:
								<span class="font-bold select-text"
									>{runPrint.vltype === 'number' || runPrint.vltype === 'string'
										? runPrint.value
										: `[${runPrint.vltype}] ${runPrint.value}`}</span
								>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</td>
	{#each uniqueLayers as layerId}
		{@const layer = layerState.getAvailableLayerFromId(case_.id, layerId)}
		{@const isAvailable = layer !== undefined}
		<td class="w-32 text-center align-middle px-4 border-b border-surface-500/30">
			<button
				title={isAvailable
					? layerState.isLayerSelectedForCase(case_.id, layer.id)
						? `Hide ${layerId} layer`
						: `Show ${layerId} layer`
					: `${layerId} layer not available for this case`}
				aria-label={isAvailable
					? layerState.isLayerSelectedForCase(case_.id, layer.id)
						? `Hide ${layerId} layer`
						: `Show ${layerId} layer`
					: `${layerId} layer not available`}
				class="w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none group"
				disabled={!isAvailable}
				onclick={() => layer && layerState.toggleLayer(case_.id, layer)}
			>
				{#if isAvailable}
					<i
						class="fa-solid fa-circle-check text-2xl transition-colors duration-200 {layerState.isLayerSelectedForCase(
							case_.id,
							layer.id
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
