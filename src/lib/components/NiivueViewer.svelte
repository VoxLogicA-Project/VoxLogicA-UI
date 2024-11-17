<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { mainStore } from '$lib/stores/mainStore';
	import type { Case } from '$lib/models/types';

	export let case_: Case;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;
	let resizeObserver: ResizeObserver;

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

			resizeObserver = new ResizeObserver(() => {
				if (nv) {
					nv.drawScene();
				}
			});
			resizeObserver.observe(container);
		}
	});

	$: if (nv && $mainStore.layers.selected[case_.id]) {
		loadCaseLayers();
	}

	async function loadCaseLayers() {
		if (!$mainStore.datasets.selected || !nv) return;

		nv.volumes = [];

		try {
			const selectedLayers = $mainStore.layers.selected[case_.id] || [];
			for (const layer of selectedLayers) {
				const style = $mainStore.layers.styles[layer.id];
				await nv.addVolumeFromUrl({
					url: layer.path,
					colormap: style?.color ? 'custom' : 'gray',
					opacity: style?.color?.a ?? 1,
					colormap_custom: style?.color
						? [style.color.r / 255, style.color.g / 255, style.color.b / 255]
						: undefined,
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
