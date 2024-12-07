<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';

	const toastStore = getToastStore();

	// Add reactive class based on unsaved changes
	const saveButtonClass = $derived(
		sessionViewModel.hasUnsavedChanges
			? 'bg-error-500 hover:bg-error-600' // Changed from primary to error variant
			: 'bg-surface-300-600-token hover:bg-surface-400-500-token' // Default state
	);

	function handleSave() {
		try {
			sessionViewModel.saveWorkspace();
			toastStore.trigger({
				message: 'Application state saved successfully',
				background: 'variant-filled-success',
			});
		} catch (error) {
			toastStore.trigger({
				message: 'Failed to save application state',
				background: 'variant-filled-error',
			});
		}
	}

	function handleLoad() {
		// TODO: Implement load workspace
		// try {
		// 	sessionViewModel.loadWorkspace();
		// 	toastStore.trigger({
		// 		message: 'Application state restored successfully',
		// 		background: 'variant-filled-success',
		// 	});
		// } catch (error) {
		// 	toastStore.trigger({
		// 		message: 'Failed to load application state',
		// 		background: 'variant-filled-error',
		// 	});
		// }
	}
</script>

<!-- Save State Button -->
<button
	class="w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-lg {saveButtonClass} flex items-center justify-center transition-colors duration-200"
	onclick={handleSave}
	title={sessionViewModel.hasUnsavedChanges ? 'Save changes' : 'No unsaved changes'}
	aria-label={sessionViewModel.hasUnsavedChanges ? 'Save changes' : 'No unsaved changes'}
>
	<i
		class="fa-solid fa-floppy-disk text-lg {sessionViewModel.hasUnsavedChanges
			? 'animate-pulse'
			: ''}"
	></i>
</button>

<!-- Load State Button -->
<button
	class="w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-lg bg-surface-300-600-token hover:bg-surface-400-500-token flex items-center justify-center"
	onclick={handleLoad}
	title="Load saved state"
	aria-label="Load saved state"
>
	<i class="fa-solid fa-rotate-left text-lg"></i>
</button>
