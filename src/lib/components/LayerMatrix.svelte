<script lang="ts">
	import { mainStore } from '$lib/stores/mainStore';
	import { layerStore, uniqueLayers } from '$lib/stores/layerStore';
	import ListButton from './common/ListButton.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';

	$: if ($mainStore.cases.selected.length > 0) {
		const lastSelectedCase = $mainStore.cases.selected[$mainStore.cases.selected.length - 1];
		const currentLayers = $mainStore.layers.availableByCase[lastSelectedCase.id];
		if (!currentLayers) {
			layerStore.loadLayers(lastSelectedCase);
		}
	}
</script>

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<table class="w-full">
		<thead>
			<tr>
				<th class="text-left w-48 border-r border-b border-surface-500/30">Layer</th>
				{#each $mainStore.cases.selected as case_, index}
					<th
						class="w-32 text-center px-4 border-b border-surface-500/30 {index !==
						$mainStore.cases.selected.length - 1
							? 'border-r'
							: ''}">{case_.id}</th
					>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each $uniqueLayers as layer, layerIndex}
				<tr class="align-middle h-12">
					<td class="align-middle w-48 border-r border-b border-surface-500/30">
						<div class="flex items-center gap-2">
							<ColorPicker
								label=""
								rgb={$mainStore.layers.styles[layer.id]?.color}
								on:input={(e) => {
									mainStore.update((state) => ({
										...state,
										layers: {
											...state.layers,
											styles: {
												...state.layers.styles,
												[layer.id]: {
													...state.layers.styles[layer.id],
													color: e.detail.rgb,
												},
											},
										},
									}));
								}}
							/>
							<ListButton
								selected={false}
								on:click={() => {
									const isSelected = Object.values($mainStore.layers.selected).some((layers) =>
										layers?.some((l) => l.id === layer.id)
									);
									if (isSelected) {
										layerStore.unselectLayerIdForAllSelectedCases(layer.id);
									} else {
										layerStore.selectLayerIdForAllSelectedCases(layer.id);
									}
								}}
							>
								{layer.id}
							</ListButton>
						</div>
					</td>
					{#each $mainStore.cases.selected as case_, caseIndex}
						{@const isAvailable = ($mainStore.layers.availableByCase[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						{@const isSelected = ($mainStore.layers.selected[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						<td
							class="w-32 text-center align-middle px-4 border-b border-surface-500/30 {caseIndex !==
							$mainStore.cases.selected.length - 1
								? 'border-r'
								: ''}"
						>
							<input
								type="checkbox"
								class="checkbox"
								checked={isSelected}
								disabled={!isAvailable}
								on:change={() => layerStore.toggleLayer(case_.id, layer)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
