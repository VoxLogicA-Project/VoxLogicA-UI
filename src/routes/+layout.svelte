<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';

	function toggleDarkMode() {
		const html = document.documentElement;
		html.classList.toggle('dark');
	}
</script>

<!-- AppShell wraps the entire app to provide theming -->
<AppShell>
	<slot />

	<!-- Dark mode toggle button -->
	<button
		class="fixed bottom-4 right-4 p-3 rounded-full bg-surface-300-600-token hover:bg-surface-400-500-token shadow-lg"
		on:click={toggleDarkMode}
		title="Toggle dark mode"
	>
		<!-- Sun icon (shown in dark mode) -->
		<svg
			class="w-6 h-6 hidden dark:block"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>

		<!-- Moon icon (shown in light mode) -->
		<svg
			class="w-6 h-6 block dark:hidden"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	</button>
</AppShell>
