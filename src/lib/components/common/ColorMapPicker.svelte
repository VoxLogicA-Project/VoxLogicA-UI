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

	let activeTab: 'preset' | 'custom' = $state('preset');

	// Add this function to handle tab changes
	function setActiveTab(tab: 'preset' | 'custom') {
		activeTab = tab;
		if (tab === 'preset' && presetColorMaps.length > 0) {
			value = presetColorMaps[0];
		}
	}
</script>

<div class="relative">
	<button
		use:popup={{
			event: 'click',
			target: popupId,
			placement: 'top',
			closeQuery: '.popup-close',
		}}
		class="w-8 h-8 rounded-lg shadow-sm hover:shadow-md border border-surface-300-600-token"
		style="background: rgb({value?.R?.[2] ?? 255}, {value?.G?.[2] ?? 255}, {value?.B?.[2] ?? 255})"
		aria-label="Color Map Picker"
	>
	</button>

	<div class="card p-4 w-72 shadow-xl fixed" data-popup={popupId} style="z-index: 1000;">
		<div class="flex flex-col gap-4">
			<!-- Tab buttons -->
			<div class="flex gap-2">
				<button
					class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
					'preset'
						? 'bg-primary-500 text-white'
						: 'bg-surface-200-700-token hover:bg-surface-300-600-token'}"
					onclick={() => setActiveTab('preset')}
				>
					Preset Maps
				</button>
				<button
					class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
					'custom'
						? 'bg-primary-500 text-white'
						: 'bg-surface-200-700-token hover:bg-surface-300-600-token'}"
					onclick={() => setActiveTab('custom')}
				>
					Custom Color
				</button>
			</div>

			<!-- Tab content - Add min-height here -->
			<div class="min-h-[48px]">
				{#if activeTab === 'preset'}
					<div class="space-y-2">
						<select class="select w-full" bind:value>
							<option value="" disabled>Choose a colormap...</option>
							{#each presetColorMaps as name}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="space-y-2">
						<input
							type="color"
							class="w-full h-10 rounded-lg cursor-pointer appearance-none border-0 !p-0"
							style="background-color: transparent;"
							oninput={(e) => {
								const hex = e.currentTarget.value;
								const r = parseInt(hex.slice(1, 3), 16);
								const g = parseInt(hex.slice(3, 5), 16);
								const b = parseInt(hex.slice(5, 7), 16);
								createCustomColorMap(r, g, b);
							}}
						/>
					</div>
				{/if}
			</div>
		</div>
		<div class="arrow"></div>
	</div>
</div>
