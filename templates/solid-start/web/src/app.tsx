import { Title } from '@solidjs/meta'

import { AuthContext, createAuth } from './lib/auth'
import { ConvexProvider } from './lib/convex'
import { getConvexClient } from './lib/convex-client'
import { Router } from './router'

import './lib/client-errors'

export default function App() {
	// Live queries only run in the browser; the server still needs a provider
	// so components mount. Server reads go through `locals.convex`.
	const client = getConvexClient()
	const auth = createAuth(client)
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
