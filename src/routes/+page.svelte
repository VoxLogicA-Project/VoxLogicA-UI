<script lang="ts">
    import { onMount } from 'svelte';
    import { scanUrlsStore, loadScansData } from '$lib/stores/scans';
    import BrainScans from '$lib/components/BrainScans.svelte';

    onMount(() => {
        loadScansData();
    });
</script>

<div class="container mx-auto p-4">
    {#if $scanUrlsStore}
        <BrainScans scanData={$scanUrlsStore} />
    {:else}
        <div class="flex justify-center items-center h-32">
            <p class="text-lg">Loading scans...</p>
        </div>
    {/if}
</div>