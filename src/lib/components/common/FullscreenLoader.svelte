<script lang="ts">
	import { fade } from 'svelte/transition';

	let { text = '' } = $props();
</script>

<div
	class="fixed inset-0 z-[9999] backdrop-blur-sm bg-surface-900/30 transition-all duration-200"
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 200 }}
>
	<div class="h-full w-full flex items-center justify-center">
		<div class="text-center">
			<i class="fa-solid fa-spinner animate-spin text-4xl text-surface-900-50-token"></i>
			<p class="mt-4 text-lg font-medium text-surface-900-50-token">{text}</p>
		</div>
	</div>
</div>

<style>
	/* Ensure the loader is always on top */
	:global(body:has(.fixed[data-fullscreen-loader])) {
		overflow: hidden;
	}
</style>
