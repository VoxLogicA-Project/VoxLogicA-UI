<script lang="ts">
	import CollapsibleSidebar from '$lib/components/common/CollapsibleSidebar.svelte';
	import DatasetBrowser from '$lib/components/DatasetBrowser.svelte';
	import CaseList from '$lib/components/CaseList.svelte';
	import ViewerGrid from '$lib/components/ViewerGrid.svelte';
	import LayerMatrix from '$lib/components/LayerMatrix.svelte';
	import { mainState } from '$lib/modelviews/mainState.svelte';
	import isDarkMode from './+layout.svelte';
	import ScriptEditor from '$lib/components/ScriptEditor.svelte';

	// Log every change to mainState
	$effect(() => {
		$inspect(mainState);
	});
</script>

<div class="h-screen w-screen flex overflow-hidden bg-surface-50-900-token">
	<!-- Left Sidebar -->
	<CollapsibleSidebar
		side="left"
		defaultSize="300px"
		bind:isCollapsed={mainState.ui.datasetSidebarCollapsed}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-surface-500/30">
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-3" onclick={() => (window.location.href = '/')}>
					<div
						class="w-8 h-8 h3 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold"
					>
						V
					</div>
					<h3 class="h3">VoxLogicA</h3>
				</a>
			</div>

			<button
				class="w-8 h-8 rounded-lg bg-surface-300-600-token hover:bg-surface-400-500-token flex items-center justify-center"
				onclick={() => (mainState.ui.isDarkMode = !mainState.ui.isDarkMode)}
				title="Toggle dark mode"
				aria-label="Toggle dark mode"
			>
				<i class="fa-solid fa-sun text-lg hidden dark:block"></i>
				<i class="fa-solid fa-moon text-lg block dark:hidden"></i>
			</button>
		</div>

		<!-- Dataset Browser -->
		<div class="py-6 flex-shrink-0">
			<DatasetBrowser />
		</div>

		<!-- Case List -->
		<div class="border-t border-surface-500/30 flex-1 overflow-hidden flex flex-col">
			<div class="pt-6 flex-1 overflow-y-auto">
				<CaseList />
			</div>
		</div>
	</CollapsibleSidebar>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		{#if mainState.datasets.selected}
			<div class="flex-1 flex flex-col min-h-0">
				<!-- Viewer Grid -->
				<div class="flex-1 overflow-auto">
					<ViewerGrid />
				</div>

				<!-- Layer Matrix -->
				{#if mainState.cases.selected.length > 0}
					<CollapsibleSidebar
						side="bottom"
						defaultSize="250px"
						minSize={100}
						maxSize={600}
						bind:isCollapsed={mainState.ui.layerSidebarCollapsed}
					>
						<div class="w-full h-full overflow-auto">
							<LayerMatrix />
						</div>
					</CollapsibleSidebar>
				{/if}
			</div>
		{:else}
			<div class="flex h-full items-center justify-center">
				<p class="text-surface-600-300-token">Select a dataset to begin</p>
			</div>
		{/if}
	</div>

	<!-- Run section -->
	{#if mainState.cases.selected.length > 0}
		<CollapsibleSidebar
			side="right"
			defaultSize="400px"
			bind:isCollapsed={mainState.ui.scriptSidebarCollapsed}
		>
			<ScriptEditor />
		</CollapsibleSidebar>
	{/if}
</div>
