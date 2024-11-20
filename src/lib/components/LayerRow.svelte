<script lang="ts">
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { layerOperations } from '$lib/modelviews/layerOperations.svelte';
	import { runOperations } from '$lib/modelviews/runOperations.svelte';
	import ListButton from './common/ListButton.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';

	let { layerId, activeTab } = $props<{ layerId: string; activeTab: string }>();

	// Move both layer state and selection status into derived blocks
	const layerState = $derived(
		activeTab === 'layers'
			? mainState.layers
			: mainState.runs.layersStates[parseInt(activeTab.split('-')[1])]
	);

	const isLayerSelectedForCase = $derived((caseId: string) =>
		layerState.selected[caseId]?.some((l) => l.id === layerId)
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
		const isLayerSelectedForAllCases =
			Object.keys(layerState.selected).length > 0 &&
			Object.values(layerState.selected).every((layers) => layers?.some((l) => l.id === layerId));

		if (activeTab === 'layers') {
			if (isLayerSelectedForAllCases) {
				layerOperations.unselectLayerForAllSelectedCases(layerId);
			} else {
				layerOperations.selectLayerForAllSelectedCases(layerId);
			}
		} else {
			const runIndex = parseInt(activeTab.split('-')[1]);
			if (isLayerSelectedForAllCases) {
				runOperations.unselectLayerForAllRunCases(runIndex, layerId);
			} else {
				runOperations.selectLayerForAllRunCases(runIndex, layerId);
			}
		}
	}
</script>

<tr class="align-middle h-12">
	<td class="align-middle w-48 border-r border-b border-surface-500/30">
		<div class="flex items-center gap-2">
			<div class:dark={isDarkMode}>
				<ColorPicker
					label=""
					rgb={layerState.styles[layerId]?.color}
					on:input={(e) => {
						if (activeTab === 'layers') {
							mainState.layers.styles[layerId].color = e.detail.rgb;
						} else {
							const runIndex = parseInt(activeTab.split('-')[1]);
							mainState.runs.layersStates[runIndex].styles[layerId].color = e.detail.rgb;
						}
					}}
				/>
			</div>
			<ListButton selected={false} on:click={toggleLayerForAllCases}>
				{layerId}
			</ListButton>
		</div>
	</td>
	{#each mainState.cases.selected as case_, caseIndex}
		{@const layer = layerState.availableByCase[case_.id]?.find((l) => l.id === layerId)}
		{@const isAvailable = layer !== undefined}
		<td
			class="w-32 text-center align-middle px-4 border-b border-surface-500/30 {caseIndex !==
			mainState.cases.selected.length - 1
				? 'border-r'
				: ''}"
		>
			<button
				class="w-8 h-8 rounded-full"
				disabled={!isAvailable}
				onclick={() => {
					if (isAvailable) {
						if (activeTab === 'layers') {
							if (isLayerSelectedForCase(case_.id)) {
								layerOperations.unselectLayer(case_.id, layer);
							} else {
								layerOperations.selectLayer(case_.id, layer);
							}
						} else {
							const runIndex = parseInt(activeTab.split('-')[1]);
							runOperations.toggleLayer(runIndex, case_.id, layer);
						}
					}
				}}
			>
				{#if isAvailable}
					<i
						class="fa-solid fa-circle text-lg {isLayerSelectedForCase(case_.id)
							? 'text-primary-500'
							: 'text-surface-300-600-token'}"
					></i>
				{:else}
					<i class="fa-solid fa-circle text-lg text-error-500"></i>
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
