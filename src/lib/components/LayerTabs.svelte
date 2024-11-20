<script lang="ts">
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';
	import { mainState } from '$lib/modelviews/mainState.svelte';

	let { activeTab = $bindable('layers') } = $props();

	// Compute tabs based on run history
	const tabs = $derived([
		{ id: 'layers', label: 'Available Layers' },
		...mainState.runs.history.map((_, index) => ({
			id: `run-${index}`,
			label: `Run ${index + 1}`,
		})),
	]);
</script>

<div class="tabs-container overflow-x-auto">
	<TabGroup
		justify="justify-start"
		border="border-b border-surface-500/30"
		active="variant-filled-primary"
		class="min-w-fit"
	>
		{#each tabs as tab}
			<Tab
				bind:group={activeTab}
				name="layers-tab"
				value={tab.id}
				class="px-4 py-2 whitespace-nowrap"
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
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
	}

	.tabs-container::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.tabs-container::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}

	/* For Firefox */
	.tabs-container {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
	}
</style>
