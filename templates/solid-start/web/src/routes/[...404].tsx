import { httpStatus } from '@solidjs/web'
import * as stylex from '@stylexjs/stylex'

import { paths } from '../router'
import { ui } from '../styles/ui'

export default function NotFound() {
	// The client call is a no-op, while the SSR pass marks the real HTTP status.
	httpStatus(404)

	return (
		<main {...stylex.attrs(ui.centered)}>
			<section {...stylex.attrs(ui.list)}>
				<h1 {...stylex.attrs(ui.heading)}>Page not found</h1>
				<p {...stylex.attrs(ui.muted)}>
					The page you requested does not exist.
				</p>
				<a href={paths()}>Back home</a>
			</section>
		</main>
	)
}
