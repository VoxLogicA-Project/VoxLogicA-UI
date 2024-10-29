<script lang="ts">
    import { onMount } from 'svelte';

    let scansData: { images: string[] } | null = null;

    onMount(async () => {
        try {
            const response = await fetch('/brain_scan_examples/scans_db.json');
            scansData = await response.json();
            console.log('Loaded scans data:', scansData);
        } catch (error) {
            console.error('Error loading scans data:', error);
        }
    });
</script>

<div class="size-full bg-white text-black">    
    {#if scansData}
        <p>Scans loaded! Check the console.</p>
    {:else}
        <p>Loading scans...</p>
    {/if}
</div>