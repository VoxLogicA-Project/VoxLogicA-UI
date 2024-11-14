<script lang="ts">
	import { datasetStore, reachedMaxCases } from '$lib/viewmodels/datasetStore';
	import type { Case } from '$lib/models/dataset';

	let searchQuery = '';
	let cases: Case[] = [];

	// Fetches case list when dataset changes
	$: if ($datasetStore.currentDataset) {
		fetch(`/datasets/${$datasetStore.currentDataset.path}/cases`)
			.then((response) => response.json())
			.then((data) => (cases = data))
			.catch(() => (cases = []));
	}

	// Filters cases based on search query
	$: filteredCases = searchQuery
		? cases.filter((caseData) => caseData.id.toLowerCase().includes(searchQuery.toLowerCase()))
		: cases;
</script>

<div class="flex flex-col h-full">
	{#if $datasetStore.currentDataset}
		<!-- Search bar -->
		<div class="px-4 pb-4">
			<div class="input-group grid-cols-[auto_1fr]">
				<div class="input-group-shim">
					<i class="fa-solid fa-search"></i>
				</div>
				<input class="p-1" type="search" placeholder="Search cases..." bind:value={searchQuery} />
			</div>
		</div>

		<!-- Cases list -->
		<div class="flex-1 overflow-y-auto space-y-0.5">
			{#if filteredCases.length > 0}
				{#each filteredCases as caseData (caseData.id)}
					{@const isSelected = $datasetStore.selectedCases.some((c) => c.id === caseData.id)}
					{@const isDisabled = $reachedMaxCases && !isSelected}
					<button
						class="w-full px-4 py-2.5 text-left transition-all duration-200
							hover:bg-surface-200-700-token hover:pl-6 group
							{isSelected
							? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
							: 'text-surface-900-50-token'}
							{isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
						on:click={() => datasetStore.toggleCase(caseData)}
						disabled={isDisabled}
					>
						<div class="flex items-center justify-between">
							<span class="truncate font-medium">
								{caseData.id}
							</span>

							{#if isSelected}
								<span class="badge badge-sm variant-filled-primary">
									{$datasetStore.selectedCases.findIndex((c) => c.id === caseData.id) + 1}
								</span>
							{:else}
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
							{/if}
						</div>
					</button>
				{/each}
			{:else if searchQuery}
				<div
					class="flex flex-col items-center justify-center h-full text-surface-600-300-token p-4"
				>
					<i class="fa-solid fa-circle-xmark text-3xl mb-2 opacity-50"></i>
					<p class="text-center">
						No cases found matching "<span class="font-medium">{searchQuery}</span>"
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
