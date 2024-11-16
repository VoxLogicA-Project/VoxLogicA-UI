<script lang="ts">
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import type { Layer } from '$lib/models/dataset';
	import ListButton from './common/ListButton.svelte';

	let allLayers: Layer[] = [];

	// Fetch all unique layers when cases change
	$: if ($datasetStore.selectedCases.length > 0) {
		const layerPromises = $datasetStore.selectedCases.map((case_) =>
			fetch(`/datasets/${$datasetStore.currentDataset?.path}/cases/${case_.id}/layers`)
				.then((response) => response.json())
				.catch(() => [])
		);

		Promise.all(layerPromises).then((caseLayers) => {
			// Combine all layers and remove duplicates based on layer ID
			allLayers = Array.from(new Map(caseLayers.flat().map((layer) => [layer.id, layer])).values());
		});
	}

	function isLayerAvailable(layerId: string, caseId: string): boolean {
		return $datasetStore.availableLayers[caseId]?.some((layer) => layer.id === layerId) ?? false;
	}

	function isLayerVisualized(layerId: string, caseId: string): boolean {
		const caseLayers = $datasetStore.selectedLayers[caseId] || [];
		return caseLayers.some((layer) => layer.id === layerId);
	}

	function toggleLayerForAllCases(layer: Layer) {
		const isVisualizedInSome = $datasetStore.selectedCases.some((case_) =>
			isLayerVisualized(layer.id, case_.id)
		);

		$datasetStore.selectedCases.forEach((case_) => {
			if (isLayerAvailable(layer.id, case_.id)) {
				if (isVisualizedInSome) {
					if (isLayerVisualized(layer.id, case_.id)) {
						datasetStore.toggleLayer(case_.id, layer);
					}
				} else {
					if (!isLayerVisualized(layer.id, case_.id)) {
						datasetStore.toggleLayer(case_.id, layer);
					}
				}
			}
		});
	}
</script>

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<table class="w-full">
		<thead>
			<tr>
				<th class="text-left w-48">Layer</th>
				{#each $datasetStore.selectedCases as case_}
					<th class="w-32 text-center px-4">{case_.id}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each allLayers as layer}
				<tr class="border-t border-surface-500/30 h-12 align-middle">
					<td class="align-middle w-48">
						<ListButton selected={false} on:click={() => toggleLayerForAllCases(layer)}>
							{layer.id}
						</ListButton>
					</td>
					{#each $datasetStore.selectedCases as case_}
						<td class="w-32 text-center align-middle px-4">
							<input
								type="checkbox"
								class="checkbox"
								checked={isLayerVisualized(layer.id, case_.id)}
								disabled={!isLayerAvailable(layer.id, case_.id)}
								on:change={() => datasetStore.toggleLayer(case_.id, layer)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
