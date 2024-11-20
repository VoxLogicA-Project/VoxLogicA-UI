<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { mainState } from '$lib/modelviews/mainState.svelte';
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
				if (mainState.layers.selected[case_.id]) {
					await loadAllLayers();
				}
			} catch (error) {
				console.error('Failed to initialize Niivue:', error);
			}
		}
	});

	// Watch for changes in layer selection across all states
	$effect(() => {
		console.log('NiivueViewer effect');
		if (isInitialized) {
			const hasMainLayers = mainState.layers.selected[case_.id];
			const hasRunLayers = mainState.runs.layersStates.some(
				(state) => state.selected[case_.id]?.length > 0
			);
			if (hasMainLayers || hasRunLayers) {
				loadAllLayers();
			}
		}
	});

	// Watch for changes in layer styles across all states
	$effect(() => {
		if (isInitialized) {
			const hasMainStyles = mainState.layers.styles;
			const hasRunStyles = mainState.runs.layersStates.some((state) => state.styles);
			if (hasMainStyles || hasRunStyles) {
				updateAllLayerStyles();
			}
		}
	});

	async function loadAllLayers() {
		if (!nv) return;

		try {
			nv.volumes = [];

			// Load main layers
			const mainLayers = mainState.layers.selected[case_.id] || [];
			for (const layer of mainLayers) {
				const rgbaColor = mainState.layers.styles[layer.id]?.color;
				await loadLayer(layer, rgbaColor);
			}

			// Load run layers
			for (const layerState of mainState.runs.layersStates) {
				const runLayers = layerState.selected[case_.id] || [];
				for (const layer of runLayers) {
					const rgbaColor = layerState.styles[layer.id]?.color;
					await loadLayer(layer, rgbaColor);
				}
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

		// Update main layers
		const mainLayers = mainState.layers.selected[case_.id] || [];
		for (const layer of mainLayers) {
			const rgbaColor = mainState.layers.styles[layer.id]?.color;
			if (rgbaColor) {
				updateLayerStyle(layer.id, rgbaColor);
			}
		}

		// Update run layers
		for (const layerState of mainState.runs.layersStates) {
			const runLayers = layerState.selected[case_.id] || [];
			for (const layer of runLayers) {
				const rgbaColor = layerState.styles[layer.id]?.color;
				if (rgbaColor) {
					updateLayerStyle(layer.id, rgbaColor);
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
