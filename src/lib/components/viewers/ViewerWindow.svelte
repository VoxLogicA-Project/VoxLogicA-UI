<script lang="ts">
	import NiivueViewer from '$lib/components/viewers/NiivueViewer.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import type { Case } from '$lib/models/types';

	const { case_ } = $props<{ case_: Case }>();
	let niivueViewerRef: ReturnType<typeof NiivueViewer> | null = $state(null);

	function handleDrop(state: DragDropState<Case>) {
		const { sourceContainer, targetContainer } = state;

		if (!targetContainer) {
			return;
		}

		const sourceIndex = parseInt(sourceContainer) - 1;
		const targetIndex = parseInt(targetContainer) - 1;

		if (isNaN(sourceIndex) || isNaN(targetIndex)) {
			return;
		}

		caseViewModel.swapCases(sourceIndex, targetIndex);
	}
</script>

<div
	class="card flex flex-col bg-surface-100-800-token hover:bg-primary-50-900-token transition-all duration-200
        {uiViewModel.state.viewers.fullscreenCasePath === case_.path ? 'w-full h-full min-h-0' : ''}
		svelte-dnd-touch-feedback"
	style:display={uiViewModel.state.viewers.fullscreenCasePath &&
	uiViewModel.state.viewers.fullscreenCasePath !== case_.path
		? 'none'
		: 'flex'}
	use:droppable={{
		container: caseViewModel.getSelectionIndex(case_.path).toString(),
		callbacks: { onDrop: handleDrop },
	}}
>
	<div
		class="p-2 border-b border-surface-300-600-token flex justify-between items-center w-full overflow-hidden"
	>
		<span
			class="text-sm font-medium flex items-center flex-1 min-w-0 cursor-grab"
			use:draggable={{
				container: caseViewModel.getSelectionIndex(case_.path).toString(),
				dragData: case_,
				disabled: uiViewModel.state.viewers.fullscreenCasePath !== null,
			}}
		>
			{#if true}
				<div class="badge badge-sm variant-filled-primary mr-2 flex-shrink-0">
					{caseViewModel.getSelectionIndex(case_.path)}
				</div>
			{/if}
			<span class="truncate">
				{case_.name}
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
                        {uiViewModel.state.viewers.fullscreenCasePath === case_.path
							? 'bg-primary-500 text-white hover:bg-primary-600'
							: 'hover:bg-surface-300-600-token'}"
						onclick={() =>
							(uiViewModel.state.viewers.fullscreenCasePath =
								uiViewModel.state.viewers.fullscreenCasePath === case_.path ? null : case_.path)}
						title={uiViewModel.state.viewers.fullscreenCasePath === case_.path
							? 'Exit full screen'
							: 'View full screen'}
						aria-label={uiViewModel.state.viewers.fullscreenCasePath === case_.path
							? 'Exit full screen'
							: 'View full screen'}
					>
						<i
							class="fa-solid {uiViewModel.state.viewers.fullscreenCasePath === case_.path
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
	<div
		class="relative {uiViewModel.state.viewers.fullscreenCasePath === case_.path
			? 'h-full'
			: 'aspect-square'}"
	>
		<div class="absolute inset-0">
			{#if layerViewModel.getAllSelectedLayersNoContext(case_.path).length > 0}
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
