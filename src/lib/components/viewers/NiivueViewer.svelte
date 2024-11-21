<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import { runViewModel } from '$lib/viewmodels/run.svelte';
	import type { Case } from '$lib/models/types';
	import type { RgbaColor } from 'svelte-awesome-color-picker';

	const { case_ } = $props<{ case_: Case }>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;
	let isInitialized = $state(false);

	function rgbaColorToColorMap(rgbaColor: RgbaColor) {
		return {
			R: [0, 1, rgbaColor.r],
			G: [0, 1, rgbaColor.g],
			B: [0, 1, rgbaColor.b],
			A: [0, 255, 255],
			I: [0, 1, 255],
		};
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
					await loadAllLayers();
				}
			} catch (error) {
				console.error('Failed to initialize Niivue:', error);
			}
		}
	});

	// Reload layers when selection changes
	$effect(() => {
		if (isInitialized) {
			const datasetLayers = layerViewModel.selectedLayersForCase(case_.id);
			const runLayers = runViewModel.selectedLayersForCase(case_.id);
			if (datasetLayers.length > 0 || runLayers.length > 0) {
				loadAllLayers();
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

	async function loadAllLayers() {
		if (!nv) return;

		try {
			nv.volumes = [];

			// Load dataset layers
			const datasetLayers = layerViewModel.selectedLayersWithStylesForCase(case_.id);
			for (const { layer, style } of datasetLayers) {
				const rgbaColor = style?.color;
				await loadLayer(layer, rgbaColor);
			}

			// Load run layers
			const runLayers = runViewModel.selectedLayersWithStylesForCase(case_.id);
			for (const { layer, style } of runLayers) {
				const rgbaColor = style?.color;
				await loadLayer(layer, rgbaColor);
			}

			nv.drawScene();
		} catch (error) {
			console.error('Failed to load layers:', error);
		}
	}

	async function loadLayer(layer: { id: string; path: string }, rgbaColor?: RgbaColor) {
		if (!rgbaColor) {
			await nv.addVolumeFromUrl({
				url: layer.path,
			});
		} else {
			const layerColorMap = rgbaColorToColorMap(rgbaColor);
			nv.addColormap(layer.id, layerColorMap);
			await nv.addVolumeFromUrl({
				url: layer.path,
				opacity: rgbaColor.a,
				colormap: layer.id,
			});
		}
	}

	async function updateAllLayerStyles() {
		if (!nv) return;

		// Update main layers styles
		const mainLayersStyles = layerViewModel.styles;
		for (const [layerId, style] of Object.entries(mainLayersStyles)) {
			const rgbaColor = style?.color;
			if (rgbaColor) {
				updateLayerStyle(layerId, rgbaColor);
			}
		}

		// Update run layers styles
		const runLayersStyles = runViewModel.layerStates.map((state) => state.styles);
		for (const state of runLayersStyles) {
			for (const [layerId, style] of Object.entries(state)) {
				const rgbaColor = style?.color;
				if (rgbaColor) {
					updateLayerStyle(layerId, rgbaColor);
				}
			}
		}

		nv.updateGLVolume();
	}

	function updateLayerStyle(layerId: string, rgbaColor: RgbaColor) {
		const layerColorMap = rgbaColorToColorMap(rgbaColor);
		nv.addColormap(layerId, layerColorMap);
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
