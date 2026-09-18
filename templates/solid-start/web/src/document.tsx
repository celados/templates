import type { ParentProps } from 'solid-js'

import { HydrationScript } from '@solidjs/web'
import * as stylex from '@stylexjs/stylex'

import { page } from './styles/page'

import './styles/reset.css'

export default function Document(props: ParentProps) {
	return (
		<html lang="en" {...stylex.attrs(page.html)}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="color-scheme" content="light dark" />
				<link rel="icon" href="/favicon.ico" />
				{/* The unplugin injects its dev CSS through transformIndexHtml, which an
				    SSR shell never goes through, so the shell links the sheet and loads
				    the runtime that refetches it on HMR (@stylexjs/unplugin README, "Dev
				    HMR CSS hookup"). Production appends the rules to the bundled CSS. */}
				{import.meta.env.DEV && (
					<>
						<link rel="stylesheet" href="/virtual:stylex.css" />
						<script type="module" src="/@id/virtual:stylex:runtime" />
					</>
				)}
				<HydrationScript />
			</head>
			<body {...stylex.attrs(page.body)}>{props.children}</body>
		</html>
	)
}
