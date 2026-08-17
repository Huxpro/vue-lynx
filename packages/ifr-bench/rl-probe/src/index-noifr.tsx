import { root } from '@lynx-js/react'
import { App } from './App.jsx'

// "IFR off" emulation: the main thread renders an empty first screen, so all
// content arrives with the background thread's hydration patch (the classic
// BG-driven pipeline). The condition is opaque to compile-time folding so
// <App/> stays referenced on the main thread — its snapshot definitions must
// remain registered there for the hydration patch to instantiate them
// (ReactLynx's architecture has no true "no-IFR" mode; this is the closest
// faithful emulation).
const emptyFirstScreen = (globalThis as { __probeIFR__?: boolean }).__probeIFR__ !== true

root.render(__MAIN_THREAD__ && emptyFirstScreen ? <view /> : <App />)
