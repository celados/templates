import { mount } from 'ripple'

import { App } from './app.tsrx'
import './styles.css'

const target = document.querySelector<HTMLElement>('#app')

if (!target) {
  throw new Error('Ripple app mount target was not found')
}

const dispose = mount(App, { target })

if (import.meta.hot) {
  import.meta.hot.dispose(dispose)
}
