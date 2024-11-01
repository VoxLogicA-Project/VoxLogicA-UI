<script lang="ts">
    import { onMount } from 'svelte';
    import { scanUrlsStore, loadScansData } from '$lib/stores/scans';

    // Log the transformed URLs when they're available
    $: if ($scanUrlsStore) {
        console.log('Scan URLs:', $scanUrlsStore.imageUrls);
    }

    onMount(() => {
        loadScansData();
    });
</script>

<div class="size-full bg-white text-black">    
    {#if $scanUrlsStore}
        <p>Scans loaded! Check the console.</p>
    {:else}
        <p>Loading scans...</p>
    {/if}
</div>