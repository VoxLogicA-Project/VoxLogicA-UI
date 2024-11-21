<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerRow from './LayerRow.svelte';

	// Initialize with 'layers' as default
	let activeTab = $state('layers');

	// Show unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (activeTab === 'layers') {
			return layerViewModel.uniqueLayersIds;
		}
		const runIndex = parseInt(activeTab.split('-')[1]);
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

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<LayerTabs bind:activeTab />

	<!-- Layer Matrix Table -->
	<div class="pt-4">
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
					<LayerRow {layerId} {activeTab} />
				{/each}
			</tbody>
		</table>
	</div>
</div>
