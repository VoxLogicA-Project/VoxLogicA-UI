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

	// Filtered cases based on search query across all selected datasets
	const filteredCases = $derived(
		searchQuery
			? caseViewModel.cases.filter((caseData) =>
					caseData.id.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: caseViewModel.cases
	);

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
