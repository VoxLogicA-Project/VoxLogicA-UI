<script lang="ts">
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import { onMount } from 'svelte';
	import type { Dataset } from '$lib/models/dataset';

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
				<button
					class="w-full px-4 py-2.5 text-left transition-all duration-200
						hover:bg-surface-200-700-token hover:pl-6 group
						{dataset === $datasetStore.currentDataset
						? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
						: 'text-surface-900-50-token'}"
					on:click={() => datasetStore.selectDataset(dataset)}
				>
					<div class="flex items-center justify-between">
						<span class="truncate font-medium">
							{dataset.name}
						</span>
						<svg
							class="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-200
								group-hover:opacity-50 group-hover:translate-x-0"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
