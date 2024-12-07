import type { ToastStore, ModalStore, ModalSettings } from '@skeletonlabs/skeleton';
import { sessionViewModel } from '$lib/viewmodels/session.svelte';

export function createWorkspaceService(toastStore: ToastStore, modalStore: ModalStore) {
	return {
		showCreateWorkspaceModal(options: { onSuccess?: () => void } = {}) {
			const modal: ModalSettings = {
				type: 'prompt',
				title: 'New Workspace',
				body: 'Enter a name for the new workspace',
				value: '',
				response: (r) => this.handleCreateWorkspace(r, options),
				buttonTextCancel: sessionViewModel.hasWorkspaces ? 'Cancel' : '',
				buttonTextSubmit: 'Create',
				valueAttr: {
					type: 'text',
					minlength: 3,
					maxlength: 30,
					required: true,
					class: 'input p-2 rounded-lg w-full',
				},
			};
			modalStore.trigger(modal);
		},

		async handleCreateWorkspace(
			name: string | boolean | undefined,
			options: { onSuccess?: () => void } = {}
		) {
			if (typeof name !== 'string') {
				return;
			}

			if (!name.trim()) {
				toastStore.trigger({
					message: 'Please enter a workspace name',
					background: 'variant-filled-error',
				});
				setTimeout(() => this.showCreateWorkspaceModal(options), 100);
				return;
			}

			try {
				const newWorkspace = await sessionViewModel.createWorkspace(name);
				await sessionViewModel.loadWorkspaces();
				await sessionViewModel.selectWorkspace(newWorkspace.id);
				toastStore.trigger({
					message: 'Workspace created',
					background: 'variant-filled-success',
				});
				options.onSuccess?.();
			} catch {
				toastStore.trigger({
					message: 'Failed to create workspace',
					background: 'variant-filled-error',
				});
				if (!sessionViewModel.hasWorkspaces) {
					setTimeout(() => this.showCreateWorkspaceModal(options), 100);
				}
			}
		},

		async handleSave() {
			try {
				await sessionViewModel.saveWorkspace();
				toastStore.trigger({
					message: 'Workspace saved',
					background: 'variant-filled-success',
				});
			} catch {
				toastStore.trigger({
					message: 'Failed to save workspace',
					background: 'variant-filled-error',
				});
			}
		},

		async handleSelect(workspaceId: string) {
			try {
				await sessionViewModel.selectWorkspace(workspaceId);
			} catch {
				toastStore.trigger({
					message: 'Failed to load workspace',
					background: 'variant-filled-error',
				});
			}
		},
	};
}
