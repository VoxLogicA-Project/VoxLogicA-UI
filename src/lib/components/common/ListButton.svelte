<script lang="ts">
	let {
		selected = $bindable(false),
		disabled = $bindable(false),
		showBadge = false,
		badgeContent = '',
		isBaseLayer = false,
		children,
	} = $props();
</script>

<button
	class="w-full px-4 py-2.5 text-left transition-all duration-200
		{!disabled ? 'hover:bg-surface-200-700-token hover:pl-6 group' : ''}
		{selected
		? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
		: 'text-surface-900-50-token'}
		{disabled && !isBaseLayer ? 'opacity-50 cursor-default' : ''}"
	on:click
	{disabled}
>
	<div class="flex items-center justify-between">
		<span class="truncate font-medium">
			{@render children?.()}
		</span>

		{#if showBadge && badgeContent}
			<span class="badge badge-sm variant-filled-primary">
				{badgeContent}
			</span>
		{:else if !selected && !disabled}
			<i
				class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
			group-hover:opacity-50 group-hover:translate-x-0"
			></i>
		{/if}
	</div>
</button>
