<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import type { Case, ColorMap } from '$lib/models/types';

	const { case_ } = $props<{ case_: Case }>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;
	let isInitialized = $state(false);
	let loadingOperationCounter = $state(0);

	function setColorMap(layerId: string, colorMap: ColorMap | string) {
		if (!isInitialized) return;

		if (typeof colorMap === 'string') return colorMap;
		nv.addColormap(layerId, colorMap);
		return layerId;
	}

	onMount(async () => {
		if (browser) {
			try {
				// Import Niivue on browser only
				const NiivueModule = await import('@niivue/niivue');
				Niivue = NiivueModule.Niivue;
				nv = new Niivue({
					backColor: [0, 0, 0, 1],
					show3Dcrosshair: true,
					dragMode: 0,
					smoothDisplay: false,
				});
				await nv.attachToCanvas(canvas);
				isInitialized = true;

				// Load layers if any are selected
				if (
					layerViewModel.selectedLayersForCase(case_.id).length > 0 ||
					runViewModel.selectedLayersForCase(case_.id).length > 0
				) {
					await loadAllLayers(++loadingOperationCounter);
				}
			} catch (error) {
				console.error('Failed to initialize Niivue:', error);
			}
		}
	});

	$effect(() => {
		if (isInitialized) {
			const datasetLayers = layerViewModel.selectedLayersForCase(case_.id);
			const runLayers = runViewModel.selectedLayersForCase(case_.id);
			if (datasetLayers.length > 0 || runLayers.length > 0) {
				// Debounce loading layers to avoid multiple re-renders
				const timeoutId = setTimeout(() => {
					loadAllLayers(++loadingOperationCounter);
				}, 1000);

				return () => {
					clearTimeout(timeoutId);
				};
			}
		}
	});

	// Update layer styles when they change
	$effect(() => {
		if (isInitialized) {
			const datasetLayersStyles = layerViewModel.styles;
			const runLayersStyles = runViewModel.layerStates.map((state) => state.styles);
			if (datasetLayersStyles || runLayersStyles) {
				updateAllLayerStyles();
			}
		}
	});

	async function loadAllLayers(operationId: number) {
		if (!nv) return;
		if (operationId !== loadingOperationCounter) return;

		try {
			// Get current and desired layers
			const currentVolumes = nv.volumes.map((vol: any) => vol.url);
			const datasetLayers = layerViewModel.selectedLayersWithColorMapsForCase(case_.id);
			const runLayers = runViewModel.selectedLayersWithColorMapsForCase(case_.id);
			const desiredLayers = [...datasetLayers, ...runLayers];

			// Remove layers that are no longer needed
			const layersToRemove = currentVolumes.filter(
				(url: string) => !desiredLayers.some((layer: any) => layer.layer.path === url)
			);
			for (const url of layersToRemove) {
				const volumeIndex = nv.volumes.findIndex((vol: any) => vol.url === url);
				if (volumeIndex !== -1) {
					nv.removeVolumeByIndex(volumeIndex);
				}
			}

			// Add only new layers
			for (const { layer, colorMap } of desiredLayers) {
				if (!currentVolumes.includes(layer.path)) {
					await loadLayer(layer, colorMap);
				}
			}

			nv.drawScene();
		} catch (error) {
			console.error('Failed to load layers:', error);
		}
	}

	async function loadLayer(layer: { id: string; path: string }, colorMap?: ColorMap | string) {
		if (!colorMap) {
			await nv.addVolumeFromUrl({
				url: layer.path,
				id: layer.id,
			});
		} else {
			const colorMapId = setColorMap(layer.id, colorMap);
			await nv.addVolumeFromUrl({
				url: layer.path,
				colormap: colorMapId,
				id: layer.id,
			});
		}
	}

	async function updateAllLayerStyles() {
		if (!nv) return;

		const updateLayerStyles = (layersWithColorMaps: any[]) => {
			for (const { layer, colorMap } of layersWithColorMaps) {
				const volumeIndex = nv.volumes.findIndex((vol: any) => vol.url === layer.path);
				if (volumeIndex !== -1) {
					const colorMapId = setColorMap(layer.id, colorMap);
					nv.setColormap(nv.volumes[volumeIndex].id, colorMapId);
				}
			}
		};

		updateLayerStyles(layerViewModel.selectedLayersWithColorMapsForCase(case_.id));
		updateLayerStyles(runViewModel.selectedLayersWithColorMapsForCase(case_.id));
	}

	onDestroy(() => {
		if (nv) {
			nv.closeDrawing();
		}
	});
</script>

<div bind:this={container} class="relative w-full aspect-square">
	<canvas bind:this={canvas} class="w-full h-full bg-black" aria-label="Niivue Viewer"></canvas>
</div>
