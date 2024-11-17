<script lang="ts">
	import { mainStore } from '$lib/stores/mainStore';
	import { datasetStore } from '$lib/stores/datasetStore';
	import ListButton from './common/ListButton.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		datasetStore.loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="font-bold text-2xl pl-4 pr-4 pb-4">Datasets</h2>

	{#if $mainStore.datasets.loading}
		<div class="flex justify-center p-4">
			<span class="loader" />
		</div>
	{:else if $mainStore.datasets.error}
		<div class="alert variant-filled-error">
			{$mainStore.datasets.error}
		</div>
	{:else}
		<div class="space-y-0.5">
			{#each $mainStore.datasets.available as dataset}
				<ListButton
					selected={dataset === $mainStore.datasets.selected}
					on:click={() => datasetStore.selectDataset(dataset)}
				>
					{dataset.id}
				</ListButton>
			{/each}
		</div>
	{/if}
</div>
