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
	let form: HTMLFormElement;

	async function onFormSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		// Check native form validation first
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		try {
			isSubmitting = true;

			// First, validate the workspace ID exists
			const response = await fetch(`/workspaces/${formData.id}`);
			if (!response.ok) {
				const idInput = form.querySelector('input[name="id"]') as HTMLInputElement;
				if (response.status === 404) {
					idInput.setCustomValidity('Workspace ID not found. Please check the ID and try again.');
				} else {
					idInput.setCustomValidity('Failed to validate workspace ID. Please try again.');
				}
				form.reportValidity();
				return;
			}

			// If validation succeeds, close modal and send response
			if ($modalStore[0].response) $modalStore[0].response(formData);
			modalStore.close();
		} catch (e) {
			const idInput = form.querySelector('input[name="id"]') as HTMLInputElement;
			idInput.setCustomValidity('An unexpected error occurred. Please try again.');
			form.reportValidity();
		} finally {
			isSubmitting = false;
		}
	}

	// Clear custom validity when input changes
	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		input.setCustomValidity('');
	}
</script>

{#if $modalStore[0]}
	<div class="card p-6 w-modal shadow-xl space-y-6">
		<div class="space-y-2">
			<div class="text-2xl font-semibold">{$modalStore[0].title ?? '(title missing)'}</div>
			<p class="text-surface-600-300-token">{$modalStore[0].body ?? '(body missing)'}</p>
		</div>

		<form bind:this={form} on:submit={onFormSubmit} class="space-y-4" novalidate>
			<label class="space-y-2">
				<div class="font-medium">Workspace ID</div>
				<input
					class="input p-2 rounded-lg w-full"
					type="text"
					name="id"
					bind:value={formData.id}
					placeholder="Enter workspace ID..."
					disabled={isSubmitting}
					required
					on:input={handleInput}
				/>
				<div class="text-sm text-surface-600-300-token opacity-75">
					The ID of the workspace you want to copy
				</div>
			</label>

			<label class="space-y-2">
				<div class="font-medium">New Workspace Name</div>
				<input
					class="input p-2 rounded-lg w-full"
					type="text"
					name="name"
					bind:value={formData.name}
					placeholder="Enter workspace name..."
					minlength="3"
					maxlength="30"
					disabled={isSubmitting}
					required
					on:input={handleInput}
				/>
				<div class="text-sm text-surface-600-300-token opacity-75">
					A name for your new workspace (3-30 characters)
				</div>
			</label>

			<div class="modal-footer {parent.regionFooter}">
				<button
					type="button"
					class="btn variant-ghost-surface"
					on:click={parent.onClose}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button type="submit" class="btn variant-filled-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<i class="fa-solid fa-spinner animate-spin mr-2"></i>
					{/if}
					Create
				</button>
			</div>
		</form>
	</div>
{/if}
