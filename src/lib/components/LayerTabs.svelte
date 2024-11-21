<script lang="ts">
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';
	import { runViewModel } from '$lib/viewmodels/run.svelte';

	let { activeTab = $bindable('layers') } = $props();

	// Compute tabs based on run history
	const tabs = $derived([
		{ id: 'layers', label: 'Available Layers' },
		...runViewModel.history.map((_, index) => ({
			id: `run-${index}`,
			label: `Run ${index + 1}`,
		})),
	]);
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
				bind:group={activeTab}
				name="layers-tab"
				value={tab.id}
				class="px-3 py-1.5 whitespace-nowrap text-sm tab-custom"
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
</style>
