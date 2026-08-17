export const NATIVE_BENCH_WORKLOADS = [
  'create',
  'append1k',
  'update10th',
  'select',
  'swap',
  'remove',
  'clear',
  'updateStorm',
  'selectStorm',
] as const

export const NATIVE_BENCH_PROTOCOL = 'vue-lynx-native-bench-v1'
export const NATIVE_STARTUP_PROTOCOL = 'vue-lynx-native-startup-v1'

export type NativeBenchWorkload = typeof NATIVE_BENCH_WORKLOADS[number]

type Task = () => void
const noop = () => {}

interface MessagePortLike {
  onmessage: (() => void) | null
  postMessage(value: unknown): void
}

interface MessageChannelLike {
  port1: MessagePortLike
  port2: MessagePortLike
}

interface NativeFrameScheduler {
  requestAnimationFrame(callback: Task): void
  setTimeout(callback: Task, delay: number): unknown
}

interface NativeBenchGlobals {
  MessageChannel?: new () => MessageChannelLike
  Date: Pick<DateConstructor, 'now'>
  console: Pick<Console, 'log'>
  __LYNX_BENCH_STARTUP__?: NativeStartupPayload
}

interface NativeStartupPayload {
  protocol: typeof NATIVE_STARTUP_PROTOCOL
  moduleStartMs: number
  mountEndMs: number | null
  firstFrameMs: number | null
  secondFrameMs: number | null
}

export function createNativeStartupMarker(
  frameScheduler: NativeFrameScheduler,
  globals = globalThis as unknown as NativeBenchGlobals,
): Task {
  if (typeof globals.MessageChannel === 'function') return noop

  const startup: NativeStartupPayload = {
    protocol: NATIVE_STARTUP_PROTOCOL,
    moduleStartMs: globals.Date.now(),
    mountEndMs: null,
    firstFrameMs: null,
    secondFrameMs: null,
  }
  globals.__LYNX_BENCH_STARTUP__ = startup

  let finished = false
  return () => {
    if (finished) return
    finished = true
    startup.mountEndMs = globals.Date.now()
    frameScheduler.requestAnimationFrame(() => {
      startup.firstFrameMs = globals.Date.now()
      frameScheduler.requestAnimationFrame(() => {
        startup.secondFrameMs = globals.Date.now()
        globals.console.log('__NATIVE_BENCH_STARTUP__', JSON.stringify(startup))
      })
    })
  }
}

export function createNativeBench(
  frameScheduler: NativeFrameScheduler,
  globals = globalThis as unknown as NativeBenchGlobals,
) {
  const Channel = globals.MessageChannel
  const isNative = typeof Channel !== 'function'
  const channel = isNative ? null : new Channel()
  let pendingTask: Task | null = null

  if (channel) {
    channel.port1.onmessage = () => {
      const task = pendingTask
      pendingTask = null
      if (task) task()
    }
  }

  function nextTask(task: Task): void {
    if (!channel) {
      frameScheduler.setTimeout(task, 0)
      return
    }
    pendingTask = task
    channel.port2.postMessage(0)
  }

  function startMeasure(name: NativeBenchWorkload): Task {
    if (!isNative) return noop

    const startMs = globals.Date.now()
    let finished = false
    return () => {
      if (finished) return
      finished = true

      frameScheduler.requestAnimationFrame(() => {
        frameScheduler.requestAnimationFrame(() => {
          const endMs = globals.Date.now()
          globals.console.log(
            '__NATIVE_BENCH_RESULT__',
            JSON.stringify({
              protocol: NATIVE_BENCH_PROTOCOL,
              name,
              startMs,
              endMs,
              latencyMs: endMs - startMs,
            }),
          )
        })
      })
    }
  }

  function runStorm(
    name: 'updateStorm' | 'selectStorm',
    ticks: number,
    step: (tick: number) => void,
  ): void {
    const finish = isNative ? startMeasure(name) : null
    let tick = 0
    const runTick = () => {
      tick++
      step(tick)
      if (tick < ticks) nextTask(runTick)
      else if (finish) finish()
    }
    nextTask(runTick)
  }

  return {
    runStorm,
    startMeasure,
  }
}
