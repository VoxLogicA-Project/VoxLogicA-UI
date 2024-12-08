<script lang="ts">
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import type { LayerContext } from '$lib/models/types';

	// Watch for changes to blinkingTabLayerContext
	$effect(() => {
		if (uiViewModel.blinkingTabLayerContext) {
			// Reset after 3 blinks (1s each) plus a small buffer
			setTimeout(() => {
				uiViewModel.blinkingTabLayerContext = null;
			}, 3100);
		}
	});
	let datasetTabId = $state('dataset');
	// Whenever id changes, we need to update the layerContext
	$effect(() => {
		const tab = tabs.find((tab) => tab.id === datasetTabId);
		if (tab) {
			uiViewModel.layerContext = tab.layerContext;
		}
	});
	// And viceversa, whenever layerContext changes, we need to update the datasetTabId
	$effect(() => {
		const tab = tabs.find(
			(tab) =>
				tab.layerContext.type === uiViewModel.layerContext.type &&
				tab.layerContext.runId === uiViewModel.layerContext.runId
		);
		if (tab) {
			datasetTabId = tab.id;
		}
	});

	// Compute tabs based on opened runs
	const tabs: { id: string; layerContext: LayerContext; label: string }[] = $derived.by(() => {
		var res: { id: string; layerContext: LayerContext; label: string }[] = [
			{
				id: 'dataset',
				layerContext: { type: 'dataset' },
				label: 'Dataset Layers',
			},
		];
		for (const [index, runId] of layerViewModel.uniqueRunIds.entries()) {
			res.push({
				id: `run-${runId}`,
				layerContext: { type: 'run', runId },
				label: `Run ${index + 1}`,
			});
		}
		return res;
	});
</script>

<div class="tabs-container overflow-x-auto">
	<TabGroup
		justify="justify-start"
		border="border-0"
		active="variant-filled-primary"
		class="min-w-fit"
	>
		{#each tabs as tab}
			<Tab
				bind:group={datasetTabId}
				name="layers-tab"
				value={tab.id}
				class="px-3 py-1.5 whitespace-nowrap text-sm tab-custom
				{uiViewModel.blinkingTabLayerContext?.type === tab.layerContext.type &&
				uiViewModel.blinkingTabLayerContext?.runId === tab.layerContext.runId
					? 'blink-tab'
					: ''}"
			>
				{tab.label}
			</Tab>
		{/each}
	</TabGroup>
</div>

<style>
	/* Customize scrollbar appearance */
	.tabs-container::-webkit-scrollbar {
		height: 6px;
	}

	.tabs-container::-webkit-scrollbar-track {
		border-radius: 3px;
	}

	.tabs-container::-webkit-scrollbar-thumb {
		border-radius: 3px;
	}

	/* For Firefox */
	.tabs-container {
		scrollbar-width: thin;
	}

	:global(.tab-custom) {
		border-radius: 0 0 0.375rem 0.375rem !important;
		margin-right: 0.2rem !important;
	}

	:global(.tab-custom:last-child) {
		margin-right: 0 !important;
	}

	:global(.tab-custom:not(.variant-filled-primary)) {
		background-color: rgb(var(--color-surface-400) / 0.2);
	}

	:global(.blink-tab) {
		animation: blink 1s ease-in-out 3;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
			background-color: rgb(var(--color-success-500));
		}
	}
</style>
