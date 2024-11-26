<script lang="ts">
	import NiivueViewer from '$lib/components/viewers/NiivueViewer.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import type { Case } from '$lib/models/types';

	const { case_ } = $props<{ case_: Case }>();
	let niivueViewerRef: ReturnType<typeof NiivueViewer> | null = $state(null);
</script>

<div
	class="card flex flex-col bg-surface-100-800-token hover:bg-primary-50-900-token transition-all duration-200
        {uiViewModel.fullscreenCaseId === case_.id ? 'w-full h-full min-h-0' : ''}"
	style:display={uiViewModel.fullscreenCaseId && uiViewModel.fullscreenCaseId !== case_.id
		? 'none'
		: 'flex'}
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
			<!-- Screenshot button -->
			{#if niivueViewerRef}
				<button
					class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-300-600-token transition-colors"
					onclick={() => niivueViewerRef?.saveScreenshot()}
					title="Save screenshot"
					aria-label="Save screenshot"
				>
					<i class="fa-solid fa-camera"></i>
				</button>
				{#if caseViewModel.selectedCases.length > 1}
					<button
						class="w-6 h-6 flex items-center justify-center rounded transition-colors
                        {uiViewModel.fullscreenCaseId === case_.id
							? 'bg-primary-500 text-white hover:bg-primary-600'
							: 'hover:bg-surface-300-600-token'}"
						onclick={() =>
							(uiViewModel.fullscreenCaseId =
								uiViewModel.fullscreenCaseId === case_.id ? null : case_.id)}
						title={uiViewModel.fullscreenCaseId === case_.id
							? 'Exit full screen'
							: 'View full screen'}
						aria-label={uiViewModel.fullscreenCaseId === case_.id
							? 'Exit full screen'
							: 'View full screen'}
					>
						<i
							class="fa-solid {uiViewModel.fullscreenCaseId === case_.id
								? 'fa-compress'
								: 'fa-expand'}"
						></i>
					</button>
				{/if}
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
	<div class="relative {uiViewModel.fullscreenCaseId === case_.id ? 'h-full' : 'aspect-square'}">
		<div class="absolute inset-0">
			{#if layerViewModel.selectedLayersForCase(case_.id).length > 0 || runViewModel.selectedLayersForCase(case_.id).length > 0}
				<NiivueViewer {case_} bind:this={niivueViewerRef} />
			{:else}
				<div
					class="w-full h-full variant-soft-surface flex flex-col items-center justify-center gap-1 p-2 overflow-hidden"
				>
					<i class="fa-solid fa-layer-group text-xl sm:text-4xl text-surface-400-500-token"></i>
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
</div>
