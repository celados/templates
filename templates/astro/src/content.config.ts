import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const posts = defineCollection({
	loader: glob({
		base: './src/content/posts',
		pattern: '**/*.mdoc',
	}),
	schema: z.object({
		title: z.string(),
	}),
})

export const collections = { posts }
