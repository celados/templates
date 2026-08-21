import * as v from 'valibot'

const postFrontmatterSchema = v.strictObject({
	title: v.pipe(v.string(), v.minLength(1)),
	description: v.pipe(v.string(), v.minLength(1)),
	publishedAt: v.pipe(
		v.union([v.string(), v.date()]),
		v.transform((value) =>
			value instanceof Date ? value.toISOString().slice(0, 10) : value,
		),
		v.isoDate(),
	),
	draft: v.optional(v.boolean(), false),
})

export type PostFrontmatter = v.InferOutput<typeof postFrontmatterSchema>

export function parsePostFrontmatter(input: unknown, source: string) {
	const result = v.safeParse(postFrontmatterSchema, input)
	if (result.success) return result.output

	const details = result.issues.map((issue) => issue.message).join('; ')
	throw new Error(`Invalid frontmatter in ${source}: ${details}`)
}
