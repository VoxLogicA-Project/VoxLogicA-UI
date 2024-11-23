<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { ColorMap } from '$lib/models/types';

	let { value = $bindable<ColorMap | string>(), id } = $props();

	const popupId = `colormap-picker-${id}`;

	// Predefined colormap names
	const presetColorMaps = ['gray', 'red'];

	function createCustomColorMap(r: number, g: number, b: number) {
		const colorMap = {
			R: [0, 1, r],
			G: [0, 1, g],
			B: [0, 1, b],
			A: [0, 255, 255],
			I: [0, 1, 255],
		};
		value = colorMap;
	}
</script>

<div class="relative">
	<button
		use:popup={{
			event: 'click',
			target: popupId,
			placement: 'top',
		}}
		class="btn variant-filled"
		aria-label="Color Map Picker"
	>
		<div
			class="w-6 h-6 rounded"
			style="background: rgb({value?.R?.[2] ?? 0}, {value?.G?.[2] ?? 0}, {value?.B?.[2] ?? 0})"
		></div>
	</button>

	<div class="card p-4 w-64 shadow-xl fixed" data-popup={popupId} style="z-index: 1000;">
		<div class="flex flex-col gap-2">
			<h3 class="h4">Preset Colormaps</h3>
			<select class="select" onchange={(e) => (value = e.currentTarget.value)}>
				<option value="">Custom</option>
				{#each presetColorMaps as name}
					<option value={name}>{name}</option>
				{/each}
			</select>

			<h3 class="h4 mt-4">Custom Color</h3>
			<input
				type="color"
				oninput={(e) => {
					const hex = e.currentTarget.value;
					const r = parseInt(hex.slice(1, 3), 16);
					const g = parseInt(hex.slice(3, 5), 16);
					const b = parseInt(hex.slice(5, 7), 16);
					createCustomColorMap(r, g, b);
				}}
			/>
		</div>
	</div>
</div>
