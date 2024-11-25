<script lang="ts">
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerMatrixHeader from './LayerMatrixHeader.svelte';
	import LayerMatrixRow from './LayerMatrixRow.svelte';

	const toastStore = getToastStore();

	// Unique layers for the selected tab
	let uniqueLayers = $derived.by(() => {
		if (uiViewModel.bottomPanelTab === 'layers') {
			return layerViewModel.uniqueLayersIds;
		}
		const runIndex = parseInt(uiViewModel.bottomPanelTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runViewModel.uniqueLayerIdsByRun(runIndex);
	});

	// Layer state based on the bottom panel tab
	const layerState = $derived(
		uiViewModel.bottomPanelTab === 'layers'
			? layerViewModel
			: runViewModel.layerStates[uiViewModel.bottomPanelRunIndex]
	);

	// Get errors for this specific case
	const currentRunsWithErrors = $derived.by(() => {
		if (uiViewModel.bottomPanelRunIndex === -1) return [];
		if (!runViewModel.history[uiViewModel.bottomPanelRunIndex]) return [];
		return runViewModel.history[uiViewModel.bottomPanelRunIndex].filter((run) => run.outputError);
	});

	const isRunView = $derived.by(() => uiViewModel.bottomPanelRunIndex !== -1);
	let errorsPanelExpanded = $state(true);

	// Watch for errors and show toast
	$effect(() => {
		const error = layerViewModel.currentError;
		if (error) {
			toastStore.trigger({
				message: error,
				background: 'variant-filled-error',
			});
		}
	});
</script>

<div class="bg-surface-100-800-token rounded-lg h-full flex flex-col">
	<div class="flex-none">
		<LayerTabs />
	</div>

	<div class="flex-1 overflow-y-auto min-h-0">
		<div class="px-4 pt-2 relative h-full flex flex-col">
			<!-- Output of the current run -->
			{#if currentRunsWithErrors.length > 0}
				<div class="mt-2 mb-2 bg-error-500/20 rounded-lg">
					<button
						type="button"
						class="w-full flex items-center gap-2 p-2 cursor-pointer hover:bg-error-500/30 rounded-lg"
						onclick={() => (errorsPanelExpanded = !errorsPanelExpanded)}
					>
						<i class="fa-solid fa-triangle-exclamation text-error-500"></i>
						<span
							>Errors found in {currentRunsWithErrors.length}
							{currentRunsWithErrors.length === 1 ? 'case' : 'cases'}</span
						>
						<i class="fa-solid {errorsPanelExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} ml-auto"
						></i>
					</button>
					{#if errorsPanelExpanded}
						<div class="px-4 pb-2">
							{#each currentRunsWithErrors as run}
								<div class="text-sm font-mono text-error-600 dark:text-error-400 mb-4 last:mb-0">
									<div class="font-bold text-error-700 dark:text-error-300">
										Case {run.case.id}:
									</div>
									<div class="pl-4 whitespace-pre-wrap">
										{run.outputError}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if uniqueLayers.length === 0}
				<div
					class="p-8 flex justify-center items-center text-center text-surface-600 dark:text-surface-400"
				>
					<div class="flex flex-col gap-2">
						<i class="fa-solid fa-layer-group text-3xl"></i>
						<p>
							{uiViewModel.bottomPanelRunIndex !== -1
								? 'No layers available for this run. Check if the run was successful and try loading different cases.'
								: 'No layers available. Try loading different cases to view their layers.'}
						</p>
					</div>
				</div>
			{:else}
				<!-- Transposed Layer Matrix Table -->
				<div class="flex-1 overflow-y-auto">
					<table class="w-full border-collapse">
						<LayerMatrixHeader {uniqueLayers} {layerState} />
						<tbody>
							{#each caseViewModel.selectedCases as case_, index}
								<LayerMatrixRow {case_} {index} {uniqueLayers} {layerState} {isRunView} />
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
