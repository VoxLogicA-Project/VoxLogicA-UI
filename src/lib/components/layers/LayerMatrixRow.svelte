<script lang="ts">
	import type { Case } from '$lib/models/types';
	import { LayerViewModel } from '$lib/viewmodels/layer.svelte';

	let {
		case_ = $bindable<Case>(),
		index = $bindable<number>(),
		uniqueLayers = $bindable<string[]>(),
		layerState = $bindable<LayerViewModel>(),
	} = $props();
</script>

<tr class="align-middle h-12">
	<td class="align-middle w-48 border-b border-surface-500/30">
		<div class="px-4 py-1 rounded bg-surface-200-700-token/50 truncate flex items-center gap-2">
			<div class="badge-container">
				<span class="badge variant-filled-primary">{index + 1}</span>
			</div>
			<span title={case_.id}>
				{case_.id.length > 20 ? '...' + case_.id.slice(-20) : case_.id}
			</span>
		</div>
	</td>
	{#each uniqueLayers as layerId}
		{@const layer = layerState.getAvailableLayerFromId(case_.id, layerId)}
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
