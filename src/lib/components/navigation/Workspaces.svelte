<script lang="ts">
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { createWorkspaceService } from './workspaceService';

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const workspaceService = createWorkspaceService(toastStore, modalStore);

	// Popup settings
	const popupSettings: PopupSettings = {
		event: 'click',
		target: 'workspace-menu',
		placement: 'bottom',
	};

	onMount(() => {
		sessionViewModel.loadWorkspaces();
	});

	const saveButtonClass = $derived(
		sessionViewModel.hasUnsavedChanges
			? 'bg-error-500 hover:bg-error-600'
			: 'bg-surface-300-600-token hover:bg-surface-400-500-token'
	);
</script>

<!-- Save Button and Workspace Button side by side -->
<div class="flex gap-2">
	<button
		class="w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-lg {saveButtonClass} flex items-center justify-center transition-colors duration-200"
		onclick={() => workspaceService.handleSave()}
		title={sessionViewModel.hasUnsavedChanges ? 'Save changes' : 'No unsaved changes'}
		aria-label={sessionViewModel.hasUnsavedChanges ? 'Save changes' : 'No unsaved changes'}
	>
		<i
			class="fa-solid fa-floppy-disk text-lg {sessionViewModel.hasUnsavedChanges
				? 'animate-pulse'
				: ''}"
		></i>
	</button>

	<button
		class="h-8 px-2 rounded-lg bg-surface-300-600-token hover:bg-surface-400-500-token flex items-center gap-2 transition-colors duration-200"
		use:popup={popupSettings}
	>
		<i class="fa-solid fa-window-restore text-sm opacity-50"></i>
		<span class="truncate max-w-[120px] text-sm">
			{#if sessionViewModel.selectedWorkspaceName}
				{sessionViewModel.selectedWorkspaceName}
			{:else}
				Select Workspace
			{/if}
		</span>
		<i class="fa-solid fa-chevron-down text-xs opacity-50"></i>
	</button>
</div>

<!-- Popup Menu -->
<div class="card w-64 shadow-xl" data-popup="workspace-menu" style="z-index: 1000;">
	{#if sessionViewModel.isLoading}
		<div class="p-2 text-center">
			<i class="fa-solid fa-spinner animate-spin"></i>
		</div>
	{:else if sessionViewModel.error}
		<div class="p-2 text-error-500 text-center text-sm">
			{sessionViewModel.error}
		</div>
	{:else}
		<nav class="list-nav p-1">
			{#if sessionViewModel.hasWorkspaces}
				<div class="px-2 py-0.5 text-xs font-semibold uppercase text-surface-500-400-token">
					Your Workspaces
				</div>
				{#each sessionViewModel.availableWorkspacesIdsAndNames as { id, name }}
					<div
						class="option !px-2 !py-1.5 rounded-lg {id === sessionViewModel.selectedWorkspaceId
							? '!bg-primary-500/40 hover:!bg-primary-500/60'
							: 'hover:!bg-surface-500/20'} flex items-center"
					>
						<div
							class="flex-1 cursor-pointer max-w-full"
							role="button"
							tabindex="0"
							onclick={() => workspaceService.handleSelect(id)}
							onkeydown={(e) => e.key === 'Enter' && workspaceService.handleSelect(id)}
						>
							<div class="flex flex-col">
								<span class="font-medium text-sm">{name}</span>
								<div class="flex items-start justify-between gap-1 max-w-full">
									<span class="text-xs opacity-50 font-mono truncate mt-0.5">{id}</span>
									<div
										class="inline-flex items-center justify-center p-0.5 hover:bg-surface-500/20 rounded-full opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
										role="button"
										tabindex="0"
										title="Copy Workspace ID"
										onclick={(event) => {
											event.stopPropagation();
											navigator.clipboard.writeText(id);
											toastStore.trigger({
												message: 'Workspace ID copied',
												background: 'variant-filled-success',
											});
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.stopPropagation();
												navigator.clipboard.writeText(id);
												toastStore.trigger({
													message: 'Workspace ID copied',
													background: 'variant-filled-success',
												});
											}
										}}
									>
										<i class="fa-solid fa-copy text-xs"></i>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
				<hr class="!my-1 opacity-50" />
			{/if}

			<button
				class="option !px-2 !py-1.5 rounded-lg hover:!bg-surface-500/20 w-full text-left"
				onclick={() => workspaceService.showCreateWorkspaceModal()}
			>
				<div class="flex items-center gap-2">
					<i class="fa-solid fa-plus"></i>
					<span class="text-sm">New Workspace</span>
				</div>
			</button>
		</nav>
	{/if}
	<div class="arrow variant-filled-surface"></div>
</div>
