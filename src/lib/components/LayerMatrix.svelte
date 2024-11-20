<script lang="ts">
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { layerOperations } from '$lib/modelviews/layerOperations.svelte';
	import { runOperations } from '$lib/modelviews/runOperations.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerRow from './LayerRow.svelte';
	import { onMount } from 'svelte';

	// Initialize with 'layers' as default
	let activeTab = $state('layers');

	// Show unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (activeTab === 'layers') {
			return layerOperations.uniqueLayers;
		}
		const runIndex = parseInt(activeTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runOperations.uniqueLayersByRun(runIndex);
	});

	$effect(() => {
		if (mainState.cases.selected.length > 0) {
			const lastSelectedCase = mainState.cases.selected[mainState.cases.selected.length - 1];
			const currentLayers = mainState.layers.availableByCase[lastSelectedCase.id];
			if (!currentLayers) {
				layerOperations.loadLayers(lastSelectedCase);
			}
		}
	});

	// Show error toast if there is an error loading layers
	const toastStore = getToastStore();
	$effect(() => {
		if (mainState.layers.error) {
			toastStore.trigger({
				message: mainState.layers.error,
				background: 'variant-filled-error',
			});
		}
	});
</script>

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<LayerTabs bind:activeTab />

	<!-- Layer Matrix Table -->
	<div class="pt-4">
		<table class="w-full">
			<thead>
				<tr>
					<th class="text-left w-48 border-r border-b border-surface-500/30">Layers</th>
					{#each mainState.cases.selected as case_, index}
						<th
							class="w-32 text-center px-4 border-b border-surface-500/30 font-normal {index !==
							mainState.cases.selected.length - 1
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
					<LayerRow {layerId} {activeTab} />
				{/each}
			</tbody>
		</table>
	</div>
</div>
