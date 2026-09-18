import { Title } from '@solidjs/meta'
import { isServer } from '@solidjs/web'
import { onSettled } from 'solid-js'

import { attachAuth, AuthContext, createAuth } from './lib/auth'
import { ConvexProvider } from './lib/convex'
import { getConvexClient } from './lib/convex-client'
import { Router } from './router'

export default function App() {
	// Live queries only run in the browser (ssrSource: 'client'); the server
	// still needs a provider so components mount.
	const client = getConvexClient()
	const auth = createAuth(client)
	// Unconditional: onSettled registers an owner, and an owner that exists only
	// on one side shifts every hydration id after it. Guard the work, not the call.
	onSettled(() => {
		if (!isServer) attachAuth(client)
	})
	return (
		<ConvexProvider value={client}>
			<AuthContext value={auth}>
				<Router>
					{(props) => (
						<>
							<Title>Solid Start</Title>
							{props.children}
						</>
					)}
				</Router>
			</AuthContext>
		</ConvexProvider>
	)
}
