<script lang="ts">
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getToastStore } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();
	let searchQuery = $state('');

	interface Filter {
		label: string;
		operation: string;
		value: string;
	}
	let filters = $state<Filter[]>([]);

	// Filtered cases based on search query
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

	// Load datasets when component mounts
	$effect(() => {
		if (sessionViewModel.isWorkspaceSelected && !datasetViewModel.hasDatasets) {
			datasetViewModel.loadDatasets();
		}
	});

	const TRANSITION_DURATION = 200;
</script>

<div class="flex flex-col h-full">
	<!-- Fixed Header -->
	<header class="px-4 py-3 border-b border-surface-500/10 flex-none">
		<div class="flex items-center justify-between">
			<span class="text-xl font-bold tracking-wide text-primary-900-50-token dark:text-primary-400"
				>Browser</span
			>
			<div class="text-sm text-surface-600-300-token">
				{caseViewModel.selectedCases.length}/{caseViewModel.MAX_SELECTED_CASES} selected
			</div>
		</div>
	</header>

	<!-- Search and Filters Section -->
	{#if datasetViewModel.selectedDataset}
		<div class="px-4 py-2 border-b border-surface-500/10">
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
	{/if}

	<!-- Scrollable Navigation Tree -->
	<div class="flex-1 overflow-y-auto min-h-0">
		{#if datasetViewModel.isLoading}
			<div class="flex justify-center p-4">
				<i class="fa-solid fa-spinner fa-spin opacity-50"></i>
			</div>
		{:else if datasetViewModel.error}
			<div class="alert variant-filled-error m-2">
				{datasetViewModel.error}
			</div>
		{:else}
			<ul class="p-2 space-y-1">
				{#each datasetViewModel.datasets as dataset}
					<li>
						<!-- Dataset button -->
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

						<!-- Cases -->
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
												<li>
													<div class="flex items-center group">
														<!-- Case selection and toggle runs -->
														<button
															class="w-full text-left px-3 py-1.5 rounded-token transition-all duration-200 flex items-center min-w-0
																hover:bg-primary-500/30 hover:pl-4 group
																{caseViewModel.isSelected(case_.path)
																? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
																: 'text-surface-900-50-token'}"
															onclick={() => caseViewModel.toggleCase(case_)}
														>
															<i class="fa-solid fa-folder mr-2 opacity-70 flex-shrink-0"></i>
															<span class="truncate flex-1 font-medium">{case_.name}</span>
															{#if caseViewModel.isSelected(case_.path)}
																<div
																	class="badge badge-sm variant-filled-primary ml-2 flex-shrink-0"
																>
																	{caseViewModel.getSelectionIndex(case_.path)}
																</div>
															{:else}
																<i
																	class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
																		group-hover:opacity-50 group-hover:translate-x-0"
																></i>
															{/if}
														</button>
													</div>

													<!-- Runs -->
													{#if caseViewModel.isSelected(case_.path)}
														<div
															transition:slide|local={{
																duration: TRANSITION_DURATION,
																easing: quintOut,
															}}
														>
															<ul class="pl-6 space-y-0.5 mt-0.5">
																{#if runViewModel.getRunsForCase(case_.path).length === 0}
																	<li>
																		<div
																			class="px-3 py-1.5 text-sm opacity-50 flex items-center min-w-0"
																		>
																			<i class="fa-solid fa-circle-info mr-2 flex-shrink-0"></i>
																			<span class="truncate">No runs available</span>
																		</div>
																	</li>
																{:else}
																	{#each runViewModel.getRunsForCase(case_.path) as run}
																		<li>
																			<button
																				class="w-full text-left px-3 py-1.5 rounded-token transition-all duration-200 flex items-center min-w-0
																					hover:bg-surface-200-700-token hover:pl-4 group
																					{runViewModel.isRunSelected(run.id)
																					? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
																					: 'text-surface-900-50-token'}"
																				class:variant-filled-error={run.outputError}
																				onclick={() => runViewModel.toggleRun(run.id)}
																			>
																				<i
																					class="fa-solid mr-2 opacity-70 flex-shrink-0"
																					class:fa-circle-play={!run.outputError}
																					class:fa-circle-exclamation={run.outputError}
																				></i>
																				<span class="truncate flex-1 text-sm">Run {run.id}</span>
																				{#if !runViewModel.isRunSelected(run.id) && !run.outputError}
																					<i
																						class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
																						group-hover:opacity-50 group-hover:translate-x-0"
																					></i>
																				{/if}
																			</button>
																		</li>
																	{/each}
																{/if}
															</ul>
														</div>
													{/if}
												</li>
											{/each}
										</ul>
									{:else if searchQuery}
										<div class="px-3 py-3">
											<div class="rounded-token bg-surface-500/5 px-2">
												<div class="flex items-center gap-3 text-surface-600-300-token">
													<i class="fa-solid fa-filter-circle-xmark text-lg opacity-50"></i>
													<span class="text-sm">
														No cases found matching:<br />
														"<span class="font-medium text-surface-900-50-token">{searchQuery}</span
														>"
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
		{/if}
	</div>
</div>
