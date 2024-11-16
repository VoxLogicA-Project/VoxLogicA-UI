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
		// Check if the layer exists in the case's available layers
		return $datasetStore.availableLayers[caseId]?.some((layer) => layer.id === layerId) ?? false;
	}

	function isLayerVisualized(layerId: string, caseId: string): boolean {
		const caseLayers = $datasetStore.selectedLayers[caseId] || [];
		return caseLayers.some((layer) => layer.id === layerId);
	}

	function isBaseLayer(layerId: string): boolean {
		return $datasetStore.selectedBaseLayer?.id === layerId;
	}

	function setBaseLayer(layer: Layer) {
		// Only set as base layer if it's available for all cases
		if (isLayerAvailableForAllCases(layer.id)) {
			// First, unselect this layer from all cases where it's selected
			$datasetStore.selectedCases.forEach((case_) => {
				if (isLayerVisualized(layer.id, case_.id)) {
					datasetStore.toggleLayer(case_.id, layer);
				}
			});
			// Then set it as base layer
			datasetStore.setBaseLayer(layer);
		}
	}

	// Check if this layer is available for all cases
	function isLayerAvailableForAllCases(layerId: string): boolean {
		return $datasetStore.selectedCases.every((case_) =>
			$datasetStore.availableLayers[case_.id]?.some((layer) => layer.id === layerId)
		);
	}

	// Add this function to handle clicking on layer name
	function toggleLayerForAllCases(layer: Layer) {
		// Check if layer is visualized in any case
		const isVisualizedInSome = $datasetStore.selectedCases.some((case_) =>
			isLayerVisualized(layer.id, case_.id)
		);

		// If visualized in any case, remove from all. Otherwise, add to all available cases
		$datasetStore.selectedCases.forEach((case_) => {
			if (isLayerAvailable(layer.id, case_.id) && !isBaseLayer(layer.id)) {
				if (isVisualizedInSome) {
					// If shown anywhere, remove from all
					if (isLayerVisualized(layer.id, case_.id)) {
						datasetStore.toggleLayer(case_.id, layer);
					}
				} else {
					// If not shown anywhere, add where available
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
				<th class="w-16 text-center">Base</th>
				<th class="text-left">Layer</th>
				{#each $datasetStore.selectedCases as case_}
					<th class="w-16 text-center">{case_.id}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each allLayers as layer}
				<tr class="border-t border-surface-500/30 h-12 align-middle">
					<td class="w-16 text-center">
						<input
							type="radio"
							class="radio"
							name="baseLayer"
							checked={isBaseLayer(layer.id)}
							disabled={!isLayerAvailableForAllCases(layer.id)}
							on:change={() => setBaseLayer(layer)}
							title={!isLayerAvailableForAllCases(layer.id)
								? 'Layer must be available in all cases to be set as base layer'
								: ''}
						/>
					</td>
					<td class="align-middle">
						<ListButton
							selected={isBaseLayer(layer.id)}
							disabled={isBaseLayer(layer.id)}
							isBaseLayer={isBaseLayer(layer.id)}
							on:click={() => toggleLayerForAllCases(layer)}
						>
							{layer.id}
						</ListButton>
					</td>
					{#each $datasetStore.selectedCases as case_}
						<td class="w-16 text-center align-middle">
							<input
								type="checkbox"
								class="checkbox"
								checked={isLayerVisualized(layer.id, case_.id)}
								disabled={!isLayerAvailable(layer.id, case_.id) || isBaseLayer(layer.id)}
								on:change={() => datasetStore.toggleLayer(case_.id, layer)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
