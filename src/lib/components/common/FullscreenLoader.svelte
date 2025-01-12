<script lang="ts">
	import { fade } from 'svelte/transition';

	// Add type definition for props
	interface LoaderProps {
		/** Optional text to display below the spinner */
		text?: string;
	}

	let { text = '' }: LoaderProps = $props();
</script>

<div
	class="fixed inset-0 z-[9999] backdrop-blur-sm bg-surface-900/30 transition-all duration-200"
	role="alert"
	aria-busy="true"
	aria-label="Loading content"
	data-fullscreen-loader
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 200 }}
>
	<div class="h-full w-full flex items-center justify-center">
		<div class="text-center">
			<i
				class="fa-solid fa-spinner animate-spin text-4xl text-surface-900-50-token"
				aria-hidden="true"
			></i>
			{#if text}
				<p class="mt-4 text-lg font-medium text-surface-900-50-token">{text}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Prevent scrolling of the body when the loader is active */
	:global(body:has(.fixed[data-fullscreen-loader])) {
		overflow: hidden;
	}
</style>
