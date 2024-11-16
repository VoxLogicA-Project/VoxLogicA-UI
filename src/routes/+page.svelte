<script lang="ts">
	import CollapsibleSidebar from '$lib/components/CollapsibleSidebar.svelte';
	import DatasetBrowser from '$lib/components/DatasetBrowser.svelte';
	import CaseList from '$lib/components/CaseList.svelte';
	import ViewerGrid from '$lib/components/ViewerGrid.svelte';
	import { datasetStore } from '$lib/viewmodels/datasetStore';
</script>

<div class="h-screen w-screen flex overflow-hidden bg-surface-50-900-token">
	<!-- Left Sidebar -->
	<CollapsibleSidebar side="left">
		<div class="py-6 flex-shrink-0">
			<DatasetBrowser />
		</div>
		<div class="border-t border-surface-500/30 flex-1 overflow-hidden flex flex-col">
			<div class="pt-6 flex-1 overflow-y-auto">
				<CaseList />
			</div>
		</div>
	</CollapsibleSidebar>

	<!-- Main content -->
	<div class="flex-1 overflow-hidden flex flex-col">
		{#if $datasetStore.currentDataset}
			<div class="flex-1 flex gap-4 overflow-hidden">
				<div class="flex-1 relative bg-black rounded-lg overflow-hidden">
					<ViewerGrid />
				</div>
			</div>
		{:else}
			<div class="flex h-full items-center justify-center">
				<p class="text-surface-600-300-token">Select a dataset to begin</p>
			</div>
		{/if}
	</div>
</div>
