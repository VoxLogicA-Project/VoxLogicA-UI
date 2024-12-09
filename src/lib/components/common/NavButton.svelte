<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		icon: string;
		label: string;
		isSelected?: boolean;
		selectionIndex?: number;
		indent?: boolean;
		size?: 'default' | 'small';
		variant?: 'primary' | 'surface' | 'error';
	}

	let {
		icon,
		label,
		isSelected = false,
		selectionIndex = undefined,
		indent = false,
		size = 'default',
		variant = 'primary',
		...rest
	} = $props();

	const baseClasses =
		'w-full text-left rounded-token transition-all duration-200 flex items-center min-w-0';
	const hoverClasses = `hover:bg-${variant}-500/30 hover:pl-4`;
	const selectedClasses = `bg-${variant}-500/10 text-${variant}-700 dark:text-${variant}-400`;
	const defaultClasses = 'text-surface-900-50-token';
	const sizeClasses = size === 'small' ? 'px-3 py-1.5 text-sm' : 'px-3 py-2';
	const indentClasses = indent ? 'pl-4' : '';
</script>

<button
	class="{baseClasses} {hoverClasses} {isSelected
		? selectedClasses
		: defaultClasses} {sizeClasses} {indentClasses} group"
	{...rest}
>
	<i class="fa-solid {icon} mr-2 opacity-70 flex-shrink-0"></i>
	<span class="truncate flex-1 font-medium">{label}</span>

	{#if isSelected && selectionIndex !== undefined}
		<div class="badge badge-sm variant-filled-{variant} ml-2 flex-shrink-0">
			{selectionIndex}
		</div>
	{:else if !isSelected}
		<i
			class="fa-solid fa-chevron-right w-3 h-3 opacity-0 -translate-x-2 transition-all duration-200
            group-hover:opacity-50 group-hover:translate-x-0"
		></i>
	{/if}
</button>
