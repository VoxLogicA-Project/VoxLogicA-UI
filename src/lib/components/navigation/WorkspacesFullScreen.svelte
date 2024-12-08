<script lang="ts">
	import { onMount } from 'svelte';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import { createWorkspaceService } from './workspaceService';

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const workspaceService = createWorkspaceService(toastStore, modalStore);

	onMount(async () => {
		await sessionViewModel.loadWorkspaces();
	});
</script>

<div class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
	<div class="bg-surface-100-800-token rounded-xl shadow-xl max-w-lg w-full">
		<!-- Fixed Header -->
		<div class="p-8 pb-4 text-center space-y-4">
			<h2 class="h2">Welcome to VoxLogicA UI</h2>
			<p class="text-surface-600-300-token">
				Please select a workspace or create a new one to continue.
			</p>
		</div>

		<!-- Scrollable Content -->
		<div class="max-h-[40vh] overflow-y-auto px-8">
			{#if sessionViewModel.isLoading}
				<div class="text-center py-4">
					<i class="fa-solid fa-spinner animate-spin text-2xl"></i>
				</div>
			{:else if sessionViewModel.error}
				<div class="text-error-500 text-center py-4">
					{sessionViewModel.error}
				</div>
			{:else if sessionViewModel.hasWorkspaces}
				<div class="space-y-2 py-4">
					{#each sessionViewModel.availableWorkspacesIdsAndNames as { id, name }}
						<button
							class="w-full p-4 rounded-lg bg-surface-100-800-token hover:bg-primary-500/20 transition-colors flex flex-col gap-1"
							onclick={() => workspaceService.handleSelect(id)}
						>
							<span class="font-medium">{name}</span>
							<span class="text-xs opacity-50 font-mono">{id}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Fixed Footer -->
		<div class="p-8 pt-4">
			<button
				class="w-full p-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors flex items-center justify-center gap-2"
				onclick={() => workspaceService.showCreateWorkspaceModal()}
			>
				<i class="fa-solid fa-plus"></i>
				<span>New Workspace</span>
			</button>
		</div>
	</div>
</div>
