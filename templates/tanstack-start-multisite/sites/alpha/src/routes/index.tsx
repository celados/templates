import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/app/home-page'

import { site } from '../site'

export const Route = createFileRoute('/')({
	component: () => <HomePage site={site} />,
})
