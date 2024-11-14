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
					nv.resizeCanvas();
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

				// Set first layer as base layer if available
				if (layers.length > 0) {
					datasetStore.setBaseLayer(case_.id, layers[0]);
					await loadCaseLayers();
				}
			}
		}
	});

	$: if (
		nv &&
		($datasetStore.selectedBaseLayer[case_.id] || $datasetStore.selectedLayers[case_.id])
	) {
		loadCaseLayers();
	}

	async function loadCaseLayers() {
		if (!$datasetStore.currentDataset || !nv) return;

		// Clear existing volumes
		nv.volumes = [];

		// Get base layer and overlay layers for this case
		const baseLayer = $datasetStore.selectedBaseLayer[case_.id];
		const overlayLayers = $datasetStore.selectedLayers[case_.id] || [];

		try {
			// Load base layer first
			if (baseLayer) {
				const volumePath = `/datasets/${baseLayer.path}`;
				await nv.addVolumeFromUrl({
					url: volumePath,
					name: `${case_.id} - ${baseLayer.id}`,
					colormap: 'gray',
				});
			}

			// Load overlay layers
			for (const layer of overlayLayers) {
				const volumePath = `/datasets/${layer.path}`;
				await nv.addVolumeFromUrl({
					url: volumePath,
					name: `${case_.id} - ${layer.id}`,
					colormap: 'red',
					opacity: 0.5,
				});
			}

			// Refresh the view
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
