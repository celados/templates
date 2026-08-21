import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'

import { DefaultError } from '@/components/default-error'
import { NotFound } from '@/components/not-found'

import ssgCss from '../ssg.css?url'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'stylesheet', href: ssgCss },
			{ rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml' },
		],
	}),
	component: RootComponent,
	errorComponent: DefaultError,
	notFoundComponent: NotFound,
	shellComponent: RootDocument,
})

function RootComponent() {
	return <Outlet />
}

function RootDocument(props: { children: React.ReactNode }) {
	const { children } = props
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen">
				{children}
				<Scripts />
			</body>
		</html>
	)
}
