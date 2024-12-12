<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';

	let { id, colormapValue = $bindable(), alphaValue = $bindable(1) } = $props();

	const popupId = `colormap-picker-${id}`;

	// Predefined colormap names (Niivue compatible)
	const presetColorMaps = [
		// Structural/Anatomical data
		'gray',
		'bone',
		// Diverging/Emphasizing layers
		'blue2red',
		'green2orange',
		'cool',
		'hot',
		// Functional data
		'viridis',
		'plasma',
		'magma',
		'inferno',
		'cividis',
		// Monochrome
		'red',
		'green',
		'blue',
	];

	// Add mapping for preset colors with gradients
	const presetColorMapping: Record<string, string> = {
		gray: 'linear-gradient(to right, #666666B3, #ffffffB3)',
		bone: 'linear-gradient(to right, #5b7ba5B3, #e8f0ffB3)',
		blue2red: 'linear-gradient(to right, #0000ffB3, #ff0000B3)',
		green2orange: 'linear-gradient(to right, #00ff00B3, #ffa500B3)',
		cool: 'linear-gradient(to right, #00ffffB3, #ff00ffB3)',
		hot: 'linear-gradient(to right, #000000B3, #ff0000B3, #ffff00B3, #ffffffB3)',
		viridis:
			'linear-gradient(to right, #440154B3, #414487B3, #2a788eB3, #22a884B3, #7ad151B3, #fde725B3)',
		plasma:
			'linear-gradient(to right, #0d0887B3, #6a00a8B3, #b12a90B3, #e16462B3, #fca636B3, #f0f921B3)',
		magma:
			'linear-gradient(to right, #000004B3, #3b0f70B3, #8c2981B3, #de4968B3, #fe9f6dB3, #fcfdbfB3)',
		inferno:
			'linear-gradient(to right, #000004B3, #420a68B3, #932667B3, #dd513aB3, #fca50aB3, #fcffa4B3)',
		cividis:
			'linear-gradient(to right, #002051B3, #322682B3, #6b4c9fB3, #9b7abaB3, #cabfd6B3, #fde4a6B3)',
		red: 'linear-gradient(to right, #000000B3, #ff0000B3)',
		green: 'linear-gradient(to right, #000000B3, #00ff00B3)',
		blue: 'linear-gradient(to right, #000000B3, #0000ffB3)',
	};

	function createCustomColorMap(r: number, g: number, b: number) {
		const colorMap = {
			R: [0, 1, r],
			G: [0, 1, g],
			B: [0, 1, b],
			A: [0, 255, 255],
			I: [0, 1, 255],
		};
		colormapValue = colorMap;
	}

	let activeTab: 'preset' | 'custom' = $state('preset');

	function setActiveTab(tab: 'preset' | 'custom') {
		activeTab = tab;
		if (tab === 'preset' && presetColorMaps.length > 0) {
			colormapValue = presetColorMaps[0];
		}
	}

	function debounce(func: Function, wait: number) {
		let timeout: ReturnType<typeof setTimeout>;
		return (...args: any[]) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	const debouncedCreateCustomColorMap = debounce(createCustomColorMap, 0);
</script>

<div class="relative">
	<button
		use:popup={{
			event: 'click',
			target: popupId,
			placement: 'top',
			closeQuery: '.popup-close',
		}}
		class="btn-icon variant-soft hover:!bg-gradient-to-r hover:!from-[#8B0000B3] hover:!via-[#006400B3] hover:!to-[#00008BB3] hover:!text-white w-8 h-8 !rounded-md"
		style="background: {typeof colormapValue === 'string'
			? (presetColorMapping[colormapValue] ?? 'rgb(255, 255, 255)')
			: `linear-gradient(to right, #000000B3, rgb(${colormapValue?.R?.[2] ?? 255}, ${colormapValue?.G?.[2] ?? 255}, ${colormapValue?.B?.[2] ?? 255})`}"
		aria-label="Color Map Picker"
	>
		<i
			class="fa-solid fa-palette text-base opacity-80 dark:opacity-90"
			style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));"
		></i>
	</button>

	<div class="card p-3 w-64 shadow-xl fixed" data-popup={popupId} style="z-index: 1000;">
		<div class="flex flex-col gap-1">
			<!-- Minimal tabs -->
			<div class="tabs">
				<div class="flex border-b border-surface-400-500-token justify-center">
					<button
						class="tab px-3 py-2 relative transition-all duration-200 {activeTab === 'preset'
							? 'text-primary-500'
							: 'hover:text-primary-400'}"
						onclick={() => setActiveTab('preset')}
					>
						<i class="fa-solid fa-swatchbook mr-2"></i>
						Presets
						{#if activeTab === 'preset'}
							<div
								class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transition-transform duration-200"
							></div>
						{/if}
					</button>
					<button
						class="tab px-3 py-2 relative transition-all duration-200 {activeTab === 'custom'
							? 'text-primary-500'
							: 'hover:text-primary-400'}"
						onclick={() => setActiveTab('custom')}
					>
						<i class="fa-solid fa-droplet mr-2"></i>
						Custom
						{#if activeTab === 'custom'}
							<div
								class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transition-transform duration-200"
							></div>
						{/if}
					</button>
				</div>
			</div>

			<!-- Tab content -->
			<div class="h-[60px] flex items-center justify-center">
				{#if activeTab === 'preset'}
					<div class="w-full">
						<select
							name="colormap_preset"
							class="select w-full"
							value={colormapValue}
							onchange={(e) => (colormapValue = e.currentTarget.value)}
						>
							<option value="" disabled>Choose a colormap...</option>
							{#each presetColorMaps as name}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="w-full">
						<input
							name="colormap_custom"
							type="color"
							class="w-full h-12 cursor-pointer hover:scale-[1.02] transition-transform"
							style="background-color: transparent;"
							oninput={(e) => {
								const hex = e.currentTarget.value;
								const r = parseInt(hex.slice(1, 3), 16);
								const g = parseInt(hex.slice(3, 5), 16);
								const b = parseInt(hex.slice(5, 7), 16);
								debouncedCreateCustomColorMap(r, g, b);
							}}
						/>
					</div>
				{/if}
			</div>

			<!-- Alpha control -->
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between text-sm">
					<span class="flex items-center gap-1.5" title="Adjust layer opacity">
						<i class="fa-solid fa-circle-half-stroke"></i>
						Opacity
					</span>
					<div class="input-group input-group-divider grid-cols-[1fr_auto] w-20">
						<input
							name="colormap_opacity"
							type="number"
							bind:value={alphaValue}
							min="0"
							max="1"
							step="0.01"
							class="input p-1 text-center text-primary-500"
							title="Opacity percentage"
						/>
					</div>
				</div>
				<div class="w-full relative">
					<input
						type="range"
						bind:value={alphaValue}
						min="0"
						max="1"
						step="0.01"
						class="range w-full cursor-pointer"
						title="Drag to adjust opacity"
					/>
					<div
						class="absolute inset-0 rounded-token pointer-events-none"
						style="background: {typeof colormapValue === 'string'
							? (presetColorMapping[colormapValue] ??
								'linear-gradient(to right, transparent, rgb(255, 255, 255))')
							: `linear-gradient(to right, transparent, rgb(${colormapValue?.R?.[2] ?? 255}, ${colormapValue?.G?.[2] ?? 255}, ${colormapValue?.B?.[2] ?? 255}))`}; 
						opacity: 0.1;"
					></div>
				</div>
			</div>
		</div>
		<div class="arrow bg-surface-100-800-token"></div>
	</div>
</div>
