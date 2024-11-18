<script lang="ts">
	import NiivueViewer from './NiivueViewer.svelte';
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import { caseOperations } from '$lib/modelviews/caseOperations.svelte';

	// Compute grid layout based on number of selected cases
	const gridClass = $derived(
		mainState.cases.selected.length <= 1
			? 'grid-cols-1 max-w-4xl mx-auto'
			: mainState.cases.selected.length === 2
				? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
				: mainState.cases.selected.length === 3
					? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
	);
</script>

<div class="h-full p-8">
	<section class={`grid gap-4 ${gridClass} pb-8`}>
		{#each mainState.cases.selected as case_ (case_.id)}
			<div class="card h-fit">
				<div
					class="p-2 border-b border-surface-300-600-token bg-surface-100-800-token flex justify-between items-center"
				>
					<span class="text-sm font-medium flex items-center flex-1 min-w-0">
						{#if true}
							<div class="badge badge-sm variant-filled-primary mr-2 flex-shrink-0">
								{mainState.cases.selected.findIndex((c) => c.id === case_.id) + 1}
							</div>
						{/if}
						<span class="truncate">
							{case_.id}
						</span>
					</span>
					<button
						class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-300-600-token transition-colors"
						onclick={() => caseOperations.deselectCase(case_)}
						title="Close case"
						aria-label="Close case"
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</div>
				<div class="aspect-square">
					{#if mainState.layers.selected[case_.id]?.length > 0}
						<NiivueViewer {case_} />
					{:else}
						<div
							class="w-full h-full variant-soft-surface flex flex-col items-center justify-center gap-2"
						>
							<i class="fa-solid fa-layer-group text-4xl text-surface-400-500-token"></i>
							<p class="text-sm text-surface-400-500-token text-center px-4">
								Add layers to this case to view images
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</section>
</div>
