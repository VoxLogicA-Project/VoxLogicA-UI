<script lang="ts">
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import BrowserHeader from './BrowserHeader.svelte';
	import SearchAndFilters from './SearchAndFilters.svelte';
	import DatasetList from './DatasetList.svelte';

	let searchQuery = $state('');
	let hadFilters = $state(false);

	// Filtered cases based on search query and run print filters
	const filteredCases = $derived.by(() => {
		// First filter by search query
		const searchFiltered = searchQuery
			? caseViewModel.cases.filter((caseData) =>
					caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: caseViewModel.cases;

		// Then filter by run print filters if any exist
		const validFilters = runViewModel.printFilters.filter((f) => f.label.trim() && f.value.trim());
		if (validFilters.length === 0) {
			return searchFiltered;
		}

		// Only return cases that have at least one matching run
		return searchFiltered.filter((case_) => {
			const caseRuns = runViewModel.getRunsForCase(case_.path);
			return caseRuns.length > 0;
		});
	});

	// Track which datasets should be expanded based on search/filter results
	const datasetsWithResults = $derived.by(() => {
		if (!filteredCases.length) return new Set();

		return new Set(
			filteredCases
				.map(
					(case_) =>
						datasetViewModel.datasets.find((d) =>
							caseViewModel.casesOfDataset(d.name).includes(case_)
						)?.name
				)
				.filter(Boolean)
		);
	});

	// Update dataset expansion when search results change
	$effect(() => {
		const hasActiveSearch = searchQuery.trim() !== '';
		const hasActiveFilters = runViewModel.printFilters.some(
			(f) => f.label.trim() && f.value.trim()
		);

		// Only force-select datasets when there's an active search or filter
		if (datasetsWithResults.size > 0 && (hasActiveSearch || hasActiveFilters)) {
			// Get currently selected datasets that have results
			const selectedWithResults = new Set(
				datasetViewModel.datasets
					.filter((d) => datasetViewModel.isSelected(d) && datasetsWithResults.has(d.name))
					.map((d) => d.name)
			);

			// Only select datasets that aren't already selected
			datasetViewModel.datasets
				.filter((d) => datasetsWithResults.has(d.name) && !selectedWithResults.has(d.name))
				.forEach((d) => {
					datasetViewModel.selectDataset(d);
				});
		}
	});

	// Load datasets when component mounts
	$effect(() => {
		if (sessionViewModel.isWorkspaceSelected && !datasetViewModel.hasDatasets) {
			datasetViewModel.loadDatasets();
		}
	});

	// Helper function to compare sets
	function setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
		return a.size === b.size && [...a].every((value) => b.has(value));
	}

	// Update expansion/visibility of items based on filters
	$effect(() => {
		const validFilters = runViewModel.printFilters.filter((f) => f.label.trim() && f.value.trim());

		if (validFilters.length > 0) {
			hadFilters = true;
			// Get cases with matching runs
			const casesWithMatches = new Set(
				filteredCases
					.filter((case_) => runViewModel.getRunsForCase(case_.path).length)
					.map((case_) => case_.path)
			);

			// Update expanded case paths
			const newPaths = new Set([
				...casesWithMatches,
				...Array.from(uiViewModel.expandedCasePaths).filter(
					(path) => caseViewModel.isSelected(path) || casesWithMatches.has(path)
				),
			]);

			// Only update if changed
			if (!setsAreEqual(newPaths, uiViewModel.expandedCasePaths)) {
				uiViewModel.expandedCasePaths = newPaths;
			}

			// Update expanded run IDs
			const newRunIds = new Set([
				...uiViewModel.expandedRunIds,
				...Array.from(casesWithMatches)
					.flatMap((casePath) => runViewModel.getRunsForCase(casePath))
					.map((run) => run.id),
			]);

			if (!setsAreEqual(newRunIds, uiViewModel.expandedRunIds)) {
				uiViewModel.expandedRunIds = newRunIds;
			}
		} else if (hadFilters) {
			// Reset expansions only when transitioning from having filters to no filters
			hadFilters = false;

			// Keep expanded only selected cases
			const newPaths = new Set(
				Array.from(uiViewModel.expandedCasePaths).filter((path) => caseViewModel.isSelected(path))
			);
			if (!setsAreEqual(newPaths, uiViewModel.expandedCasePaths)) {
				uiViewModel.expandedCasePaths = newPaths;
			}

			// Keep expanded only selected runs
			const newRunIds = new Set(
				Array.from(uiViewModel.expandedRunIds).filter((id) => runViewModel.isRunSelected(id))
			);
			if (!setsAreEqual(newRunIds, uiViewModel.expandedRunIds)) {
				uiViewModel.expandedRunIds = newRunIds;
			}
		}
	});
</script>

<div class="flex flex-col h-full">
	<BrowserHeader />
	<SearchAndFilters bind:searchQuery />

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
			<DatasetList {searchQuery} {filteredCases} />
		{/if}
	</div>
</div>
