<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();

	const formData = {
		id: '',
		name: '',
	};

	let isSubmitting = false;
	let error = '';

	async function onFormSubmit(): Promise<void> {
		if (!formData.id.trim() || !formData.name.trim()) {
			error = 'Please fill in all fields';
			return;
		}

		try {
			isSubmitting = true;
			error = '';

			// First, validate the workspace ID exists
			const response = await fetch(`/workspaces/${formData.id}`);
			if (!response.ok) {
				if (response.status === 404) {
					error = 'Workspace ID not found. Please check the ID and try again.';
				} else {
					error = 'Failed to validate workspace ID. Please try again.';
				}
				return;
			}

			// If validation succeeds, close modal and send response
			if ($modalStore[0].response) $modalStore[0].response(formData);
			modalStore.close();
		} catch (e) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if $modalStore[0]}
	<div class="card p-6 w-modal shadow-xl space-y-6">
		<!-- Header -->
		<div class="space-y-2">
			<div class="text-2xl font-semibold">{$modalStore[0].title ?? '(title missing)'}</div>
			<p class="text-surface-600-300-token">{$modalStore[0].body ?? '(body missing)'}</p>
		</div>

		<!-- Error Alert -->
		{#if error}
			<div class="alert variant-filled-error py-3">
				<div class="flex items-center gap-3">
					<i class="fa-solid fa-circle-exclamation"></i>
					<span>{error}</span>
				</div>
			</div>
		{/if}

		<!-- Form -->
		<div class="space-y-4">
			<label class="space-y-2">
				<div class="font-medium">Workspace ID</div>
				<input
					class="input"
					type="text"
					bind:value={formData.id}
					placeholder="Enter workspace ID..."
					disabled={isSubmitting}
					required
				/>
				<div class="text-sm text-surface-600-300-token opacity-75">
					The ID of the workspace you want to copy
				</div>
			</label>

			<label class="space-y-2">
				<div class="font-medium">New Workspace Name</div>
				<input
					class="input"
					type="text"
					bind:value={formData.name}
					placeholder="Enter workspace name..."
					minlength="3"
					maxlength="30"
					disabled={isSubmitting}
					required
				/>
				<div class="text-sm text-surface-600-300-token opacity-75">
					A name for your new workspace (3-30 characters)
				</div>
			</label>
		</div>

		<!-- Footer -->
		<div class="modal-footer {parent.regionFooter}">
			<button class="btn variant-ghost-surface" on:click={parent.onClose} disabled={isSubmitting}>
				Cancel
			</button>
			<button class="btn variant-filled-primary" on:click={onFormSubmit} disabled={isSubmitting}>
				{#if isSubmitting}
					<i class="fa-solid fa-spinner animate-spin mr-2"></i>
				{/if}
				Create
			</button>
		</div>
	</div>
{/if}
