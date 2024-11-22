<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import LayerTabs from '$lib/components/layers/LayerTabs.svelte';
	import RunPrints from '$lib/components/layers/RunPrints.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';

	// Show unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (uiViewModel.bottomPanelTab === 'layers') {
			return layerViewModel.uniqueLayersIds;
		}
		const runIndex = parseInt(uiViewModel.bottomPanelTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runViewModel.uniqueLayerIdsByRun(runIndex);
	});

	// Derive layer state based on the bottom panel tab
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

	<!-- Scrollable content -->
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
				<div class="flex-1 overflow-y-auto">
					<!-- Transposed Layer Matrix Table -->
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="w-48 border-b border-surface-500/30"></th>
								{#each uniqueLayers as layerId}
									<th class="text-center p-2 border-b border-surface-500/30 font-medium">
										<div class="flex flex-col items-center">
											<div class:dark={uiViewModel.isDarkMode}>
												<ColorPicker
													label=""
													rgb={layerState.layerStyle(layerId)?.color}
													on:input={(e) => {
														if (uiViewModel.bottomPanelTab === 'layers') {
															layerViewModel.setLayerStyleColor(layerId, e.detail.rgb);
														} else {
															runViewModel.layerStates[
																uiViewModel.bottomPanelRunIndex
															].setLayerStyleColor(layerId, e.detail.rgb);
														}
													}}
												/>
											</div>
											<div class="flex items-center gap-1">
												<button
													class="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-500/20 transition-colors group"
													onclick={() => {
														const isLayerSelectedForAllCases =
															layerState.isLayerSelectedForAllCases(layerId);
														if (isLayerSelectedForAllCases) {
															layerState.unselectLayerForAllSelectedCases(layerId);
														} else {
															layerState.selectLayerForAllSelectedCases(layerId);
														}
													}}
													title="Select/Deselect layer for all cases"
													aria-label="Select/Deselect layer for all cases"
												>
													<span
														class="truncate text-surface-900 dark:text-surface-50"
														title={layerId}
													>
														{layerId.length > 20 ? '...' + layerId.slice(-20) : layerId}
													</span>
													<i
														class="fa-solid fa-check-to-slot text-sm {layerState.isLayerSelectedForAllCases(
															layerId
														)
															? 'text-primary-500'
															: 'text-surface-300/70 group-hover:text-surface-500 dark:text-surface-400/50 dark:group-hover:text-surface-300'}"
													></i>
												</button>
											</div>
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each caseViewModel.selectedCases as case_, index}
								<tr class="align-middle h-12">
									<td class="align-middle w-48 border-b border-surface-500/30">
										<div
											class="px-4 py-1 rounded bg-surface-200-700-token/50 truncate flex items-center gap-2"
										>
											<div class="badge-container">
												<span class="badge variant-filled-primary">{index + 1}</span>
											</div>
											<span title={case_.id}>
												{case_.id.length > 20 ? '...' + case_.id.slice(-20) : case_.id}
											</span>
										</div>
									</td>
									{#each uniqueLayers as layerId}
										{@const layer = layerState.getLayerFromId(case_.id, layerId)}
										{@const isAvailable = layer !== undefined}
										<td class="w-32 text-center align-middle px-4 border-b border-surface-500/30">
											<button
												class="w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none"
												disabled={!isAvailable}
												onclick={() => layer && layerState.toggleLayer(case_.id, layer)}
											>
												{#if isAvailable}
													<i
														class="fa-solid fa-circle-check text-2xl {layerState.isLayerSelectedForCase(
															case_.id,
															layerId
														)
															? 'text-primary-500'
															: 'text-surface-300/70 hover:text-surface-500 dark:text-surface-400/50 dark:hover:text-surface-300'}"
													></i>
												{:else}
													<i class="fa-solid fa-circle-xmark text-2xl text-error-500"></i>
												{/if}
											</button>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.dark {
		--cp-bg-color: #333;
		--cp-border-color: white;
		--cp-text-color: white;
		--cp-input-color: #555;
		--cp-button-hover-color: #777;
	}
</style>
