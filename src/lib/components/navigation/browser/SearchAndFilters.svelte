<script lang="ts">
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	let { searchQuery = $bindable('') } = $props();

	function addFilter() {
		runViewModel.addPrintFilter({ label: '', operation: '>', value: '' });
	}

	function removeFilter(index: number) {
		runViewModel.removePrintFilter(index);
	}
</script>

<div class="pl-4 py-2 border-b border-surface-500/10">
	<div class="flex gap-1 pr-4">
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
		{#if runViewModel.printFilters.length === 0}
			<div class="flex flex-shrink-0 h-[2.25rem]">
				<button
					title="Filter cases by run print"
					aria-label="Filter cases by run print"
					class="btn-icon hover:variant-soft-primary rounded-full h-8 w-8 flex items-center justify-center"
					onclick={addFilter}
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
						<input
							type="text"
							name={`filter-label-${i}`}
							class="input p-1"
							placeholder="Run print label"
							value={filter.label}
							oninput={(e) => runViewModel.updatePrintFilter(i, { label: e.currentTarget.value })}
						/>
						<select
							name={`filter-operation-${i}`}
							class="input p-1 w-20"
							value={filter.operation}
							onchange={(e) =>
								runViewModel.updatePrintFilter(i, { operation: e.currentTarget.value })}
						>
							<option value=">">&gt;</option>
							<option value="<">&lt;</option>
							<option value=">=">&ge;</option>
							<option value="<=">&le;</option>
							<option value="=">=</option>
						</select>
						<input
							type="number"
							name={`filter-value-${i}`}
							class="input p-1"
							placeholder="Run print value"
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
