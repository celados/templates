import solid from 'eslint-plugin-solid/configs/v2'

// Solid's own rules: reactivity, removed 1.x APIs, server-function contracts,
// store/signal misuse. The three turned off are markup preferences, not bugs.
// Spread `rules` and `settings`, and add `plugin` to `jsPlugins`.
export const solidLint = {
	plugin: 'eslint-plugin-solid',
	settings: solid.settings,
	rules: {
		...solid.rules,
		'solid/self-closing-comp': 'off',
		'solid/style-prop': 'off',
		'solid/prefer-structured-class': 'off',
	},
} as const
