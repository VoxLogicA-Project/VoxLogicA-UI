<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { layerViewModel } from '$lib/viewmodels/layer.svelte';
	import type { Case, Layer, LayerStyle } from '$lib/models/types';
	import { debounce } from 'ts-debounce';

	const { case_ } = $props<{ case_: Case }>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let nv: any;
	let Niivue: any;
	let isInitialized = $state(false);

	function getVolumeIndex(layerPath: string) {
		return nv.volumes.findIndex((vol: any) => vol.url === layerPath);
	}

	function setColorMap(layerPath: Layer['path'], colorMap: LayerStyle['colorMap']) {
		if (!isInitialized) return;

		if (typeof colorMap === 'string') return colorMap;
		nv.addColormap(layerPath, colorMap);
		return layerPath;
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
					logLevel: 'error',
					dragAndDropEnabled: false,
				});
				await nv.attachToCanvas(canvas);
				isInitialized = true;

				// Load layers if any are selected
				if (layerViewModel.getAllSelectedLayersNoContext(case_.path).length > 0) {
					await debouncedLoadAllLayers();
				}
			} catch (error) {
				console.error('Failed to initialize Niivue:', error);
			}
		}
	});

	// Reload layers when selected layers change
	$effect(() => {
		if (isInitialized) {
			if (layerViewModel.getAllSelectedLayersNoContext(case_.path).length > 0) {
				debouncedLoadAllLayers();
			}
		}
	});

	// Update layer styles when selected layers change
	$effect(() => {
		if (isInitialized) {
			const desiredLayers = $state.snapshot(
				layerViewModel.getAllSelectedLayersWithLayerStylesNoContext(case_.path)
			);
			desiredLayers.forEach(({ layer, style }) => {
				updateLayerStyle(layer, style);
			});
		}
	});

	const debouncedLoadAllLayers = debounce(loadAllLayers, 1000);

	async function loadAllLayers() {
		if (!nv) return;

		try {
			// Get current and desired layers
			const currentVolumes = nv.volumes.map((vol: any) => vol.url);
			const desiredLayers = layerViewModel.getAllSelectedLayersWithLayerStylesNoContext(case_.path);

			// Remove layers that are no longer needed
			const layersToRemove = currentVolumes.filter(
				(url: string) => !desiredLayers.some((layer: any) => layer.layer.path === url)
			);
			for (const url of layersToRemove) {
				const volumeIndex = getVolumeIndex(url);
				if (volumeIndex !== -1) {
					nv.removeVolumeByIndex(volumeIndex);
				}
			}

			// Add only new layers
			for (const { layer, style } of desiredLayers) {
				if (!currentVolumes.includes(layer.path)) {
					await loadLayer(layer, style);
				}
			}

			nv.updateGLVolume();
		} catch (error) {
			console.error('Failed to load layers:', error);
		}
	}

	async function loadLayer(layer: Layer, style: LayerStyle) {
		const options: any = { url: layer.path };

		if (style.colorMap) {
			options.colormap = setColorMap(layer.path, style.colorMap);
		}
		if (style.alpha !== undefined) {
			options.opacity = style.alpha;
		}

		await nv.addVolumeFromUrl(options);
	}

	function updateLayerStyle(layer: Layer, newStyle: LayerStyle) {
		if (!nv) return;

		const volumeIndex = getVolumeIndex(layer.path);
		if (volumeIndex === -1) return;

		const volume = nv.volumes[volumeIndex];
		const currentStyle = {
			colorMap: volume.colormap,
			alpha: volume.opacity,
		};

		// Only update if styles are different
		// TODO: This does not work when custom colormaps are used
		// (colorMapId will be the same since we are using layer.path)
		// So in that case it will always be updated
		if (currentStyle.colorMap !== newStyle.colorMap || currentStyle.alpha !== newStyle.alpha) {
			const colorMapId = setColorMap(layer.path, newStyle.colorMap);
			nv.setColormap(volume.id, colorMapId);

			if (newStyle.alpha !== undefined) {
				nv.setOpacity(volumeIndex, newStyle.alpha);
			}

			nv.updateGLVolume();
		}
	}

	export async function saveScreenshot() {
		if (!nv || !isInitialized) return;

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `${case_.id}_${timestamp}.png`;

		try {
			await nv.saveScene(filename);
		} catch (error) {
			console.error('Failed to save screenshot:', error);
		}
	}

	onDestroy(() => {
		if (nv) {
			nv.closeDrawing();
		}
	});
</script>

<div bind:this={container} class="w-full h-full">
	<canvas bind:this={canvas} class="bg-black" aria-label="Niivue Viewer"></canvas>
</div>
