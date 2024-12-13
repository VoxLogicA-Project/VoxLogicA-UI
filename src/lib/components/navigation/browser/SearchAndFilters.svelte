<script lang="ts">
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	let { searchQuery = $bindable('') } = $props();

	function addFilter() {
		runViewModel.addPrintFilter({
			label: runViewModel.uniquePrintLabels[0] || '',
			operation: '>',
			value: '',
		});
	}

	function removeFilter(index: number) {
		runViewModel.removePrintFilter(index);
	}
</script>

<div class="pl-4 py-2 border-b border-surface-500/10">
	<div class="flex gap-1 {runViewModel.printFilters.length > 0 ? 'pr-4' : ''}">
		<div class="input-group grid-cols-[auto_1fr] flex-1 h-8">
			<div class="input-group-shim flex items-center">
				<i class="fa-solid fa-search"></i>
			</div>
			<input
				name="search_cases"
				class="h-full"
				type="search"
				placeholder="Search cases..."
				bind:value={searchQuery}
			/>
		</div>
		{#if runViewModel.printFilters.length === 0}
			<div class="flex flex-shrink-0">
				<button
					title="Filter cases by run print"
					aria-label="Filter cases by run print"
					class="btn-icon hover:variant-soft-primary rounded-full h-8 w-8 flex items-center justify-center"
					onclick={addFilter}
					disabled={runViewModel.uniquePrintLabels.length === 0}
				>
					<i class="fa-solid fa-filter"></i>
				</button>
			</div>
		{/if}
	</div>

	{#if runViewModel.printFilters.length > 0}
		<div class="mt-2 max-h-[200px] overflow-y-auto">
			{#each runViewModel.printFilters as filter, i}
				<div class="mt-2">
					<div class="grid grid-cols-[1fr_auto_1fr_auto] gap-1 items-center">
						<select
							name={`filter-label-${i}`}
							class="select p-1"
							value={filter.label}
							onchange={(e) => runViewModel.updatePrintFilter(i, { label: e.currentTarget.value })}
							title="Select the print metric to filter by"
						>
							{#each runViewModel.uniquePrintLabels as label}
								<option value={label}>{label}</option>
							{/each}
						</select>
						<select
							name={`filter-operation-${i}`}
							class="select p-1 w-20"
							value={filter.operation}
							onchange={(e) =>
								runViewModel.updatePrintFilter(i, { operation: e.currentTarget.value })}
							title="Choose how to compare the values"
						>
							<option value=">" title="Greater than">&gt;</option>
							<option value="<" title="Less than">&lt;</option>
							<option value=">=" title="Greater than or equal to">&ge;</option>
							<option value="<=" title="Less than or equal to">&le;</option>
							<option value="=" title="Equal to">=</option>
						</select>
						<input
							type="number"
							name={`filter-value-${i}`}
							class="input p-1"
							placeholder={`Value`}
							title={`Enter a numeric value to compare ${filter.label} against`}
							value={filter.value}
							oninput={(e) => runViewModel.updatePrintFilter(i, { value: e.currentTarget.value })}
						/>
						<div class="flex items-center">
							<button
								title="Remove filter"
								aria-label="Remove filter"
								class="btn-icon hover:variant-soft-error rounded-full h-8 w-8 flex items-center justify-center"
								onclick={() => removeFilter(i)}
							>
								<i class="fa-solid fa-xmark text-sm"></i>
							</button>
							{#if i === runViewModel.printFilters.length - 1}
								<button
									title="Add filter"
									aria-label="Add filter"
									class="btn-icon hover:variant-soft-primary rounded-full h-8 w-8 flex items-center justify-center"
									onclick={addFilter}
								>
									<i class="fa-solid fa-filter text-sm"></i>
								</button>
							{:else}
								<div class="w-8"></div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
