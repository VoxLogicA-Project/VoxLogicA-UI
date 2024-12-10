<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { initializeStores, Toast, Modal } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';
	import { sessionViewModel } from '$lib/viewmodels/session.svelte';
	import CreateFromIdModal from '$lib/components/navigation/CreateFromIdModal.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	const modalComponentRegistry = {
		createFromIdModal: { ref: CreateFromIdModal },
	};

	// Change theme based on system preference
	$effect(() => {
		document.documentElement.classList.toggle('dark', uiViewModel.state.isDarkMode);
	});

	onMount(() => {
		// Check system preference and set initial theme
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			uiViewModel.state.isDarkMode = true;
		}

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (e.matches) {
				uiViewModel.state.isDarkMode = true;
			} else {
				uiViewModel.state.isDarkMode = false;
			}
		});

		// Add beforeunload event listener
		window.addEventListener('beforeunload', (event) => {
			// Check if there are unsaved changes
			if (sessionViewModel.hasUnsavedChanges) {
				event.preventDefault();
				event.returnValue = ''; // This is required for Chrome to show the warning
			}
		});
	});

	let { children } = $props();
</script>

<Toast />
<Modal components={modalComponentRegistry} />
<AppShell>
	{@render children?.()}
</AppShell>
