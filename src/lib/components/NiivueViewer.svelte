<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { datasetStore } from '$lib/viewmodels/datasetStore';
	import type { Case, Layer } from '$lib/models/dataset';

	export let case_: Case;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;

	// Add state for layers
	let layers: Layer[] = [];

	// Add resize observer to handle container size changes
	let resizeObserver: ResizeObserver;

	onMount(async () => {
		if (browser) {
			// Only import Niivue in the browser
			const NiivueModule = await import('@niivue/niivue');
			Niivue = NiivueModule.Niivue;

			// Initialize Niivue
			nv = new Niivue({
				backColor: [0, 0, 0, 1],
				show3Dcrosshair: true,
				// Add these options to improve performance
				dragMode: 0,
				smoothDisplay: false,
			});
			nv.attachToCanvas(canvas);

			// Setup resize observer
			resizeObserver = new ResizeObserver(() => {
				if (nv) {
					nv.drawScene();
				}
			});
			resizeObserver.observe(container);

			// Fetch layers for this case
			if ($datasetStore.currentDataset) {
				const response = await fetch(
					`/datasets/${$datasetStore.currentDataset.path}/cases/${case_.id}/layers`
				);
				layers = await response.json();
			}
		}
	});

	$: if (nv && $datasetStore.selectedLayers[case_.id]) {
		loadCaseLayers();
	}

	async function loadCaseLayers() {
		if (!$datasetStore.currentDataset || !nv) return;

		// Clear existing volumes
		nv.volumes = [];

		try {
			// Load all selected layers in white
			const selectedLayers = $datasetStore.selectedLayers[case_.id] || [];
			for (const layer of selectedLayers) {
				await nv.addVolumeFromUrl({
					url: layer.path,
					colormap: 'gray', // Use gray/white colormap for all layers
					opacity: 1,
				});
			}

			nv.drawScene();
		} catch (error) {
			console.error('Failed to load layers:', error);
		}
	}

	onDestroy(() => {
		if (nv) {
			nv.closeDrawing();
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});
</script>

<div bind:this={container} class="relative w-full aspect-square">
	<canvas bind:this={canvas} class="w-full h-full bg-black" />
</div>
