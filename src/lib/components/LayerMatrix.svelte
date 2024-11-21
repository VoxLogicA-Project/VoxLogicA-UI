<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerRow from './LayerRow.svelte';
	import RunPrints from './RunPrints.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';

	// Show unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (uiViewModel.bottomPanelTab === 'layers') {
			return layerViewModel.uniqueLayersIds;
		}
		const runIndex = parseInt(uiViewModel.bottomPanelTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runViewModel.uniqueLayerIdsByRun(runIndex);
	});

	// Show error toast if there is an error loading layers
	const toastStore = getToastStore();
	$effect(() => {
		if (layerViewModel.currentError) {
			toastStore.trigger({
				message: layerViewModel.currentError,
				background: 'variant-filled-error',
			});
		}
	});
</script>

<div class="bg-surface-100-800-token rounded-lg">
	<LayerTabs />

	{#if layerViewModel.isLoading}
		<div class="p-8 flex justify-center">
			<ProgressRadial width="w-8" />
		</div>
	{:else}
		<!-- RunPrints component -->
		{#if uiViewModel.bottomPanelRunIndex !== -1}
			<RunPrints />
		{/if}

		<!-- Layer Matrix Table -->
		<div class="p-4">
			<table class="w-full">
				<thead>
					<tr>
						<th class="text-left w-48 border-r border-b border-surface-500/30">Layers</th>
						{#each caseViewModel.selectedCases as case_, index}
							<th
								class="w-32 text-center px-4 border-b border-surface-500/30 font-normal {index !==
								caseViewModel.selectedCases.length - 1
									? 'border-r'
									: ''}"
							>
								{case_.id}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each uniqueLayers as layerId}
						<LayerRow {layerId} />
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
