<script lang="ts">
	import { onMount } from 'svelte';

	export let side: 'left' | 'right' = 'left';
	export let defaultWidth = '300px';
	export let minWidth = 150;
	export let maxWidth = 800;

	let sidebarElement: HTMLElement;
	let isCollapsed = false;

	function initResize(event: MouseEvent) {
		event.preventDefault();

		const startX = event.pageX;
		const startWidth = sidebarElement.offsetWidth;

		function onMouseMove(e: MouseEvent) {
			const width =
				side === 'left' ? startWidth + (e.pageX - startX) : startWidth - (e.pageX - startX);

			if (width > minWidth && width < maxWidth) {
				sidebarElement.style.width = `${width}px`;
			}
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			document.body.style.cursor = 'default';
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		document.body.style.cursor = 'col-resize';
	}

	function toggleCollapse() {
		if (isCollapsed) {
			sidebarElement.style.width = defaultWidth;
		} else {
			sidebarElement.style.width = '2.5rem';
		}
		isCollapsed = !isCollapsed;
	}

	onMount(() => {
		sidebarElement.style.width = defaultWidth;
	});
</script>

<aside
	bind:this={sidebarElement}
	class="sidebar bg-surface-100-800-token border-{side === 'left'
		? 'r'
		: 'l'} border-surface-500/30 relative flex"
>
	<!-- Content container -->
	<div class="flex-1 overflow-hidden flex flex-col h-full" class:invisible={isCollapsed}>
		<slot />

		<!-- Toggle button when expanded -->
		{#if !isCollapsed}
			<button
				class="btn-icon variant-soft absolute z-10 transition-all duration-200 top-2 {side ===
				'left'
					? 'right-2'
					: 'left-2'} rounded-full"
				on:click={toggleCollapse}
			>
				<i class="fa-solid fa-chevron-{side === 'left' ? 'left' : 'right'}" />
			</button>
		{/if}
	</div>

	<!-- Toggle button container - only shown when collapsed -->
	{#if isCollapsed}
		<div class="w-full flex justify-center">
			<button class="btn-icon variant-soft rounded" on:click={toggleCollapse}>
				<i class="fa-solid fa-chevron-{side === 'left' ? 'right' : 'left'}" />
			</button>
		</div>
	{/if}

	<!-- Resize handle -->
	{#if !isCollapsed}
		<button
			class="absolute top-0 {side === 'left'
				? 'right-0'
				: 'left-0'} w-1 h-full cursor-col-resize hover:bg-primary-500"
			aria-label="Resize sidebar"
			on:mousedown={initResize}
		/>
	{/if}
</aside>
