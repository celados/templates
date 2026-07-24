import { mount } from 'ripple'

import { SidePanelApp } from './side-panel-app.tsrx'
import './style.css'

const target = document.querySelector<HTMLElement>('#app')

if (!target) {
	throw new Error('Side panel mount target was not found')
}

const dispose = mount(SidePanelApp, { target })

if (import.meta.hot) {
	import.meta.hot.dispose(dispose)
}
