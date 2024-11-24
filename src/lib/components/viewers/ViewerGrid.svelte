<script lang="ts">
	import NiivueViewer from '$lib/components/viewers/NiivueViewer.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	// Compute grid layout based on number of selected cases
	const gridClass = $derived(
		caseViewModel.selectedCases.length <= 1
			? 'grid-cols-1 max-w-4xl mx-auto'
			: caseViewModel.selectedCases.length === 2
				? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
				: caseViewModel.selectedCases.length === 3
					? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
	);
</script>

<div class="h-full p-8">
	{#if layerViewModel.isLoading}
		<div class="flex justify-center p-8">
			<ProgressRadial width="w-8" />
		</div>
	{:else}
		<section class={`grid gap-4 ${gridClass} pb-8`}>
			{#each caseViewModel.selectedCases as case_ (case_.id)}
				<div
					class="card h-fit transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-surface-500/30 bg-surface-100-800-token hover:bg-primary-50-900-token"
				>
					<div class="p-2 border-b border-surface-300-600-token flex justify-between items-center">
						<span class="text-sm font-medium flex items-center flex-1 min-w-0">
							{#if true}
								<div class="badge badge-sm variant-filled-primary mr-2 flex-shrink-0">
									{caseViewModel.getSelectionIndex(case_) + 1}
								</div>
							{/if}
							<span class="truncate">
								{case_.id}
							</span>
						</span>
						<button
							class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-300-600-token transition-colors"
							onclick={() => caseViewModel.deselectCase(case_)}
							title="Close case"
							aria-label="Close case"
						>
							<i class="fa-solid fa-xmark"></i>
						</button>
					</div>
					<div class="aspect-square">
						{#if layerViewModel.selectedLayersForCase(case_.id).length > 0 || runViewModel.selectedLayersForCase(case_.id).length > 0}
							<NiivueViewer {case_} />
						{:else}
							<div
								class="w-full h-full variant-soft-surface flex flex-col items-center justify-center gap-1 p-2 overflow-hidden"
							>
								<i class="fa-solid fa-layer-group text-xl sm:text-4xl text-surface-400-500-token"
								></i>
								<div
									class="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-surface-600-300-token text-center"
								>
									<p class="text-[8px] sm:text-base line-clamp-3">
										Add layers from the below panel to view images
									</p>
									<i class="fa-solid fa-arrow-down text-base sm:text-2xl animate-pulse"></i>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</section>
	{/if}
</div>
