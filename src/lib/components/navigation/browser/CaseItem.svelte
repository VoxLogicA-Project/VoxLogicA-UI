<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Case } from '$lib/models/types';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import RunItem from './RunItem.svelte';

	let { case_ }: { case_: Case } = $props();

	const TRANSITION_DURATION = 200;
</script>

<li>
	<div class="flex items-center group">
		<button
			class="w-full text-left px-3 py-1.5 rounded-token transition-all duration-200 flex items-center min-w-0
				{caseViewModel.isSelected(case_.path)
				? 'bg-primary-500/10 text-primary-700 dark:text-primary-400 hover:bg-primary-500/30 hover:pl-4'
				: caseViewModel.canSelectMore
					? 'text-surface-900-50-token hover:bg-primary-500/30 hover:pl-4'
					: 'text-surface-900-50-token opacity-50 cursor-not-allowed'}"
			onclick={() => caseViewModel.toggleCase(case_)}
			disabled={!caseViewModel.canSelectMore && !caseViewModel.isSelected(case_.path)}
			title={caseViewModel.isSelected(case_.path)
				? `Unselect case "${case_.name}"`
				: caseViewModel.canSelectMore
					? `Select case "${case_.name}"`
					: `Cannot select more than ${caseViewModel.MAX_SELECTED_CASES} cases`}
		>
			<i class="fa-solid fa-folder mr-2 opacity-70 flex-shrink-0"></i>
			<span class="truncate flex-1 font-medium">{case_.name}</span>
			{#if caseViewModel.isSelected(case_.path)}
				<div class="badge badge-sm variant-filled-primary ml-2 flex-shrink-0">
					{caseViewModel.getSelectionIndex(case_.path)}
				</div>
			{/if}
		</button>
	</div>

	{#if uiViewModel.expandedCasePaths.has(case_.path) || caseViewModel.isSelected(case_.path)}
		<div transition:slide|local={{ duration: TRANSITION_DURATION, easing: quintOut }}>
			<ul class="pl-6 space-y-0.5 mt-0.5">
				{#if runViewModel.getRunsForCase(case_.path).length === 0}
					<li>
						<div
							class="px-3 py-1.5 text-sm opacity-50 flex items-center min-w-0 text-surface-900-50-token"
						>
							<i class="fa-solid fa-circle-info mr-2 flex-shrink-0"></i>
							<span class="truncate">No runs available</span>
						</div>
					</li>
				{:else}
					{#each runViewModel.getRunsForCase(case_.path) as run}
						<li>
							<RunItem {run} />
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}
</li>
