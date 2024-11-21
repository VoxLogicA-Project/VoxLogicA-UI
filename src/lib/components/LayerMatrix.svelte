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

<div class="bg-surface-100-800-token rounded-lg h-full flex flex-col">
	<div class="flex-none">
		<LayerTabs />
	</div>

	<!-- Scrollable content -->
	<div class="flex-1 overflow-y-auto min-h-0">
		{#if layerViewModel.isLoading}
			<div class="p-8 flex justify-center">
				<ProgressRadial width="w-8" />
			</div>
		{:else}
			<div class="px-4 relative h-full flex flex-col">
				<!-- RunPrints component -->
				{#if uiViewModel.bottomPanelRunIndex !== -1}
					<RunPrints />
				{/if}
				<div class="flex-1 overflow-y-auto">
					<!-- Layer Matrix Table -->
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="text-left w-48 border-b border-surface-500/30"> Layers </th>
								{#each caseViewModel.selectedCases as case_, index}
									<th class="text-center p-2 border-b border-surface-500/30 font-medium">
										<div
											class="px-4 py-1 rounded bg-surface-200-700-token/50 truncate"
											title={case_.id}
										>
											{case_.id.length > 20 ? '...' + case_.id.slice(-20) : case_.id}
										</div>
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
			</div>
		{/if}
	</div>
</div>
