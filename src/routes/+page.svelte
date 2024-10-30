<script lang="ts">
    import { onMount } from 'svelte';
    import { scansStore, loadScansData } from '$lib/stores/scans';

	$: if ($scansStore) {
        console.log('Loaded scans:', $scansStore);
    }

    onMount(() => {
        loadScansData();
    });
</script>

<div class="size-full bg-white text-black">    
    {#if $scansStore}
        <p>Scans loaded!</p>
    {:else}
        <p>Loading scans...</p>
    {/if}
</div>