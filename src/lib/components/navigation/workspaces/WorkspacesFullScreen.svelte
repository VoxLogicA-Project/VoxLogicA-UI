<script lang="ts">
	import { onMount } from 'svelte';
	import { getToastStore, getModalStore, popup } from '@skeletonlabs/skeleton';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import { createWorkspaceService } from './workspaceService';

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const workspaceService = createWorkspaceService(toastStore, modalStore);

	onMount(async () => {
		await sessionViewModel.loadWorkspaces();
	});
</script>

<div class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
	<div class="bg-surface-100-800-token rounded-xl shadow-xl max-w-xl w-full">
		<!-- Fixed Header -->
		<div class="p-8 pb-4 text-center space-y-4">
			<h2 class="h2">Welcome to VoxLogicA UI</h2>
			<p class="text-surface-600-300-token flex items-center justify-center gap-2">
				Please select a workspace or create a new one to continue
				<button
					title="What is a workspace?"
					aria-label="What is a workspace?"
					class="btn-icon variant-soft-surface"
					use:popup={{
						event: 'hover',
						target: 'workspace-info',
						placement: 'bottom',
					}}
				>
					<i class="fa-solid fa-circle-question"></i>
				</button>
			</p>
			<!-- Popup Content -->
			<div
				class="card p-4 w-80 bg-surface-50-900-token border border-surface-400-500-token shadow-xl text-left"
				data-popup="workspace-info"
				style="z-index: 1000;"
			>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<i class="fa-solid fa-book-open text-primary-500 text-lg mt-0.5"></i>
						<div>
							<h3 class="font-semibold">What is a workspace?</h3>
							<p class="text-surface-600-300-token">
								A saved state of your work in VoxLogica UI - like a notebook where you write
								everything you do.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<i class="fa-solid fa-arrows-rotate text-primary-500 text-lg mt-0.5"></i>
						<div>
							<h3 class="font-semibold">Easy load and switching</h3>
							<p class="text-surface-600-300-token">
								You can always load back a workspace to continue your work exactly where you
								stopped, and switch between them easily.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<i class="fa-solid fa-clone text-primary-500 text-lg mt-0.5"></i>
						<div>
							<h3 class="font-semibold">Independent copies</h3>
							<p class="text-surface-600-300-token">
								You can create your own workspace from scratch or from someone else's ID - you'll
								get a copy to work on without affecting their original.
							</p>
						</div>
					</div>
				</div>
				<div class="arrow bg-surface-400-500-token"></div>
			</div>
		</div>

		<!-- Scrollable Content -->
		<div class="max-h-[40vh] overflow-y-auto px-8">
			{#if sessionViewModel.isLoading}
				<div class="text-center py-4">
					<i class="fa-solid fa-spinner animate-spin text-2xl"></i>
				</div>
			{:else if sessionViewModel.hasWorkspaces}
				<div class="space-y-2 py-4">
					{#each sessionViewModel.availableWorkspacesIdsAndNames as { id, name }}
						<button
							class="w-full p-4 rounded-lg bg-surface-100-800-token hover:bg-primary-500/20 transition-all duration-200"
							onclick={async () => await workspaceService.handleSelect(id, name)}
						>
							<div class="flex flex-col">
								<div class="flex items-center justify-between">
									<span class="font-medium">{name}</span>
									<div class="flex items-center gap-1">
										<div
											class="inline-flex items-center justify-center p-1.5 hover:bg-error-500/20 rounded-full opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer group"
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
											<i class="fa-solid fa-trash text-sm group-hover:text-error-500 transition-all"
											></i>
										</div>
									</div>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-xs opacity-50 font-mono">{id}</span>
									<div
										class="inline-flex items-center justify-center p-1.5 hover:bg-surface-500/20 rounded-full opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer group"
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
										<i class="fa-solid fa-copy text-sm group-hover:text-surface-50 transition-all"
										></i>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Fixed Footer -->
		<div class="p-8 pt-4 space-y-2">
			<button
				class="w-full p-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200 flex items-center justify-center gap-2"
				onclick={() => workspaceService.showCreateWorkspaceModal()}
			>
				<i class="fa-solid fa-plus"></i>
				<span>New Workspace</span>
			</button>

			<button
				class="w-full p-4 rounded-lg bg-surface-500/10 hover:bg-surface-500/20 border border-surface-500/30 transition-all duration-200 flex items-center justify-center gap-2"
				onclick={() => workspaceService.showCreateFromIdModal()}
			>
				<i class="fa-solid fa-copy"></i>
				<span>Create from ID</span>
			</button>
		</div>
	</div>
</div>
