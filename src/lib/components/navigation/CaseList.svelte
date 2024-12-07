<script lang="ts">
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import ListButton from '$lib/components/common/ListButton.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { getToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();

	let searchQuery = $state('');
	interface Filter {
		label: string;
		operation: string;
		value: string;
	}
	let filters = $state<Filter[]>([]);

	// Filters cases based on search query
	const filteredCases = $derived(
		searchQuery
			? caseViewModel.cases.filter((caseData) =>
					caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: caseViewModel.cases
	);

	function addFilter() {
		if (filters.length === 0) {
			toastStore.trigger({
				message: 'Case filtering is not implemented yet',
				background: 'variant-filled-warning',
			});
		}
		filters = [...filters, { label: '', operation: '', value: '' }];
	}

	function removeFilter(index: number) {
		filters = filters.filter((_, i) => i !== index);
	}

	$effect(() => {
		if (caseViewModel.error) {
			toastStore.trigger({
				message: caseViewModel.error,
				background: 'variant-filled-error',
			});
		}
	});
</script>

<div class="flex flex-col h-full">
	{#if datasetViewModel.selectedDataset}
		<!-- Search bar and filter button -->
		<div class="px-4 mb-2">
			<div class="flex gap-2">
				<div class="input-group grid-cols-[auto_1fr] flex-1">
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
				{#if filters.length === 0}
					<div class="flex flex-shrink-0 h-[2.25rem]">
						<button
							title="Filter cases by run print"
							aria-label="Filter cases by run print"
							class="btn-icon hover:variant-soft-primary rounded-full"
							onclick={addFilter}
						>
							<i class="fa-solid fa-filter"></i>
						</button>
					</div>
				{/if}
			</div>

			{#each filters as filter, i}
				<div class="mt-2">
					<div class="flex justify-between items-center gap-2">
						<input
							type="text"
							class="input p-1"
							placeholder="Run print label"
							bind:value={filter.label}
						/>
						<select class="input p-1 w-20" bind:value={filter.operation}>
							<option value=">">&gt;</option>
							<option value="<">&lt;</option>
							<option value=">=">&ge;</option>
							<option value="<=">&le;</option>
							<option value="=">=</option>
						</select>
						<input
							type="number"
							class="input p-1"
							placeholder="Run print value"
							bind:value={filter.value}
						/>
						<div class="flex flex-shrink-0 h-[2.25rem]">
							{#if i === filters.length - 1}
								<button
									title="Add filter"
									aria-label="Add filter"
									class="btn-icon hover:variant-soft-primary rounded-full h-9 w-9 flex items-center justify-center"
									onclick={() => addFilter()}
								>
									<i class="fa-solid fa-filter"></i>
								</button>
							{/if}
							<button
								title="Remove filter"
								aria-label="Remove filter"
								class="btn-icon hover:variant-soft-error rounded-full h-9 w-9 flex items-center justify-center"
								onclick={() => removeFilter(i)}
							>
								<i class="fa-solid fa-xmark"></i>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if caseViewModel.isLoading}
			<div class="flex-1 flex items-center justify-center">
				<ProgressRadial width="w-8" />
			</div>
		{:else}
			<!-- Content -->
			<div class="flex-1 overflow-y-auto space-y-0.5">
				{#if filteredCases.length > 0}
					{#each filteredCases as caseData (caseData.id)}
						{@const isSelected = caseViewModel.isSelected(caseData.path)}
						{@const isDisabled = !caseViewModel.canSelectMore && !isSelected}
						<ListButton
							selected={isSelected}
							disabled={isDisabled}
							showBadge={isSelected}
							badgeContent={caseViewModel.getSelectionIndex(caseData.path)}
							on:click={async () => await caseViewModel.toggleCase(caseData)}
						>
							{caseData.name}
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
