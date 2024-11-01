<!--
    Displays a grid of brain scan images.
-->

<script lang="ts">
	// Import the interface from stores
	import type { ScanUrlsData } from '$lib/stores/scans';

	// Component prop
	export let scanData: ScanUrlsData;
</script>

<div class="grid grid-cols-3 gap-4 p-4">
	{#each scanData.imageUrls as imageUrl, i}
		<div class="card p-4">
			<img src={imageUrl} alt={`Brain scan ${i + 1}`} class="w-full h-auto" loading="lazy" />
		</div>
	{/each}
</div>
