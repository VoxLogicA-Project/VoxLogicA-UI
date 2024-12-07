<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import ColorMapPicker from '$lib/components/common/ColorMapPicker.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
</script>

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
		{#each layerViewModel.uniqueLayersNames as layerName}
			<th class="text-center p-2 border-b border-surface-500/30 font-medium">
				<div class="flex flex-col items-center">
					<div class:dark={uiViewModel.state.isDarkMode} title="Click to change layer color">
						<ColorMapPicker
							id={layerName}
							bind:colormapValue={layerViewModel.stylesByLayerName[layerName].colorMap}
							bind:alphaValue={layerViewModel.stylesByLayerName[layerName].alpha}
						/>
					</div>
					<div class="flex items-center gap-1">
						<button
							class="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-500/20 transition-colors group"
							onclick={() => {
								const isLayerSelectedForAllCases =
									layerViewModel.isLayerSelectedForAllOpenedCases(layerName);
								if (isLayerSelectedForAllCases) {
									layerViewModel.deselectLayerForAllOpenedCases(layerName);
								} else {
									layerViewModel.selectLayerForAllOpenedCases(layerName);
								}
							}}
							title={layerViewModel.isLayerSelectedForAllOpenedCases(layerName)
								? `Hide ${layerName} layer for all cases`
								: `Show ${layerName} layer for all cases`}
						>
							<span class="truncate text-surface-900 dark:text-surface-50">
								{layerName.length > 20 ? '...' + layerName.slice(-20) : layerName}
							</span>
							<i
								class="fa-solid fa-check-to-slot text-sm transition-colors duration-200
                            {layerViewModel.isLayerSelectedForAllOpenedCases(layerName)
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

<!-- Popup content -->
<div
	class="card p-4 variant-filled-surface shadow-xl fixed"
	data-popup="layer-matrix-help"
	style="z-index: 1000;"
>
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-check text-surface-300/70"></i>
			</div>
			<span>Layer is hidden, click to show</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-check text-primary-500"></i>
			</div>
			<span>Layer is visible, click to hide</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-circle-xmark text-error-500"></i>
			</div>
			<span>Layer is not available</span>
		</div>

		<div class="flex items-center gap-3">
			<div class="w-6 flex justify-center">
				<i class="fa-solid fa-check-to-slot text-surface-300/70"></i>
			</div>
			<span>Click to toggle layer visibility for all cases</span>
		</div>
	</div>
	<div class="arrow variant-filled-surface"></div>
</div>
