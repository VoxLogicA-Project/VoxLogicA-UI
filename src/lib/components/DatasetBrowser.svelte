<script lang="ts">
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import ListButton from './common/ListButton.svelte';
	import { onMount } from 'svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	onMount(() => {
		datasetViewModel.loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="font-bold text-2xl pl-4 pr-4 pb-4">Datasets</h2>

	{#if datasetViewModel.isLoading}
		<!-- Loading state -->
		<div class="flex-1 flex items-center justify-center">
			<ProgressRadial width="w-8" />
		</div>
	{:else if datasetViewModel.currentError}
		<div class="alert variant-filled-error">
			{datasetViewModel.currentError}
		</div>
	{:else}
		<div class="space-y-0.5">
			{#each datasetViewModel.datasets as dataset}
				<ListButton
					selected={datasetViewModel.selectedDataset?.id === dataset.id}
					on:click={() => datasetViewModel.selectDataset(dataset)}
				>
					{dataset.id}
				</ListButton>
			{/each}
		</div>
	{/if}
</div>
