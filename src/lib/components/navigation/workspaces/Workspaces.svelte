<script lang="ts">
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { createWorkspaceService } from './workspaceService';
	import FullscreenLoader from '$lib/components/common/FullscreenLoader.svelte';
	import { debounce } from 'ts-debounce';

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

	// Auto-save workspace when there are unsaved changes
	const debouncedSaveWorkspace = debounce(async () => {
		if (!sessionViewModel.hasUnsavedChanges) return;

		await workspaceService.handleSave(false);
	}, 5000);
	$effect(() => {
		if (!sessionViewModel.hasUnsavedChanges) return;
		debouncedSaveWorkspace();
	});
</script>

{#if sessionViewModel.isLoading}
	<FullscreenLoader text="Loading Workspace..." />
{/if}

<!-- Save Button and Workspace Button side by side -->
<div class="flex gap-2 w-full">
	<button
		title="Select Workspace"
		aria-label="Select Workspace"
		class="flex-1 h-8 px-2 rounded-lg bg-surface-500/10 hover:bg-surface-500/20 border border-surface-500/30 flex items-center gap-2 transition-all duration-200"
		use:popup={popupSettings}
	>
		<i class="fa-solid fa-window-restore text-sm opacity-50"></i>
		<span class="truncate flex-1 text-sm text-left">
			{#if sessionViewModel.selectedWorkspaceName}
				{sessionViewModel.selectedWorkspaceName}
			{:else}
				Select Workspace
			{/if}
		</span>
		<i class="fa-solid fa-chevron-down text-xs opacity-50"></i>
	</button>

	<button
		class="w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-lg border border-surface-500/30 flex items-center justify-center transition-all duration-200
			{sessionViewModel.hasUnsavedChanges
			? 'bg-error-500/20 hover:bg-error-500/30 shadow-lg shadow-error-500/20 ring-1 ring-error-500/50'
			: 'bg-surface-500/10 hover:bg-surface-500/20'}
		"
		onclick={() => workspaceService.handleSave()}
		title={sessionViewModel.isSaving
			? 'Saving...'
			: sessionViewModel.hasUnsavedChanges
				? 'Save changes'
				: 'No unsaved changes'}
		aria-label={sessionViewModel.isSaving
			? 'Saving...'
			: sessionViewModel.hasUnsavedChanges
				? 'Save changes'
				: 'No unsaved changes'}
	>
		<i
			class:fa-floppy-disk={!sessionViewModel.isSaving}
			class:fa-spinner={sessionViewModel.isSaving}
			class:fa-spin={sessionViewModel.isSaving}
			class:animate-pulse={sessionViewModel.hasUnsavedChanges && !sessionViewModel.isSaving}
			class:text-error-700={sessionViewModel.hasUnsavedChanges}
			class="fa-solid text-lg"
		></i>
	</button>
</div>

<!-- Popup Menu -->
<div
	class="card w-64 bg-surface-50-900-token border border-surface-400-500-token shadow-xl"
	data-popup="workspace-menu"
	style="z-index: 1000;"
>
	<nav class="list-nav p-1 flex flex-col" style="max-height: 60vh;">
		{#if sessionViewModel.hasWorkspaces}
			<div class="px-2 py-0.5 text-xs font-semibold uppercase">Your Workspaces</div>
			<div class="overflow-y-auto overflow-x-hidden text-surface-900-50-token">
				{#each sessionViewModel.availableWorkspacesIdsAndNames as { id, name }}
					<div
						class="option !px-2 !py-1.5 rounded-lg {id === sessionViewModel.selectedWorkspaceId
							? '!bg-primary-500/40 hover:!bg-primary-500/60'
							: 'hover:!bg-surface-400/10'} flex items-center transition-all duration-200"
					>
						<div
							class="flex-1 cursor-pointer max-w-full"
							role="button"
							tabindex="0"
							onclick={() => workspaceService.handleSelect(id, name)}
							onkeydown={(e) => e.key === 'Enter' && workspaceService.handleSelect(id, name)}
						>
							<div class="flex flex-col">
								<div class="flex items-center justify-between">
									<span class="font-medium text-sm">{name}</span>
									<div
										class="inline-flex items-center justify-center p-0.5 hover:bg-error-500/20 rounded-full opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer group"
										role="button"
										tabindex="0"
										title="Delete Workspace"
										onclick={(event) => {
											event.stopPropagation();
											workspaceService.showDeleteWorkspaceModal(id, name);
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.stopPropagation();
												workspaceService.showDeleteWorkspaceModal(id, name);
											}
										}}
									>
										<i class="fa-solid fa-trash text-xs group-hover:text-error-500 transition-all"
										></i>
									</div>
								</div>
								<div class="flex items-start justify-between gap-1 max-w-full">
									<span class="text-xs opacity-50 font-mono truncate mt-0.5">{id}</span>
									<div
										class="inline-flex items-center justify-center p-0.5 hover:bg-surface-500/20 rounded-full opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer group"
										role="button"
										tabindex="0"
										title="Copy Workspace ID"
										onclick={async (event) => {
											event.preventDefault();
											event.stopPropagation();
											try {
												await navigator.clipboard.writeText(id);
												toastStore.trigger({
													message: 'Workspace ID copied',
													background: 'variant-filled-success',
												});
											} catch (err) {
												toastStore.trigger({
													message: 'Failed to copy workspace ID',
													background: 'variant-filled-error',
												});
											}
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												e.stopPropagation();
												navigator.clipboard
													.writeText(id)
													.then(() => {
														toastStore.trigger({
															message: 'Workspace ID copied',
															background: 'variant-filled-success',
														});
													})
													.catch(() => {
														toastStore.trigger({
															message: 'Failed to copy workspace ID',
															background: 'variant-filled-error',
														});
													});
											}
										}}
									>
										<i class="fa-solid fa-copy text-xs group-hover:text-surface-50 transition-all"
										></i>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<hr class="!my-1 opacity-50" />
		{/if}

		<button
			class="option !px-2 !py-1.5 rounded-lg hover:!bg-surface-500/20 w-full text-left transition-all duration-200"
			onclick={() => workspaceService.showCreateWorkspaceModal()}
		>
			<div class="flex items-center gap-2">
				<i class="fa-solid fa-plus"></i>
				<span class="text-sm">New Workspace</span>
			</div>
		</button>

		<button
			class="option !px-2 !py-1.5 rounded-lg hover:!bg-surface-500/20 w-full text-left transition-all duration-200"
			onclick={() => workspaceService.showCreateFromIdModal()}
		>
			<div class="flex items-center gap-2">
				<i class="fa-solid fa-copy"></i>
				<span class="text-sm">Create from ID</span>
			</div>
		</button>
	</nav>
	<div class="arrow bg-surface-400-500-token"></div>
</div>
