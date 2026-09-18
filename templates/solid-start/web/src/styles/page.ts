import * as stylex from '@stylexjs/stylex'

import { colors } from './tokens.stylex'

export const page = stylex.create({
	html: {
		colorScheme: 'light dark',
		fontFamily:
			'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
		WebkitFontSmoothing: 'antialiased',
	},
	body: {
		minHeight: '100svh',
		backgroundColor: colors.canvas,
		color: colors.text,
		lineHeight: 1.5,
	},
})
