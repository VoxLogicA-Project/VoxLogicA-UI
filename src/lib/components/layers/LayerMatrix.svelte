<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerMatrixHeader from './LayerMatrixHeader.svelte';
	import LayerMatrixRow from './LayerMatrixRow.svelte';
	import RunPrints from './RunPrints.svelte';

	// Unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (uiViewModel.bottomPanelTab === 'layers') {
			return layerViewModel.uniqueLayersIds;
		}
		const runIndex = parseInt(uiViewModel.bottomPanelTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runViewModel.uniqueLayerIdsByRun(runIndex);
	});

	// Layer state based on the bottom panel tab
	const layerState = $derived(
		uiViewModel.bottomPanelTab === 'layers'
			? layerViewModel
			: runViewModel.layerStates[uiViewModel.bottomPanelRunIndex]
	);
</script>

<div class="bg-surface-100-800-token rounded-lg h-full flex flex-col">
	<div class="flex-none">
		<LayerTabs />
	</div>

	<div class="flex-1 overflow-y-auto min-h-0">
		{#if layerViewModel.isLoading}
			<div class="p-8 flex justify-center">
				<ProgressRadial width="w-8" />
			</div>
		{:else}
			<div class="px-4 relative h-full flex flex-col">
				{#if uiViewModel.bottomPanelRunIndex !== -1}
					<RunPrints />
				{/if}

				{#if uniqueLayers.length === 0}
					<div
						class="p-8 flex justify-center items-center text-center text-surface-600 dark:text-surface-400"
					>
						<div class="flex flex-col gap-2">
							<i class="fa-solid fa-layer-group text-3xl"></i>
							<p>
								{uiViewModel.bottomPanelRunIndex !== -1
									? 'No layers available for this run. Check if the run was successful and try loading different cases.'
									: 'No layers available. Try loading different cases to view their layers.'}
							</p>
						</div>
					</div>
				{:else}
					<!-- Transposed Layer Matrix Table -->
					<div class="flex-1 overflow-y-auto">
						<table class="w-full border-collapse">
							<LayerMatrixHeader {uniqueLayers} {layerState} />
							<tbody>
								{#each caseViewModel.selectedCases as case_, index}
									<LayerMatrixRow {case_} {index} {uniqueLayers} {layerState} />
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
