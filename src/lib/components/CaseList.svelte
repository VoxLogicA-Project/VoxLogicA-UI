<script lang="ts">
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { caseOperations } from '$lib/modelviews/caseOperations.svelte';
	import ListButton from './common/ListButton.svelte';

	let searchQuery = $state('');

	// Filters cases based on search query
	const filteredCases = $derived(
		searchQuery
			? mainState.cases.available.filter((caseData) =>
					caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: mainState.cases.available
	);

	$effect(() => {
		if (mainState.datasets.selected) {
			caseOperations.loadCases();
		}
	});
</script>

<div class="flex flex-col h-full">
	{#if mainState.datasets.selected}
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
					{@const isSelected = mainState.cases.selected.some((c) => c.id === caseData.id)}
					{@const isDisabled = !caseOperations.canSelectMore() && !isSelected}
					<ListButton
						selected={isSelected}
						disabled={isDisabled}
						showBadge={isSelected}
						badgeContent={mainState.cases.selected.findIndex((c) => c.id === caseData.id) + 1}
						on:click={() => caseOperations.toggleCase(caseData)}
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
</div>
