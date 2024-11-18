<script lang="ts">
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { layerOperations, getUniqueLayers } from '$lib/modelviews/layerOperations.svelte';
	import ListButton from './common/ListButton.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';

	$effect(() => {
		if (mainState.cases.selected.length > 0) {
			const lastSelectedCase = mainState.cases.selected[mainState.cases.selected.length - 1];
			const currentLayers = mainState.layers.availableByCase[lastSelectedCase.id];
			if (!currentLayers) {
				layerOperations.loadLayers(lastSelectedCase);
			}
		}
	});

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

	// Use $derived to maintain reactivity
	const uniqueLayers = $derived(getUniqueLayers());
</script>

<div class="p-4 bg-surface-100-800-token rounded-lg">
	<table class="w-full">
		<thead>
			<tr>
				<th class="text-left w-48 border-r border-b border-surface-500/30">Layers</th>
				{#each mainState.cases.selected as case_, index}
					<th
						class="w-32 text-center px-4 border-b border-surface-500/30 font-normal {index !==
						mainState.cases.selected.length - 1
							? 'border-r'
							: ''}">{case_.id}</th
					>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each uniqueLayers as layer, layerIndex}
				<tr class="align-middle h-12">
					<td class="align-middle w-48 border-r border-b border-surface-500/30">
						<div class="flex items-center gap-2">
							<div class:dark={isDarkMode}>
								<ColorPicker
									label=""
									rgb={mainState.layers.styles[layer.id]?.color}
									on:input={(e) => {
										mainState.layers.styles[layer.id].color = e.detail.rgb;
									}}
								/>
							</div>
							<ListButton
								selected={false}
								on:click={() => {
									const isSelected = Object.values(mainState.layers.selected).some((layers) =>
										layers?.some((l) => l.id === layer.id)
									);
									if (isSelected) {
										layerOperations.unselectLayerIdForAllSelectedCases(layer.id);
									} else {
										layerOperations.selectLayerIdForAllSelectedCases(layer.id);
									}
								}}
							>
								{layer.id}
							</ListButton>
						</div>
					</td>
					{#each mainState.cases.selected as case_, caseIndex}
						{@const isAvailable = (mainState.layers.availableByCase[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						{@const isSelected = (mainState.layers.selected[case_.id] || []).some(
							(l) => l.id === layer.id
						)}
						<td
							class="w-32 text-center align-middle px-4 border-b border-surface-500/30 {caseIndex !==
							mainState.cases.selected.length - 1
								? 'border-r'
								: ''}"
						>
							<input
								type="checkbox"
								class="checkbox"
								checked={isSelected}
								disabled={!isAvailable}
								onchange={() => layerOperations.toggleLayer(case_.id, layer)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.dark {
		--cp-bg-color: #333;
		--cp-border-color: white;
		--cp-text-color: white;
		--cp-input-color: #555;
		--cp-button-hover-color: #777;
	}
</style>
