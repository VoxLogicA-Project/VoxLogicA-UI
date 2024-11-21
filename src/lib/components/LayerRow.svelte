<script lang="ts">
	import ListButton from './common/ListButton.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';

	let { layerId } = $props<{ layerId: string }>();

	// Move both layer state and selection status into derived blocks
	const layerState = $derived(
		uiViewModel.bottomPanelTab === 'layers'
			? layerViewModel
			: runViewModel.layerStates[uiViewModel.bottomPanelRunIndex]
	);

	const isLayerSelectedForCase = $derived((caseId: string) =>
		layerState.selectedLayersForCase(caseId)?.some((l) => l.id === layerId)
	);

	// Watch for theme changes to update the color picker
	let isDarkMode = $state(false);
	if (typeof document !== 'undefined') {
		isDarkMode = document.documentElement.classList.contains('dark');
		new MutationObserver(() => {
			isDarkMode = document.documentElement.classList.contains('dark');
		}).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});
	}

	// Handle layer selection for both layers and runs
	function toggleLayerForAllCases() {
		const isLayerSelectedForAllCases = layerState.isLayerSelectedForAllCases(layerId);

		if (isLayerSelectedForAllCases) {
			layerState.unselectLayerForAllSelectedCases(layerId);
		} else {
			layerState.selectLayerForAllSelectedCases(layerId);
		}
	}
</script>

<tr class="align-middle h-12">
	<td class="align-middle w-48 border-b border-surface-500/30">
		<div class="flex items-center gap-2">
			<div class:dark={isDarkMode}>
				<ColorPicker
					label=""
					rgb={layerState.layerStyle(layerId)?.color}
					on:input={(e) => {
						if (uiViewModel.bottomPanelTab === 'layers') {
							layerViewModel.setLayerStyleColor(layerId, e.detail.rgb);
						} else {
							runViewModel.layerStates[uiViewModel.bottomPanelRunIndex].setLayerStyleColor(
								layerId,
								e.detail.rgb
							);
						}
					}}
				/>
			</div>
			<ListButton selected={false} on:click={toggleLayerForAllCases}>
				{layerId}
			</ListButton>
		</div>
	</td>
	{#each caseViewModel.selectedCases as case_, caseIndex}
		{@const layer = layerState.getLayerFromId(case_.id, layerId)}
		{@const isAvailable = layer !== undefined}
		<td class="w-32 text-center align-middle px-4 border-b border-surface-500/30">
			<button
				class="w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none"
				disabled={!isAvailable}
				onclick={() => {
					if (isAvailable) {
						layerState.toggleLayer(case_.id, layer);
					}
				}}
			>
				{#if isAvailable}
					<i
						class="fa-solid fa-circle-check text-2xl {isLayerSelectedForCase(case_.id)
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

<style>
	.dark {
		--cp-bg-color: #333;
		--cp-border-color: white;
		--cp-text-color: white;
		--cp-input-color: #555;
		--cp-button-hover-color: #777;
	}
</style>
