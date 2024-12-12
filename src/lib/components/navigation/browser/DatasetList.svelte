<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Dataset, Case } from '$lib/models/types';
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import CaseItem from './CaseItem.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	let { searchQuery, filteredCases }: { searchQuery: string; filteredCases: Case[] } = $props();

	const TRANSITION_DURATION = 200;

	const hasResults = (datasetName: string) =>
		filteredCases.some((c) => caseViewModel.casesOfDataset(datasetName).includes(c));

	// Filter datasets based on search results
	const visibleDatasets = $derived.by(() => {
		const hasActiveSearch = searchQuery.trim() !== '';
		const hasActiveFilters = runViewModel.printFilters.some(
			(f) => f.label.trim() && f.value.trim()
		);

		// Only filter datasets if there's an active search or filter
		if ((hasActiveSearch || hasActiveFilters) && filteredCases.length > 0) {
			return datasetViewModel.datasets.filter((d) => hasResults(d.name));
		}
		return datasetViewModel.datasets;
	});

	function handleDatasetClick(dataset: Dataset) {
		const hasActiveSearch = searchQuery.trim() !== '';
		const hasActiveFilters = runViewModel.printFilters.some(
			(f) => f.label.trim() && f.value.trim()
		);

		// Only prevent unselecting if there's an active search/filter and dataset has results
		if (
			(hasActiveSearch || hasActiveFilters) &&
			hasResults(dataset.name) &&
			datasetViewModel.isSelected(dataset)
		) {
			return;
		}
		datasetViewModel.toggleDataset(dataset);
	}

	const hasActiveSearch = $derived(searchQuery.trim() !== '');
	const hasActiveFilters = $derived(
		runViewModel.printFilters.some((f) => f.label.trim() && f.value.trim())
	);
</script>

<ul class="p-2 space-y-1">
	{#each visibleDatasets as dataset}
		<li>
			<button
				class="w-full text-left px-3 py-2 rounded-token transition-all duration-200 flex items-center min-w-0
                    hover:bg-primary-500/30 hover:pl-4 group
                    {datasetViewModel.isSelected(dataset)
					? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
					: 'text-surface-900-50-token'}"
				onclick={() => handleDatasetClick(dataset)}
			>
				<div class="w-6 flex justify-center mr-2 flex-shrink-0">
					{#if !datasetViewModel.isSelected(dataset) && caseViewModel.getSelectedCasesForDataset(dataset.name).length > 0}
						<div class="badge badge-sm bg-surface-400 text-surface-50">
							{caseViewModel.getSelectedCasesForDataset(dataset.name).length}
						</div>
					{:else}
						<i class="fa-solid fa-database opacity-70"></i>
					{/if}
				</div>
				<span class="truncate flex-1 font-medium">{dataset.name}</span>
				{#if !datasetViewModel.isSelected(dataset)}
					<i
						class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
                        group-hover:opacity-50 group-hover:translate-x-0"
					></i>
				{:else}
					<i class="fa-solid fa-chevron-down w-3 h-3 opacity-50"></i>
				{/if}
			</button>

			{#if datasetViewModel.isSelected(dataset) || ((hasActiveSearch || hasActiveFilters) && hasResults(dataset.name))}
				{#if caseViewModel.isLoading}
					<div class="pl-6 py-2">
						<i class="fa-solid fa-spinner fa-spin opacity-50"></i>
					</div>
				{:else}
					<div transition:slide|local={{ duration: TRANSITION_DURATION, easing: quintOut }}>
						{#if filteredCases.length > 0}
							<ul class="pl-4 space-y-0.5 mt-0.5">
								{#each filteredCases.filter((c) => caseViewModel
										.casesOfDataset(dataset.name)
										.includes(c)) as case_}
									<CaseItem {case_} />
								{/each}
							</ul>
						{:else if searchQuery}
							<div class="px-3 py-3">
								<div class="rounded-token bg-surface-500/5 px-2">
									<div class="flex items-center gap-3 text-surface-600-300-token">
										<i class="fa-solid fa-filter-circle-xmark text-lg opacity-50"></i>
										<span class="text-sm">
											No cases found matching:<br />
											"<span class="font-medium text-surface-900-50-token">{searchQuery}</span>"
										</span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</li>
	{/each}
</ul>
