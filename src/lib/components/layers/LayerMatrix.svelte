<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import LayerTabs from './LayerTabs.svelte';
	import LayerMatrixHeader from './LayerMatrixHeader.svelte';
	import LayerMatrixRow from './LayerMatrixRow.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	const toastStore = getToastStore();

	// Get errors for this specific case
	const currentRunsWithErrors = $derived.by(() => {
		if (uiViewModel.state.layers.layerContext.type !== 'run') return [];
		const runId = uiViewModel.state.layers.layerContext.runId;
		if (!runId) return [];
		return runViewModel.getRunsWithErrors(runId);
	});

	// Get successful cases for the current run
	const availableCases = $derived.by(() => {
		if (uiViewModel.state.layers.layerContext.type !== 'run') return [];
		const runId = uiViewModel.state.layers.layerContext.runId;
		if (!runId) return [];
		return runViewModel.getSuccessfulCasesForRun(runId);
	});

	let errorsPanelExpanded = $state(true);

	// Watch for errors and show toast
	$effect(() => {
		const error = layerViewModel.error;
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
			{#if Object.keys(currentRunsWithErrors).length > 0}
				<div class="mt-2 mb-2 bg-error-500/20 rounded-lg">
					<button
						type="button"
						class="w-full flex items-center gap-2 p-2 cursor-pointer hover:bg-error-500/30 rounded-lg"
						onclick={() => (errorsPanelExpanded = !errorsPanelExpanded)}
					>
						<i class="fa-solid fa-triangle-exclamation text-error-500"></i>
						<span
							>Errors found in {Object.keys(currentRunsWithErrors).length}
							{Object.keys(currentRunsWithErrors).length === 1 ? 'case' : 'cases'}</span
						>
						<i class="fa-solid {errorsPanelExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} ml-auto"
						></i>
					</button>
					{#if errorsPanelExpanded}
						<div class="px-4 pb-2" transition:slide|local={{ duration: 200, easing: quintOut }}>
							{#each Object.entries(currentRunsWithErrors) as [caseId, run]}
								<div class="text-sm font-mono text-error-600 dark:text-error-400 mb-4 last:mb-0">
									<div class="font-bold text-error-700 dark:text-error-300 select-text">
										Case {caseId}:
									</div>
									<div class="pl-4 whitespace-pre-wrap select-text">
										{run.outputError}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if layerViewModel.uniqueLayersNames.length === 0}
				<div
					class="p-8 flex justify-center items-center text-center text-surface-600 dark:text-surface-400"
				>
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<i class="fa-solid fa-layer-group text-3xl"></i>
							<p>
								{#if uiViewModel.state.layers.layerContext.type === 'dataset'}
									No layers available. Try loading different cases to view their layers.
								{:else if availableCases.length > 0}
									No layers visible for the currently selected cases. <br />
									However, this run was successful for
									<span class="font-bold text-primary-500">{availableCases.length}</span>
									{availableCases.length === 1 ? 'case' : 'cases'}:
								{:else}
									No layers available for this run. Check if the run was successful and try loading
									different cases.
								{/if}
							</p>
						</div>

						{#if availableCases.length > 0}
							<div class="grid grid-cols-2 gap-2">
								{#each availableCases as case_}
									<button
										class="btn btn-sm variant-soft-primary truncate"
										title={case_.name}
										onclick={() => caseViewModel.selectCase(case_)}
									>
										<div class="w-full flex items-center">
											<i class="fa-solid fa-folder-open w-4 flex-none"></i>
											<span class="truncate ml-1">{case_.name}</span>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Transposed Layer Matrix Table -->
				<div class="flex-1 overflow-y-auto">
					<table class="w-full border-collapse">
						<LayerMatrixHeader />
						<tbody>
							{#each caseViewModel.selectedCases as case_}
								<LayerMatrixRow {case_} />
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
