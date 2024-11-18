<script lang="ts">
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { datasetOperations } from '$lib/modelviews/datasetOperations';
	import ListButton from './common/ListButton.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		datasetOperations.loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="font-bold text-2xl pl-4 pr-4 pb-4">Datasets</h2>

	{#if mainState.datasets.loading}
		<div class="flex justify-center p-4">
			<span class="loader"></span>
		</div>
	{:else if mainState.datasets.error}
		<div class="alert variant-filled-error">
			{mainState.datasets.error}
		</div>
	{:else}
		<div class="space-y-0.5">
			{#each mainState.datasets.available as dataset}
				<ListButton
					selected={mainState.datasets.selected?.id === dataset.id}
					on:click={() => datasetOperations.selectDataset(dataset)}
				>
					{dataset.id}
				</ListButton>
			{/each}
		</div>
	{/if}
</div>
