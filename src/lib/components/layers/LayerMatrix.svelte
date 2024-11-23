<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import LayerTabs from '$lib/components/layers/LayerTabs.svelte';
	import RunPrints from '$lib/components/layers/RunPrints.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import ColorMapPicker from '$lib/components/common/ColorMapPicker.svelte';
	import { popup } from '@skeletonlabs/skeleton';

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
								<th class="w-48 border-b border-surface-500/30 p-2">
									<div class="flex items-center gap-2">
										<div class="flex items-center gap-2">
											<i class="fa-solid fa-layer-group text-surface-500"></i>
											<span class="text-sm font-medium">Add layers</span>
										</div>
										<button
											class="p-1 hover:text-primary-500 transition-colors"
											aria-label="Layer Selection Guide"
											use:popup={{
												event: 'hover',
												target: 'layer-matrix-help',
												placement: 'top',
											}}
										>
											<i class="fa-solid fa-circle-info text-sm"></i>
										</button>
									</div>
								</th>
								{#each uniqueLayers as layerId}
									<th class="text-center p-2 border-b border-surface-500/30 font-medium">
										<div class="flex flex-col items-center">
											<div class:dark={uiViewModel.isDarkMode} title="Click to change layer color">
												<ColorMapPicker bind:value={layerState.styles[layerId]} id={layerId} />
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
													title="Click to toggle layer visibility for all cases"
												>
													<span class="truncate text-surface-900 dark:text-surface-50">
														{layerId.length > 20 ? '...' + layerId.slice(-20) : layerId}
													</span>
													<i
														class="fa-solid fa-check-to-slot text-sm transition-colors duration-200
														{layerState.isLayerSelectedForAllCases(layerId)
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
												title="Toggle layer visibility"
												aria-label="Toggle layer visibility"
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
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Popup content -->
<div
	class="card p-4 variant-filled-surface shadow-xl fixed"
	data-popup="layer-matrix-help"
	style="z-index: 1000;"
>
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-check text-primary-500"></i>
			</div>
			<span>Layer is visible, click to hide</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-check text-surface-300/70"></i>
			</div>
			<span>Layer is hidden, click to show</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-xmark text-error-500"></i>
			</div>
			<span>Layer is not available</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-check-to-slot text-primary-500"></i>
			</div>
			<span>Click to toggle layer visibility for all cases</span>
		</div>
	</div>
	<div class="arrow variant-filled-surface"></div>
</div>
