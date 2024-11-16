<script lang="ts">
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import { onMount } from 'svelte';
	import type { Dataset } from '$lib/models/dataset';
	import ListButton from './common/ListButton.svelte';

	let datasets: Dataset[] = [];

	async function loadDatasets() {
		datasetStore.update((state) => ({ ...state, loading: true, error: null }));
		try {
			const response = await fetch('/datasets');
			datasets = await response.json();
		} catch (err) {
			datasetStore.update((state) => ({ ...state, error: 'Failed to load datasets' }));
		} finally {
			datasetStore.update((state) => ({ ...state, loading: false }));
		}
	}

	onMount(() => {
		loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="h3 p-4">Datasets</h2>

	{#if $datasetStore.loading}
		<div class="flex justify-center p-4">
			<span class="loader" />
		</div>
	{:else if $datasetStore.error}
		<div class="alert variant-filled-error">
			{$datasetStore.error}
		</div>
	{:else}
		<div class="space-y-0.5">
			{#each datasets as dataset}
				<ListButton
					selected={dataset === $datasetStore.currentDataset}
					on:click={() => datasetStore.selectDataset(dataset)}
				>
					{dataset.name}
				</ListButton>
			{/each}
		</div>
	{/if}
</div>
