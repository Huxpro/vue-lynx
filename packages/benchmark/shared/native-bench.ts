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

interface NativeBenchGlobals {
  MessageChannel?: new () => MessageChannelLike
  Date: Pick<DateConstructor, 'now'>
  console: Pick<Console, 'log'>
  lynx?: {
    requestAnimationFrame(callback: Task): void
  }
  setTimeout(callback: Task, delay: number): unknown
}

export function createNativeBench(
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
      globals.setTimeout(task, 0)
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

      const lynx = globals.lynx
      if (!lynx) throw new Error('Native benchmark requires lynx.requestAnimationFrame')
      lynx.requestAnimationFrame(() => {
        lynx.requestAnimationFrame(() => {
          const endMs = globals.Date.now()
          globals.console.log(
            '__NATIVE_BENCH_RESULT__',
            JSON.stringify({ name, startMs, endMs, latencyMs: endMs - startMs }),
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
