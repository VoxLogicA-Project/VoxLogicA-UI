<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { mainStore } from '$lib/stores/mainStore';
	import { selectedLayersForCase } from '$lib/stores/layerStore';
	import type { Case } from '$lib/models/types';
	import type { RgbaColor } from 'svelte-awesome-color-picker';

	export let case_: Case;

	const selectedLayersForCaseStore = selectedLayersForCase(case_.id);

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;

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
			const NiivueModule = await import('@niivue/niivue');
			Niivue = NiivueModule.Niivue;

			nv = new Niivue({
				backColor: [0, 0, 0, 1],
				show3Dcrosshair: true,
				dragMode: 0,
				smoothDisplay: false,
			});
			nv.attachToCanvas(canvas);
		}
	});

	$: if (nv && $selectedLayersForCaseStore) {
		loadCaseLayers();
	}

	async function loadCaseLayers() {
		if (!$mainStore.datasets.selected || !nv) return;

		nv.volumes = [];

		const selectedLayers = $mainStore.layers.selected[case_.id] || [];
		for (const layer of selectedLayers) {
			const rgbaColor = $mainStore.layers.styles[layer.id]?.color;
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
	}

	onDestroy(() => {
		if (nv) {
			nv.closeDrawing();
		}
	});
</script>

<div bind:this={container} class="relative w-full aspect-square">
	<canvas bind:this={canvas} class="w-full h-full bg-black" />
</div>
