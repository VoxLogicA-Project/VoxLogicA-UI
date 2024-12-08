<script lang="ts">
	import ViewerWindow from '$lib/components/viewers/ViewerWindow.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';

	// Automatic fullscreen mode when only one case is selected
	let lastNumberOfOpenedCases = 0;
	$effect(() => {
		const selectedCount = caseViewModel.selectedCases.length;

		if (selectedCount === 1) {
			uiViewModel.state.viewers.fullscreenCasePath = caseViewModel.selectedCases[0].path;
		} else if (selectedCount === 2 && lastNumberOfOpenedCases === 1) {
			uiViewModel.state.viewers.fullscreenCasePath = null;
		}

		lastNumberOfOpenedCases = selectedCount;
	});

	// Compute grid layout based on number of selected cases
	const gridClass = $derived(
		uiViewModel.state.viewers.fullscreenCasePath
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

	// Navigation functions
	function navigateFullscreen(direction: 'prev' | 'next') {
		const currentPath = uiViewModel.state.viewers.fullscreenCasePath;
		if (!currentPath) return;

		const currentIndex = caseViewModel.selectedCases.findIndex((c) => c.path === currentPath);
		if (currentIndex === -1) return;

		let newIndex =
			direction === 'next'
				? (currentIndex + 1) % caseViewModel.selectedCases.length
				: (currentIndex - 1 + caseViewModel.selectedCases.length) %
					caseViewModel.selectedCases.length;

		uiViewModel.state.viewers.fullscreenCasePath = caseViewModel.selectedCases[newIndex].path;
	}

	// Show navigation controls only when in fullscreen and multiple cases are selected
	const showNavigation = $derived(
		uiViewModel.state.viewers.fullscreenCasePath && caseViewModel.selectedCases.length > 1
	);
</script>

<div class="h-full w-full relative">
	<section class="{gridClass} p-8">
		{#each caseViewModel.selectedCases as case_}
			<ViewerWindow {case_} />
		{/each}
	</section>

	{#if showNavigation}
		<div class="absolute bottom-1 right-8 flex gap-2">
			<button
				class="btn-icon variant-soft-surface w-6 h-6 rounded hover:variant-soft-primary transition-colors"
				onclick={() => navigateFullscreen('prev')}
				title="Previous case"
				aria-label="View previous case"
			>
				<i class="fa-solid fa-chevron-left"></i>
			</button>
			<button
				class="btn-icon variant-soft-surface w-6 h-6 rounded hover:variant-soft-primary transition-colors"
				onclick={() => navigateFullscreen('next')}
				title="Next case"
				aria-label="View next case"
			>
				<i class="fa-solid fa-chevron-right"></i>
			</button>
		</div>
	{/if}
</div>
