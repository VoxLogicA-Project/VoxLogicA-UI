<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { ColorMap } from '$lib/models/types';

	let { value = $bindable<ColorMap | string>(), id } = $props();

	const popupId = `colormap-picker-${id}`;

	// Predefined colormap names (Niivue compatible)
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

	let activeTab: 'preset' | 'custom' = $state('preset');

	function setActiveTab(tab: 'preset' | 'custom') {
		activeTab = tab;
		if (tab === 'preset' && presetColorMaps.length > 0) {
			value = presetColorMaps[0];
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
		style="background: rgb({value?.R?.[2] ?? 255}, {value?.G?.[2] ?? 255}, {value?.B?.[2] ?? 255})"
		aria-label="Color Map Picker"
	>
		<i
			class="fa-solid fa-palette text-base opacity-80 dark:opacity-90"
			style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));"
		></i>
	</button>

	<div class="card p-3 w-64 shadow-xl fixed" data-popup={popupId} style="z-index: 1000;">
		<div class="flex flex-col gap-3">
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
						<select class="select w-full" bind:value>
							<option value="" disabled>Choose a colormap...</option>
							{#each presetColorMaps as name}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="w-full">
						<input
							type="color"
							class="w-full h-10 rounded-container-token cursor-pointer appearance-none border-0 !p-0 hover:scale-[1.02] transition-transform"
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
		</div>
		<div class="arrow bg-surface-100-800-token"></div>
	</div>
</div>
