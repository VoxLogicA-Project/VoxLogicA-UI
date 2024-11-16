<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';

	function toggleDarkMode() {
		const html = document.documentElement;
		html.classList.toggle('dark');
	}
</script>

<AppShell>
	<slot />

	<!-- Dark mode toggle button - fixed dimensions and centering -->
	<button
		class="fixed top-4 right-[calc(1rem+var(--scrollbar-width,16px))] w-10 h-10 rounded-full bg-surface-300-600-token hover:bg-surface-400-500-token shadow-lg flex items-center justify-center"
		on:click={toggleDarkMode}
		title="Toggle dark mode"
	>
		<i class="fa-solid fa-sun text-lg hidden dark:block" />
		<i class="fa-solid fa-moon text-lg block dark:hidden" />
	</button>
</AppShell>
