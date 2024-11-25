<script lang="ts">
	import NiivueViewer from '$lib/components/viewers/NiivueViewer.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	// Add state for tracking which case is in fullscreen mode
	let fullscreenCaseId = $state<string | null>(null);
	let lastNumberOfOpenedCases = 0;

	$effect(() => {
		if (caseViewModel.selectedCases.length === 1) {
			fullscreenCaseId = caseViewModel.selectedCases[0]?.id;
		} else if (caseViewModel.selectedCases.length === 2 && lastNumberOfOpenedCases === 1) {
			fullscreenCaseId = null;
		}
		lastNumberOfOpenedCases = caseViewModel.selectedCases.length;
	});

	// Compute grid layout based on number of selected cases
	const gridClass = $derived(
		fullscreenCaseId
			? 'w-full h-full'
			: `grid gap-4 ${
					caseViewModel.selectedCases.length <= 1
						? 'grid-cols-1'
						: caseViewModel.selectedCases.length === 2
							? 'grid-cols-2'
							: caseViewModel.selectedCases.length === 3
								? 'md:grid-cols-2 lg:grid-cols-3'
								: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
				}`
	);
</script>

<div class="h-full w-full p-8 overflow-auto">
	<section class={gridClass}>
		{#each caseViewModel.selectedCases as case_ (case_.id)}
			<div
				class="card flex flex-col bg-surface-100-800-token hover:bg-primary-50-900-token transition-all duration-200
					{fullscreenCaseId === case_.id ? 'w-full h-full min-h-0' : ''}"
				style:display={fullscreenCaseId && fullscreenCaseId !== case_.id ? 'none' : 'flex'}
			>
				<div
					class="p-2 border-b border-surface-300-600-token flex justify-between items-center w-full overflow-hidden"
				>
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
					<div class="flex gap-1">
						{#if caseViewModel.selectedCases.length > 1}
							<button
								class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-300-600-token transition-colors"
								onclick={() => (fullscreenCaseId = fullscreenCaseId === case_.id ? null : case_.id)}
								title={fullscreenCaseId === case_.id ? 'Exit full screen' : 'View full screen'}
								aria-label={fullscreenCaseId === case_.id ? 'Exit full screen' : 'View full screen'}
							>
								<i class="fa-solid {fullscreenCaseId === case_.id ? 'fa-compress' : 'fa-expand'}"
								></i>
							</button>
						{/if}
						<button
							class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-300-600-token transition-colors"
							onclick={() => caseViewModel.deselectCase(case_)}
							title="Close case"
							aria-label="Close case"
						>
							<i class="fa-solid fa-xmark"></i>
						</button>
					</div>
				</div>
				<div class="relative {fullscreenCaseId === case_.id ? 'h-full' : 'aspect-square'}">
					<div class="absolute inset-0">
						{#if layerViewModel.selectedLayersForCase(case_.id).length > 0 || runViewModel.selectedLayersForCase(case_.id).length > 0}
							<NiivueViewer {case_} />
						{:else}
							<div
								class="w-full h-full variant-soft-surface flex flex-col items-center justify-center gap-1 p-2 overflow-hidden"
								style:display={fullscreenCaseId && fullscreenCaseId !== case_.id ? 'none' : 'flex'}
							>
								<i class="fa-solid fa-layer-group text-xl sm:text-4xl text-surface-400-500-token"
								></i>
								<div
									class="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-surface-600-300-token text-center"
									style:display={fullscreenCaseId && fullscreenCaseId !== case_.id
										? 'none'
										: 'flex'}
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
			</div>
		{/each}
	</section>
</div>
