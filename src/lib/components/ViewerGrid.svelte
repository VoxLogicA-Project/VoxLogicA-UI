<script lang="ts">
	import NiivueViewer from './NiivueViewer.svelte';
	import { datasetStore } from '$lib/viewmodels/datasetStore';

	$: gridClass =
		$datasetStore.selectedCases.length === 1
			? 'grid-cols-1 max-w-4xl mx-auto'
			: $datasetStore.selectedCases.length == 2
				? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
				: $datasetStore.selectedCases.length == 3
					? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
</script>

<div class="h-full p-8">
	<section class={`grid gap-4 ${gridClass} pb-8`}>
		{#each $datasetStore.selectedCases as case_ (case_.id)}
			<div class="card h-fit">
				<div class="p-2 border-b border-surface-300-600-token bg-surface-100-800-token">
					<span class="text-sm font-medium">{case_.id}</span>
				</div>
				<div class="aspect-square">
					<NiivueViewer {case_} />
				</div>
			</div>
		{/each}
	</section>
</div>
