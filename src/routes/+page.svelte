<script lang="ts">
	import CollapsibleSidebar from '$lib/components/common/CollapsibleSidebar.svelte';
	import Workspaces from '$lib/components/navigation/Workspaces.svelte';
	import DatasetBrowser from '$lib/components/navigation/DatasetBrowser.svelte';
	import CaseList from '$lib/components/navigation/CaseList.svelte';
	import ViewersGrid from '$lib/components/viewers/ViewersGrid.svelte';
	import LayerMatrix from '$lib/components/layers/LayerMatrix.svelte';
	import ScriptEditor from '$lib/components/run/ScriptEditor.svelte';
	import { datasetViewModel } from '$lib/viewmodels/dataset.svelte';
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import WorkspacesFullScreen from '$lib/components/navigation/WorkspacesFullScreen.svelte';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
</script>

<div class="h-screen w-screen flex overflow-hidden bg-surface-50-900-token">
	<!-- Workspace Selector Overlay -->
	{#if !sessionViewModel.selectedWorkspaceId}
		<WorkspacesFullScreen />
	{/if}

	<!-- Left Sidebar -->
	<CollapsibleSidebar
		side="left"
		defaultSize="330px"
		bind:isCollapsed={uiViewModel.state.sidebars.datasetCollapsed}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-surface-500/30">
			<div class="flex items-center">
				<a href="/" class="flex items-center" onclick={() => (window.location.href = '/')}>
					<!-- SVG Logo -->
					<div class="theme-container">
						<svg
							class="w-8 h-8"
							viewBox="0 0 100 100"
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							stroke="currentColor"
						>
							<path
								d="M50 90 L15 10 L50 40 L85 10 Z
							   M15 10 L85 10 
							   M50 40 L50 10 
							   M35 25 L65 25"
								fill="var(--color-primary-900-50-token)"
								fill-rule="evenodd"
							/>
						</svg>
					</div>

					<h3
						class="h3 px-2"
						style="font-family: 'Urbanist', sans-serif; font-weight: 700; color: var(--color-primary-900-50-token); letter-spacing: 0.05em;"
					>
						V<span style="opacity: 0.7;">ox</span>Log<span style="opacity: 0.7;">ic</span>A
					</h3>
				</a>
			</div>

			<div class="flex gap-2">
				<!-- Workspaces -->
				<Workspaces />

				<!-- Dark Mode Button -->
				<button
					class="w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-lg bg-surface-300-600-token hover:bg-surface-400-500-token flex items-center justify-center"
					onclick={uiViewModel.toggleDarkMode}
					title="Toggle dark mode"
					aria-label="Toggle dark mode"
				>
					<i class="fa-solid fa-sun text-lg hidden dark:block"></i>
					<i class="fa-solid fa-moon text-lg block dark:hidden"></i>
				</button>
			</div>
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
		{#if datasetViewModel.selectedDataset}
			<div class="flex-1 flex flex-col min-h-0">
				<!-- Viewer Grid -->
				<div class="flex-1 overflow-auto">
					{#if caseViewModel.selectedCases.length > 0}
						<ViewersGrid />
					{:else}
						<div class="flex h-full items-center justify-center">
							<div class="flex items-center gap-3 text-surface-600-300-token">
								<i class="fa-solid fa-arrow-left text-2xl animate-pulse"></i>
								<p>
									Select up to {caseViewModel.MAX_SELECTED_CASES} cases from the list on the left to
									begin viewing
								</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Layer Matrix -->
				{#if caseViewModel.selectedCases.length > 0}
					<CollapsibleSidebar
						side="bottom"
						defaultSize="250px"
						minSize={100}
						maxSize={600}
						bind:isCollapsed={uiViewModel.state.sidebars.layerCollapsed}
					>
						<LayerMatrix />
					</CollapsibleSidebar>
				{/if}
			</div>
		{:else}
			<div class="flex h-full items-center justify-center">
				<div class="flex items-center gap-3 text-surface-600-300-token">
					<i class="fa-solid fa-arrow-left text-2xl animate-pulse"></i>
					<p>Select a dataset from the sidebar on the left to begin</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Run section -->
	{#if caseViewModel.selectedCases.length > 0}
		<CollapsibleSidebar
			side="right"
			defaultSize="400px"
			bind:isCollapsed={uiViewModel.state.sidebars.scriptCollapsed}
		>
			<ScriptEditor />
		</CollapsibleSidebar>
	{/if}
</div>
