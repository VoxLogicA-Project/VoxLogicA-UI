<script lang="ts">
	import DatasetBrowser from '$lib/components/DatasetBrowser.svelte';
	import { datasetStore } from '$lib/viewmodels/datasetStore';
</script>

<div class="h-full w-full flex bg-white">
	<!-- Sidebar -->
	<div class="w-72 border-r border-gray-200 py-6">
		<DatasetBrowser />
		<!-- Case list will go here -->
		<!-- Script panel will go here -->
	</div>

	<!-- Main content -->
	<div class="flex-1 p-6">
		{#if $datasetStore.currentDataset}
			<h2 class="text-xl font-medium text-gray-800">
				{$datasetStore.currentDataset.name}
			</h2>
			<!-- Viewer will go here -->
		{:else}
			<div class="flex h-full items-center justify-center">
				<p class="text-gray-400">Select a dataset to begin</p>
			</div>
		{/if}
	</div>
</div>
