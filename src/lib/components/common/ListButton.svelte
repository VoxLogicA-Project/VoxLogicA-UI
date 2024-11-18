<script lang="ts">
	export let selected = false;
	export let disabled = false;
	export let showBadge = false;
	export let badgeContent: string | number = '';
	export let isBaseLayer = false;
</script>

<button
	class="w-full px-4 py-2.5 text-left transition-all duration-200
		{!disabled ? 'hover:bg-surface-200-700-token hover:pl-6 group' : ''}
		{selected && !isBaseLayer
		? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
		: isBaseLayer
			? 'text-primary-700 dark:text-primary-400 font-bold'
			: 'text-surface-900-50-token'}
		{disabled && !isBaseLayer ? 'opacity-50 cursor-default' : ''}"
	on:click
	{disabled}
>
	<div class="flex items-center justify-between">
		<span class="truncate font-medium">
			<slot />
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
