<script lang="ts">
	let {
		side = 'left',
		minSize = 150,
		maxSize = 800,
		startSize = 300,
		currentSize = $bindable(startSize),
		isCollapsed = $bindable(false),
		collapsedSize = 40,
		title = '',
		children,
	} = $props();

	let sidebarElement: HTMLElement;
	const isVertical = side === 'left' || side === 'right';

	function initResize(event: MouseEvent) {
		event.preventDefault();

		const startPos = isVertical ? event.pageX : event.pageY;
		const startSize = isVertical ? sidebarElement.offsetWidth : sidebarElement.offsetHeight;

		function onMouseMove(e: MouseEvent) {
			if (isCollapsed) return;

			const currentPos = isVertical ? e.pageX : e.pageY;
			const size =
				side === 'left' || side === 'top'
					? startSize + (currentPos - startPos)
					: startSize - (currentPos - startPos);

			if (size > minSize && size < maxSize) {
				currentSize = size;
			} else if (size <= minSize) {
				isCollapsed = true;
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

	$effect(() => {
		if (currentSize <= minSize && !isCollapsed) {
			isCollapsed = true;
		}
	});

	$effect(() => {
		if (isCollapsed && currentSize !== collapsedSize) {
			currentSize = collapsedSize;
		}
	});

	$effect(() => {
		sidebarElement.style[isVertical ? 'width' : 'height'] = currentSize + 'px';
	});
</script>

<aside
	bind:this={sidebarElement}
	class="sidebar bg-surface-100-800-token relative border-surface-500/30 flex flex-col}"
	class:border-r={side === 'left'}
	class:border-l={side === 'right'}
	class:border-t={side === 'bottom'}
	class:border-b={side === 'top'}
>
	<!-- Content container -->
	<div class="overflow-hidden relative flex-1 flex flex-col pr-1" class:hidden={isCollapsed}>
		{@render children?.()}
	</div>

	<!-- Toggle button container - only shown when collapsed -->
	{#if isCollapsed}
		<div class="w-full h-full flex items-center justify-center">
			<button
				class="w-full h-full btn variant-soft rounded-none flex {isVertical
					? 'flex-col'
					: ''} items-center justify-center"
				onclick={() => {
					currentSize = startSize;
					isCollapsed = false;
				}}
				aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar`}
			>
				{#if title && isVertical}
					<div class="flex flex-col items-center gap-2 h-full justify-center">
						<i
							class="fa-solid {side === 'left'
								? 'fa-chevron-right'
								: side === 'right'
									? 'fa-chevron-left'
									: side === 'top'
										? 'fa-chevron-down'
										: 'fa-chevron-up'}"
						></i>
						<span
							class="font-medium text-xs tracking-wider opacity-60"
							style="writing-mode: vertical-rl; text-orientation: mixed; transform: rotate({side ===
							'right'
								? 0
								: 180}deg);"
						>
							{title}
						</span>
					</div>
				{:else if title}
					<span class="font-medium text-sm opacity-60">{title}</span>
					<i
						class="fa-solid ml-2 {side === 'left'
							? 'fa-chevron-right'
							: side === 'right'
								? 'fa-chevron-left'
								: side === 'top'
									? 'fa-chevron-down'
									: 'fa-chevron-up'}"
					></i>
				{/if}
			</button>
		</div>
	{/if}

	<!-- Resize handle -->
	{#if !isCollapsed}
		<button
			class="absolute {isVertical
				? 'w-1.5 h-full cursor-col-resize'
				: 'w-full h-1.5 cursor-row-resize'} hover:bg-primary-500"
			class:right-0={side === 'left'}
			class:left-0={side === 'right'}
			class:bottom-0={side === 'top'}
			class:top-0={side === 'bottom'}
			aria-label="Resize sidebar"
			onmousedown={initResize}
		>
		</button>
	{/if}
</aside>
