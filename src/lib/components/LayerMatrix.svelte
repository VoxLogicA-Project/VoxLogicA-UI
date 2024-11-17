<script lang="ts">
	import { mainStore } from '$lib/stores/mainStore';
	import { layerStore, uniqueLayers } from '$lib/stores/layerStore';
	import ListButton from './common/ListButton.svelte';
</script>

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<table class="w-full">
		<thead>
			<tr>
				<th class="text-left w-48">Layer</th>
				{#each $mainStore.cases.selected as case_}
					<th class="w-32 text-center px-4">{case_.id}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each $uniqueLayers as layer}
				<tr class="border-t border-surface-500/30 h-12 align-middle">
					<td class="align-middle w-48">
						<ListButton
							selected={false}
							on:click={() => layerStore.selectLayerForAllSelectedCases(layer)}
						>
							{layer.id}
						</ListButton>
					</td>
					{#each $mainStore.cases.selected as case_}
						{@const isAvailable = ($mainStore.layers.availableByCase[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						{@const isSelected = ($mainStore.layers.selected[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						<td class="w-32 text-center align-middle px-4">
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
