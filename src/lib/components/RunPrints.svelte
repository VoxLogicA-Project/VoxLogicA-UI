<script lang="ts">
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import type { PrintOutput } from '$lib/models/types';

	let { activeTab } = $props<{ activeTab: string }>();

	// Get prints for the current run
	const prints = $derived.by(() => {
		if (activeTab === 'layers') return [];
		const runIndex = parseInt(activeTab.split('-')[1]);
		if (isNaN(runIndex)) return [];
		return runViewModel.history[runIndex]?.map((run) => ({
			caseId: run.case.id,
			prints: run.outputPrint,
			error: run.outputError,
		}));
	});

	let isExpanded = $state(false);

	function formatPrint(print: PrintOutput): string {
		if (print.vltype === 'number' || print.vltype === 'string') {
			return `${print.name}: ${print.value}`;
		}
		return `${print.name}: [${print.vltype}] ${print.value}`;
	}
</script>

<div class="p-4 border-t border-b border-surface-500/30">
	<button
		class="w-full p-2 bg-surface-200-700-token flex items-center justify-between"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<span class="text-sm font-medium flex items-center gap-2">
			<i class="fa-solid fa-terminal text-surface-600-300-token"></i>
			Run Output
		</span>
		<i class="fa-solid {isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
	</button>

	{#if isExpanded && prints.length > 0}
		<div class="p-4 space-y-4">
			{#each prints as { caseId, prints: casePrints, error }}
				<div>
					<h3 class="text-sm font-medium mb-2">Case: {caseId}</h3>
					{#if error}
						<div class="bg-error-500/20 p-3 rounded text-sm font-mono whitespace-pre-wrap">
							{error}
						</div>
					{:else if casePrints.length > 0}
						<div class="bg-surface-200-700-token/50 px-3 rounded text-sm font-mono">
							{#each casePrints as print}
								<div>{formatPrint(print)}</div>
							{/each}
						</div>
					{:else}
						<div class="text-surface-600-300-token text-sm italic">No output</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
