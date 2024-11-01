import { join } from 'path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

/**
 * Tailwind configuration with Skeleton UI integration
 * Supports dark mode and custom theme presets (skeleton and hamlindigo)
 */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
	],
	theme: {
		extend: {},
	},
	plugins: [
		skeleton({
			themes: {
				preset: [
					{
						name: 'skeleton',
						enhancements: true,
					},
					{
						name: 'hamlindigo',
						enhancements: true,
					},
				],
			},
		}),
	],
} satisfies Config;
