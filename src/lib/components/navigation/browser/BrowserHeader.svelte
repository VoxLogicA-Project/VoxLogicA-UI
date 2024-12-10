<script lang="ts">
	import { caseViewModel } from '$lib/viewmodels/case.svelte';
</script>

<header class="px-4 py-3 border-b border-surface-500/10 flex-none">
	<div class="flex items-center justify-between gap-2">
		<span class="text-xl font-bold tracking-wide text-primary-900-50-token truncate">Browser</span>
		<div class="flex-none whitespace-nowrap text-sm">
			<span class="font-bold text-primary-500">{caseViewModel.selectedCases.length}</span>
			<span class="text-surface-600-300-token"
				>/ {caseViewModel.MAX_SELECTED_CASES} cases selected</span
			>
		</div>
	</div>
</header>
