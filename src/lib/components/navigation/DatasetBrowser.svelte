<script lang="ts">
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import ListButton from '$lib/components/common/ListButton.svelte';
	import { onMount } from 'svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	onMount(() => {
		datasetViewModel.loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="font-bold text-2xl pl-4 pr-4 pb-4">Datasets</h2>

	{#if datasetViewModel.isLoading}
		<div class="flex-1 flex items-center justify-center">
			<ProgressRadial width="w-8" />
		</div>
	{:else if datasetViewModel.error}
		<div class="alert variant-filled-error">
			{datasetViewModel.error}
		</div>
	{:else}
		<div class="space-y-0.5">
			{#each datasetViewModel.datasets as dataset}
				<ListButton
					selected={datasetViewModel.selectedDataset?.name === dataset.name}
					on:click={() => datasetViewModel.selectDataset(dataset)}
				>
					{dataset.name}
				</ListButton>
			{/each}
		</div>
	{/if}
</div>
