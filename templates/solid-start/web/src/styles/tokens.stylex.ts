import * as stylex from '@stylexjs/stylex'

const DARK = '@media (prefers-color-scheme: dark)'

export const colors = stylex.defineVars({
	canvas: { default: '#fafaf9', [DARK]: '#0c0c0d' },
	surface: { default: '#ffffff', [DARK]: '#161618' },
	text: { default: '#1c1917', [DARK]: '#f5f5f4' },
	muted: { default: '#78716c', [DARK]: '#a8a29e' },
	border: { default: '#e7e5e4', [DARK]: '#2a2a2d' },
	accent: { default: '#2563eb', [DARK]: '#60a5fa' },
	onAccent: { default: '#ffffff', [DARK]: '#0c0c0d' },
	danger: { default: '#dc2626', [DARK]: '#f87171' },
})

export const space = stylex.defineVars({
	xs: '4px',
	sm: '8px',
	md: '16px',
	lg: '24px',
	xl: '48px',
})

export const radius = stylex.defineVars({
	control: '8px',
	card: '16px',
})
