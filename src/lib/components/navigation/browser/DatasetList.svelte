<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Case } from '$lib/models/types';
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import CaseItem from './CaseItem.svelte';

	export let searchQuery: string;
	export let filteredCases: Case[];
	const TRANSITION_DURATION = 200;
</script>

<ul class="p-2 space-y-1">
	{#each datasetViewModel.datasets as dataset}
		<li>
			<button
				class="w-full text-left px-3 py-2 rounded-token transition-all duration-200 flex items-center min-w-0
                    hover:bg-primary-500/30 hover:pl-4 group
                    {dataset.name === datasetViewModel.selectedDataset?.name
					? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
					: 'text-surface-900-50-token'}"
				onclick={() => datasetViewModel.selectDataset(dataset)}
			>
				<i class="fa-solid fa-database mr-2 opacity-70 flex-shrink-0"></i>
				<span class="truncate flex-1 font-medium">{dataset.name}</span>
				{#if dataset.name !== datasetViewModel.selectedDataset?.name}
					<i
						class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
                        group-hover:opacity-50 group-hover:translate-x-0"
					></i>
				{/if}
			</button>

			{#if dataset.name === datasetViewModel.selectedDataset?.name}
				{#if caseViewModel.isLoading}
					<div class="pl-6 py-2">
						<i class="fa-solid fa-spinner fa-spin opacity-50"></i>
					</div>
				{:else}
					<div transition:slide|local={{ duration: TRANSITION_DURATION, easing: quintOut }}>
						{#if filteredCases.length > 0}
							<ul class="pl-4 space-y-0.5 mt-0.5">
								{#each filteredCases as case_}
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
