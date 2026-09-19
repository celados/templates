import * as stylex from '@stylexjs/stylex'

import { colors, radius, space } from '../../../web/src/styles/tokens.stylex'

// The web app's tokens with extension-owned recipes. Sizes are px, not rem:
// content scripts render inside host pages that own the root font size, so
// web/src/styles/ui.ts is not reused here.
export const ui = stylex.create({
	panel: {
		display: 'grid',
		gap: space.md,
		width: '100%',
		padding: space.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		borderColor: colors.border,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
		color: colors.text,
		fontFamily:
			'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
		fontSize: '14px',
		lineHeight: 1.5,
	},
	stack: { display: 'grid', gap: space.sm },
	eyebrow: {
		color: colors.accent,
		fontSize: '11px',
		fontWeight: 700,
		letterSpacing: '1.2px',
		textTransform: 'uppercase',
	},
	title: {
		fontSize: '22px',
		fontWeight: 600,
		lineHeight: 1.15,
		letterSpacing: '-0.02em',
	},
	muted: { color: colors.muted, fontSize: '13px' },
	done: { color: colors.muted, textDecoration: 'line-through' },
	button: {
		minHeight: '36px',
		paddingInline: space.md,
		borderStyle: 'solid',
		borderWidth: '1px',
		borderColor: colors.accent,
		borderRadius: radius.control,
		backgroundColor: colors.accent,
		color: colors.onAccent,
		fontSize: '13px',
		fontWeight: 600,
		cursor: { default: 'pointer', ':disabled': 'progress' },
		opacity: { default: 1, ':disabled': 0.6 },
		outline: { default: null, ':focus-visible': `2px solid ${colors.accent}` },
		outlineOffset: '2px',
	},
	outline: {
		borderColor: colors.border,
		backgroundColor: 'transparent',
		color: colors.text,
	},
})
