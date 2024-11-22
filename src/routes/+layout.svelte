<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { initializeStores, Toast } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { uiViewModel } from '$lib/viewmodels/ui.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	// Initialize theme based on system preference
	$effect(() => {
		if (uiViewModel.isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	onMount(() => {
		// Check system preference and set initial theme
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			uiViewModel.isDarkMode = true;
		}

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (e.matches) {
				uiViewModel.isDarkMode = true;
			} else {
				uiViewModel.isDarkMode = false;
			}
		});
	});

	let { children } = $props();
</script>

<Toast />
<AppShell>
	{@render children?.()}
</AppShell>
