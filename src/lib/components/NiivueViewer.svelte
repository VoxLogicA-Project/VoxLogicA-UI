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

				if (mainState.layers.selected[case_.id]) {
					await loadCaseLayers();
				}
			} catch (error) {
				console.error('Failed to initialize Niivue:', error);
			}
		}
	});

	$effect(() => {
		if (isInitialized && mainState.layers.selected[case_.id]) {
			loadCaseLayers();
		}
	});

	$effect(() => {
		if (isInitialized && mainState.layers.styles) {
			updateLayerStyles();
		}
	});

	async function loadCaseLayers() {
		if (!mainState.datasets.selected || !nv) return;

		try {
			nv.volumes = [];

			const selectedLayers = mainState.layers.selected[case_.id] || [];
			for (const layer of selectedLayers) {
				const rgbaColor = mainState.layers.styles[layer.id]?.color;
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

			nv.drawScene();
		} catch (error) {
			console.error('Failed to load layers:', error);
		}
	}

	async function updateLayerStyles() {
		const selectedLayers = mainState.layers.selected[case_.id] || [];
		for (const layer of selectedLayers) {
			const rgbaColor = mainState.layers.styles[layer.id]?.color;
			if (rgbaColor) {
				const layerColorMap = rgbaColorToColorMap(rgbaColor);
				nv.addColormap(layer.id, layerColorMap);
				nv.updateGLVolume();
			}
		}
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
