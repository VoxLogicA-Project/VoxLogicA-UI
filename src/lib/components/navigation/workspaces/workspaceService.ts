import type { ModalSettings } from '@skeletonlabs/skeleton';
import type { ToastStore, ModalStore } from '@skeletonlabs/skeleton';
import { sessionViewModel } from '$lib/viewmodels/session.svelte';

export const createWorkspaceService = (toastStore: ToastStore, modalStore: ModalStore) => ({
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

	async handleSelect(workspaceId: string, workspaceName: string) {
		await sessionViewModel.selectWorkspace(workspaceId);
		if (sessionViewModel.error == 'Workspace not found') {
			this.showDeleteWorkspaceModal(workspaceId, workspaceName);
		} else if (sessionViewModel.error) {
			toastStore.trigger({
				message: `Failed to load workspace (error: ${sessionViewModel.error}). Please try again later.`,
				background: 'variant-filled-error',
			});
		}
	},

	showCreateFromIdModal(options: { onSuccess?: () => void } = {}) {
		const modal: ModalSettings = {
			type: 'component',
			component: 'createFromIdModal',
			title: 'Create from Workspace ID',
			body: 'Enter a workspace ID and name for the new workspace',
			response: (r: { id: string; name: string } | undefined) =>
				this.handleCreateFromId(r, options),
			buttonTextCancel: sessionViewModel.hasWorkspaces ? 'Cancel' : '',
			buttonTextSubmit: 'Create',
		};
		modalStore.trigger(modal);
	},

	async handleCreateFromId(
		response: { id: string; name: string } | undefined,
		options: { onSuccess?: () => void } = {}
	) {
		if (!response) return;
		const { id, name } = response;

		if (!name.trim() || !id.trim()) {
			toastStore.trigger({
				message: 'Please enter both workspace ID and name',
				background: 'variant-filled-error',
			});
			setTimeout(() => this.showCreateFromIdModal(options), 100);
			return;
		}

		try {
			// Fetch the workspace from the server
			const templateWorkspace = await sessionViewModel.getWorkspace(id);

			// Copy the workspace
			const newWorkspace = await sessionViewModel.createWorkspace(name, templateWorkspace.id);
			await sessionViewModel.loadWorkspaces();
			await sessionViewModel.selectWorkspace(newWorkspace.id);
			toastStore.trigger({
				message: 'Workspace created',
				background: 'variant-filled-success',
			});
			options.onSuccess?.();
		} catch {
			toastStore.trigger({
				message: 'Failed to create workspace. Did you enter a correct existing ID?',
				background: 'variant-filled-error',
			});
			if (!sessionViewModel.hasWorkspaces) {
				setTimeout(() => this.showCreateFromIdModal(options), 100);
			}
		}
	},

	async showDeleteWorkspaceModal(workspaceId: string, workspaceName: string) {
		modalStore.trigger({
			type: 'confirm',
			title: 'Delete Workspace',
			body: `Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`,
			response: async (r) => {
				if (r) {
					await sessionViewModel.deleteWorkspace(workspaceId);
					if (sessionViewModel.error) {
						toastStore.trigger({
							message: `Failed to delete workspace (error: ${sessionViewModel.error}). Please try again later.`,
							background: 'variant-filled-error',
						});
					} else {
						toastStore.trigger({
							message: 'Workspace deleted',
							background: 'variant-filled-success',
						});
					}
				}
			},
		});
	},
});
