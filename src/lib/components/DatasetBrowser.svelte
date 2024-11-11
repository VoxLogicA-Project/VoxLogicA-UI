<script lang="ts">
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import { onMount } from 'svelte';

	onMount(() => {
		datasetStore.loadDatasets();
	});
</script>

<div class="h-full">
	<h2 class="text-lg font-medium text-gray-700 px-4 mb-4">Datasets</h2>

	{#if $datasetStore.loading}
		<div class="flex justify-center p-4">
			<span class="loading loading-spinner loading-md text-gray-400" />
		</div>
	{:else if $datasetStore.error}
		<div class="mx-2 p-3 text-red-600 bg-red-50 rounded-md text-sm">
			{$datasetStore.error}
		</div>
	{:else}
		<div class="space-y-1">
			{#each $datasetStore.datasets as dataset}
				<button
					class="group w-full px-4 py-3 text-left transition-all duration-150 outline-none
						flex items-center justify-between
						{dataset === $datasetStore.currentDataset
						? 'bg-gray-100 text-gray-900'
						: 'text-gray-600 hover:bg-gray-50'}"
					on:click={() => datasetStore.selectDataset(dataset)}
				>
					<div class="truncate text-sm flex-1" title={dataset.name}>
						{dataset.name}
					</div>
					<svg
						class="w-4 h-4 text-gray-400 transform transition-transform duration-150
							{dataset === $datasetStore.currentDataset
							? 'translate-x-0 opacity-100'
							: '-translate-x-2 opacity-0'}
							group-hover:translate-x-0 group-hover:opacity-100"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	button {
		cursor: pointer;
		position: relative;
	}

	button:hover {
		transform: translateX(4px);
	}

	button:focus-visible {
		outline: 2px solid #4f46e5;
		outline-offset: -2px;
	}
</style>
