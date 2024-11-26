<script lang="ts">
	import ViewerWindow from '$lib/components/viewers/ViewerWindow.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';

	// Automatic fullscreen mode when only one case is selected
	let lastNumberOfOpenedCases = 0;
	$effect(() => {
		const selectedCount = caseViewModel.selectedCases.length;

		if (selectedCount === 1) {
			uiViewModel.fullscreenCaseId = caseViewModel.selectedCases[0].id;
		} else if (selectedCount === 2 && lastNumberOfOpenedCases === 1) {
			uiViewModel.fullscreenCaseId = null;
		}

		lastNumberOfOpenedCases = selectedCount;
	});

	// Compute grid layout based on number of selected cases
	const gridClass = $derived(
		uiViewModel.fullscreenCaseId
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
			<ViewerWindow {case_} />
		{/each}
	</section>
</div>
