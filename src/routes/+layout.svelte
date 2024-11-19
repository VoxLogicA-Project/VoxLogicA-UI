<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { initializeStores, Toast, Modal } from '@skeletonlabs/skeleton';
	import { mainState } from '$lib/modelviews/mainState.svelte';

	initializeStores();

	// Initialize theme based on system preference
	$effect(() => {
		if (mainState.ui.isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	onMount(() => {
		// Check system preference and set initial theme
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			mainState.ui.isDarkMode = true;
		}

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (e.matches) {
				mainState.ui.isDarkMode = true;
			} else {
				mainState.ui.isDarkMode = false;
			}
		});
	});

	let { children } = $props();
</script>

<Toast />
<Modal regionBody="max-h-[70vh] overflow-auto" />
<AppShell>
	{@render children?.()}
</AppShell>
