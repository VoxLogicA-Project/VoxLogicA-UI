<script lang="ts">
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import ListButton from '$lib/components/common/ListButton.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	let searchQuery = $state('');

	// Filters cases based on search query
	const filteredCases = $derived(
		searchQuery
			? caseViewModel.cases.filter((caseData) =>
					caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: caseViewModel.cases
	);
</script>

<div class="flex flex-col h-full">
	{#if datasetViewModel.selectedDataset}
		<!-- Search bar -->
		<div class="px-4 pb-4">
			<div class="input-group grid-cols-[auto_1fr]">
				<div class="input-group-shim">
					<i class="fa-solid fa-search"></i>
				</div>
				<input
					name="search_cases"
					class="p-1"
					type="search"
					placeholder="Search cases..."
					bind:value={searchQuery}
				/>
			</div>
		</div>

		{#if caseViewModel.isLoading}
			<div class="flex-1 flex items-center justify-center">
				<ProgressRadial width="w-8" />
			</div>
		{:else if caseViewModel.currentError}
			<div class="p-4">
				<div class="alert variant-filled-error">
					{caseViewModel.currentError}
				</div>
			</div>
		{:else}
			<!-- Content -->
			<div class="flex-1 overflow-y-auto space-y-0.5">
				{#if filteredCases.length > 0}
					{#each filteredCases as caseData (caseData.id)}
						{@const isSelected = caseViewModel.isSelected(caseData)}
						{@const isDisabled = !caseViewModel.canSelectMore && !isSelected}
						<ListButton
							selected={isSelected}
							disabled={isDisabled}
							showBadge={isSelected}
							badgeContent={(caseViewModel.getSelectionIndex(caseData) + 1).toString()}
							on:click={async () => await caseViewModel.toggleCase(caseData)}
						>
							{caseData.id}
						</ListButton>
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
	{/if}
</div>
