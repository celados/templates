import * as stylex from '@stylexjs/stylex'
import { Loading } from 'solid-js'

import { i18n } from '#i18n'

import { colors, radius, space } from '../../../web/src/styles/tokens.stylex'
import { ui } from './ui'
import { createCounter } from './use-counter'

export function CounterPanel(props: { title: string; description: string }) {
	const counter = createCounter()
	return (
		<section {...stylex.attrs(ui.panel)} data-testid="counter-panel">
			<div {...stylex.attrs(ui.stack)}>
				<p {...stylex.attrs(ui.eyebrow)}>{i18n.t('counter.eyebrow')}</p>
				<h1 {...stylex.attrs(ui.title)}>{props.title}</h1>
				<p {...stylex.attrs(ui.muted)}>{props.description}</p>
			</div>
			<div {...stylex.attrs(styles.metric)}>
				<span {...stylex.attrs(ui.muted)}>{i18n.t('counter.label')}</span>
				<Loading fallback={<output {...stylex.attrs(styles.value)}>…</output>}>
					<output
						{...stylex.attrs(styles.value)}
						data-testid="counter-value"
						aria-live="polite"
					>
						{counter.count$()}
					</output>
				</Loading>
			</div>
			<div {...stylex.attrs(styles.actions)}>
				<button
					type="button"
					{...stylex.attrs(ui.button)}
					disabled={counter.pending()}
					data-testid="increment"
					onClick={() => void counter.increment()}
				>
					{i18n.t('counter.increment')}
				</button>
				<button
					type="button"
					{...stylex.attrs(ui.button, ui.outline)}
					disabled={counter.pending()}
					data-testid="reset"
					onClick={() => void counter.reset()}
				>
					{i18n.t('counter.reset')}
				</button>
			</div>
		</section>
	)
}

const styles = stylex.create({
	metric: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: space.md,
		paddingBlock: space.sm,
		paddingInline: space.md,
		borderStyle: 'solid',
		borderWidth: '1px',
		borderColor: colors.border,
		borderRadius: radius.control,
		backgroundColor: colors.canvas,
	},
	value: {
		fontSize: '22px',
		fontVariantNumeric: 'tabular-nums',
		fontWeight: 700,
	},
	actions: {
		display: 'grid',
		gridTemplateColumns: '1fr auto',
		gap: space.sm,
	},
})
