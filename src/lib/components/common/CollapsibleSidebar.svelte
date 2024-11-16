<script lang="ts">
	import { onMount } from 'svelte';

	export let side: 'left' | 'right' | 'top' | 'bottom' = 'left';
	export let defaultSize = '300px';
	export let minSize = 150;
	export let maxSize = 800;

	let sidebarElement: HTMLElement;
	let isCollapsed = false;

	// Determine if sidebar is vertical (left/right) or horizontal (top/bottom)
	$: isVertical = side === 'left' || side === 'right';

	function initResize(event: MouseEvent) {
		event.preventDefault();

		const startPos = isVertical ? event.pageX : event.pageY;
		const startSize = isVertical ? sidebarElement.offsetWidth : sidebarElement.offsetHeight;

		function onMouseMove(e: MouseEvent) {
			const currentPos = isVertical ? e.pageX : e.pageY;
			const size =
				side === 'left' || side === 'top'
					? startSize + (currentPos - startPos)
					: startSize - (currentPos - startPos);

			if (size > minSize && size < maxSize) {
				sidebarElement.style[isVertical ? 'width' : 'height'] = `${size}px`;
			}
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			document.body.style.cursor = 'default';
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
	}

	function toggleCollapse() {
		if (isCollapsed) {
			sidebarElement.style[isVertical ? 'width' : 'height'] = defaultSize;
		} else {
			sidebarElement.style[isVertical ? 'width' : 'height'] = '40px'; // Increased from 2.5rem for better visibility
		}
		isCollapsed = !isCollapsed;
	}

	onMount(() => {
		sidebarElement.style[isVertical ? 'width' : 'height'] = defaultSize;
	});
</script>

<aside
	bind:this={sidebarElement}
	class="sidebar bg-surface-100-800-token relative border-surface-500/30 {isVertical
		? 'flex flex-col'
		: 'w-full'}"
	class:border-r={side === 'left'}
	class:border-l={side === 'right'}
	class:border-t={side === 'bottom'}
	class:border-b={side === 'top'}
>
	<!-- Content container -->
	<div
		class="overflow-hidden relative {isVertical ? 'flex-1 flex flex-col pr-1' : 'w-full h-full'}"
		class:hidden={isCollapsed}
	>
		<slot />
	</div>

	<!-- Toggle button when expanded -->
	{#if !isCollapsed}
		{#if side === 'bottom'}
			<button
				class="btn variant-ghost-surface absolute z-10 transition-all duration-200 w-7 h-7"
				style="left: 0; top: 0;"
				on:click={toggleCollapse}
			>
				<i class="fa-solid fa-chevron-down" />
			</button>
		{:else if side === 'top'}
			<button
				class="btn variant-ghost-surface absolute z-10 transition-all duration-200 w-7 h-7"
				style="left: 0; bottom: 0;"
				on:click={toggleCollapse}
			>
				<i class="fa-solid fa-chevron-up" />
			</button>
		{:else}
			<!-- Left/Right sidebar collapse button -->
			<button
				class="btn variant-ghost-surface absolute z-10 transition-all duration-200 w-7 h-7"
				style="top: 0; {side === 'left' ? 'right: 0' : 'left: 0'};"
				on:click={toggleCollapse}
			>
				<i class="fa-solid {side === 'left' ? 'fa-chevron-left' : 'fa-chevron-right'}" />
			</button>
		{/if}
	{/if}

	<!-- Toggle button container - only shown when collapsed -->
	{#if isCollapsed}
		<div class="w-full h-full flex items-center justify-center">
			<button
				class="w-full h-full btn variant-soft rounded-none flex items-center justify-center"
				on:click={toggleCollapse}
			>
				<i
					class="fa-solid {side === 'left'
						? 'fa-chevron-right'
						: side === 'right'
							? 'fa-chevron-left'
							: side === 'top'
								? 'fa-chevron-down'
								: 'fa-chevron-up'}"
				/>
			</button>
		</div>
	{/if}

	<!-- Resize handle -->
	{#if !isCollapsed}
		<button
			class="absolute {isVertical
				? 'w-1 h-full cursor-col-resize'
				: 'w-full h-1 cursor-row-resize'} hover:bg-primary-500"
			class:right-0={side === 'left'}
			class:left-0={side === 'right'}
			class:bottom-0={side === 'top'}
			class:top-0={side === 'bottom'}
			aria-label="Resize sidebar"
			on:mousedown={initResize}
		/>
	{/if}
</aside>
