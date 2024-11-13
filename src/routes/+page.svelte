<script lang="ts">
	import DatasetBrowser from '$lib/components/DatasetBrowser.svelte';
	import CaseList from '$lib/components/CaseList.svelte';
	import LayerTable from '$lib/components/LayerTable.svelte';
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import { onMount } from 'svelte';

	let sidebarElement: HTMLElement;
	let isCollapsed = false;

	// Handles sidebar resizing via drag interaction
	function initResize(event: MouseEvent) {
		event.preventDefault();

		const startX = event.pageX;
		const startWidth = sidebarElement.offsetWidth;

		function onMouseMove(e: MouseEvent) {
			const width = startWidth + (e.pageX - startX);
			if (width > 150 && width < 800) {
				sidebarElement.style.width = `${width}px`;
			}
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			document.body.style.cursor = 'default';
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		document.body.style.cursor = 'col-resize';
	}

	// Toggles sidebar collapse state
	function toggleCollapse() {
		if (isCollapsed) {
			sidebarElement.style.width = '300px';
		} else {
			sidebarElement.style.width = '2.5rem';
		}
		isCollapsed = !isCollapsed;
	}

	// Initialize default width
	onMount(() => {
		sidebarElement.style.width = '300px';
	});
</script>

<div class="h-screen w-screen flex overflow-hidden bg-surface-50-900-token">
	<!-- Sidebar -->
	<aside
		bind:this={sidebarElement}
		class="sidebar bg-surface-100-800-token border-r border-surface-500/30 relative flex"
	>
		<!-- Content container -->
		<div class="flex-1 overflow-hidden flex flex-col h-full" class:invisible={isCollapsed}>
			<div class="py-6 flex-shrink-0">
				<DatasetBrowser />
			</div>
			<div class="border-t border-surface-500/30 flex-1 overflow-hidden flex flex-col">
				<div class="pt-6 flex-1 overflow-y-auto">
					<CaseList />
				</div>
			</div>

			<!-- Toggle button when expanded -->
			{#if !isCollapsed}
				<button
					class="btn-icon variant-soft absolute z-10 transition-all duration-200 top-2 right-2 rounded-full"
					on:click={toggleCollapse}
				>
					<i class="fa-solid fa-chevron-left" />
				</button>
			{/if}
		</div>

		<!-- Toggle button container - only shown when collapsed -->
		{#if isCollapsed}
			<div class="w-full flex justify-center">
				<button class="btn-icon variant-soft rounded" on:click={toggleCollapse}>
					<i class="fa-solid fa-chevron-right" />
				</button>
			</div>
		{/if}

		<!-- Resize handle -->
		{#if !isCollapsed}
			<button
				class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500"
				aria-label="Resize sidebar"
				on:mousedown={initResize}
			/>
		{/if}
	</aside>

	<!-- Main content -->
	<div class="flex-1 p-6 overflow-auto">
		{#if $datasetStore.currentDataset}
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-medium">
						{$datasetStore.currentDataset.name}
					</h2>
					{#if $datasetStore.selectedCases.length > 0}
						<div class="text-sm text-surface-600-300-token">
							{$datasetStore.selectedCases.length} case{$datasetStore.selectedCases.length === 1
								? ''
								: 's'} selected
						</div>
					{/if}
				</div>
				<LayerTable />
			</div>
		{:else}
			<div class="flex h-full items-center justify-center">
				<p class="text-surface-600-300-token">Select a dataset to begin</p>
			</div>
		{/if}
	</div>
</div>
