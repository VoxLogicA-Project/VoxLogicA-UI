<script lang="ts">
	import NiivueViewer from './NiivueViewer.svelte';
	import { mainStore } from '$lib/stores/mainStore';
	import { caseStore } from '$lib/stores/caseStore';

	// Compute grid layout based on number of selected cases
	$: gridClass =
		$mainStore.cases.selected.length <= 1
			? 'grid-cols-1 max-w-4xl mx-auto'
			: $mainStore.cases.selected.length === 2
				? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
				: $mainStore.cases.selected.length === 3
					? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
</script>

<div class="h-full p-8">
	<section class={`grid gap-4 ${gridClass} pb-8`}>
		{#each $mainStore.cases.selected as case_ (case_.id)}
			<div class="card h-fit">
				<div
					class="p-2 border-b border-surface-300-600-token bg-surface-100-800-token flex justify-between items-center"
				>
					<span class="text-sm font-medium">{case_.id}</span>
					<button
						class="w-6 h-6 flex items-center justify-center rounded
                        hover:bg-surface-300-600-token transition-colors"
						on:click={() => caseStore.deselectCase(case_)}
						title="Close case"
					>
						<i class="fa-solid fa-xmark" />
					</button>
				</div>
				<div class="aspect-square">
					<NiivueViewer {case_} />
				</div>
			</div>
		{/each}
	</section>
</div>
