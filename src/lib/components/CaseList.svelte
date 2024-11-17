<script lang="ts">
	import { mainStore } from '$lib/stores/mainStore';
	import { caseStore } from '$lib/stores/caseStore';
	import ListButton from './common/ListButton.svelte';
	import { onMount } from 'svelte';

	let searchQuery = '';

	// Track previous dataset to prevent unnecessary reloads
	let previousDatasetId: string | null = null;

	// Load cases when dataset changes
	$: if ($mainStore.datasets.selected && $mainStore.datasets.selected.id !== previousDatasetId) {
		previousDatasetId = $mainStore.datasets.selected.id;
		caseStore.loadCases();
		console.log('Wow');
	}

	// Filters cases based on search query
	$: filteredCases = searchQuery
		? $mainStore.cases.available.filter((caseData) =>
				caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: $mainStore.cases.available;
</script>

<div class="flex flex-col h-full">
	{#if $mainStore.datasets.selected}
		<!-- Search bar -->
		<div class="px-4 pb-4">
			<div class="input-group grid-cols-[auto_1fr]">
				<div class="input-group-shim">
					<i class="fa-solid fa-search" />
				</div>
				<input class="p-1" type="search" placeholder="Search cases..." bind:value={searchQuery} />
			</div>
		</div>

		<!-- Cases list -->
		<div class="flex-1 overflow-y-auto space-y-0.5">
			{#if filteredCases.length > 0}
				{#each filteredCases as caseData (caseData.id)}
					{@const isSelected = $mainStore.cases.selected.some((c) => c.id === caseData.id)}
					{@const isDisabled = !caseStore.canSelectMore() && !isSelected}
					<ListButton
						selected={isSelected}
						disabled={isDisabled}
						showBadge={isSelected}
						badgeContent={$mainStore.cases.selected.findIndex((c) => c.id === caseData.id) + 1}
						on:click={() => caseStore.toggleCase(caseData)}
					>
						{caseData.id}
					</ListButton>
				{/each}
			{:else if searchQuery}
				<div
					class="flex flex-col items-center justify-center h-full text-surface-600-300-token p-4"
				>
					<i class="fa-solid fa-circle-xmark text-3xl mb-2 opacity-50" />
					<p class="text-center">
						No cases found matching "<span class="font-medium">{searchQuery}</span>"
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
