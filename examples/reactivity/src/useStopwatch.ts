import { reactive, toRefs, onUnmounted } from 'vue'

/**
 * A composable that wraps reactive state with toRefs for flexible
 * destructuring — demonstrating both APIs working together.
 */
export function useStopwatch() {
  const state = reactive({
    elapsed: 0,
    running: false,
  })

  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    if (state.running) return
    state.running = true
    timer = setInterval(() => {
      state.elapsed++
    }, 100) // ticks every 100ms
  }

  function stop() {
    state.running = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function reset() {
    stop()
    state.elapsed = 0
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  // toRefs keeps reactivity when destructured
  return { ...toRefs(state), start, stop, reset }
}
