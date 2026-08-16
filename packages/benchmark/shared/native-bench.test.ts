import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  NATIVE_BENCH_WORKLOADS,
  createNativeBench,
} from './native-bench.ts'
import { buildDataSeeded as buildVueDataSeeded } from './data.ts'
import { buildDataSeeded as buildReactDataSeeded } from '../apps/ui-react/src/data.ts'

type Task = () => void

const expectedWorkloads = [
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

function createWebGlobals() {
  const channelTasks: Task[] = []
  const frameTasks: Task[] = []
  const timerTasks: Task[] = []
  const logs: unknown[][] = []

  class FakeMessageChannel {
    port1 = {
      onmessage: null as Task | null,
      postMessage: () => {},
    }

    port2 = {
      onmessage: null as Task | null,
      postMessage: () => {
        channelTasks.push(() => this.port1.onmessage?.())
      },
    }
  }

  return {
    channelTasks,
    frameTasks,
    globals: {
      MessageChannel: FakeMessageChannel,
      Date: { now: () => 0 },
      console: { log: (...args: unknown[]) => logs.push(args) },
      lynx: {
        requestAnimationFrame: (task: Task) => frameTasks.push(task),
      },
      setTimeout: (task: Task) => {
        timerTasks.push(task)
        return timerTasks.length
      },
    },
    logs,
    timerTasks,
  }
}

function createNativeGlobals() {
  let now = 100
  const frameTasks: Task[] = []
  const timerTasks: Task[] = []
  const timerDelays: number[] = []
  const logs: unknown[][] = []

  return {
    frameTasks,
    globals: {
      Date: { now: () => now },
      console: { log: (...args: unknown[]) => logs.push(args) },
      lynx: {
        requestAnimationFrame: (task: Task) => frameTasks.push(task),
      },
      setTimeout: (task: Task, delay: number) => {
        timerTasks.push(task)
        timerDelays.push(delay)
        return timerTasks.length
      },
    },
    logs,
    setNow(value: number) {
      now = value
    },
    timerDelays,
    timerTasks,
  }
}

test('declares the exact Native interactive workload labels', () => {
  assert.deepEqual(NATIVE_BENCH_WORKLOADS, expectedWorkloads)
})

test('pre-populated startup rows are deterministic across frameworks', () => {
  const vueRows = buildVueDataSeeded(32, 42).map(row => ({
    id: row.id,
    label: row.label.value,
  }))
  const reactRows = buildReactDataSeeded(32, 42)

  assert.deepEqual(vueRows, reactRows)
})

test('Web actions and storms keep MessageChannel without timing side effects', () => {
  const web = createWebGlobals()
  const bench = createNativeBench(web.globals)

  for (const workload of expectedWorkloads) {
    const finish = bench.startMeasure(workload)
    finish()
    finish()
  }

  let actionCalls = 0
  const finish = bench.startMeasure('create')
  actionCalls++
  finish()
  assert.equal(actionCalls, 1)

  const ticks: number[] = []
  bench.runStorm('updateStorm', 3, tick => ticks.push(tick))
  assert.equal(web.channelTasks.length, 1)
  while (web.channelTasks.length > 0) web.channelTasks.shift()?.()

  assert.deepEqual(ticks, [1, 2, 3])
  assert.equal(web.timerTasks.length, 0)
  assert.equal(web.frameTasks.length, 0)
  assert.deepEqual(web.logs, [])
})

test('Native actions report once after the second Lynx frame', () => {
  const native = createNativeGlobals()
  const bench = createNativeBench(native.globals)

  const finish = bench.startMeasure('append1k')
  native.setNow(110)
  finish()
  finish()

  assert.equal(native.frameTasks.length, 1)
  assert.deepEqual(native.logs, [])
  native.frameTasks.shift()?.()
  assert.equal(native.frameTasks.length, 1)
  assert.deepEqual(native.logs, [])

  native.setNow(145)
  native.frameTasks.shift()?.()
  assert.deepEqual(native.logs, [[
    '__NATIVE_BENCH_RESULT__',
    JSON.stringify({
      name: 'append1k',
      startMs: 100,
      endMs: 145,
      latencyMs: 45,
    }),
  ]])

  finish()
  assert.equal(native.frameTasks.length, 0)
  assert.equal(native.logs.length, 1)
})

test('Native emits the exact marker payload shape for every workload', () => {
  const observed: string[] = []

  for (const workload of expectedWorkloads) {
    const native = createNativeGlobals()
    const bench = createNativeBench(native.globals)
    const finish = bench.startMeasure(workload)
    finish()
    native.frameTasks.shift()?.()
    native.setNow(125)
    native.frameTasks.shift()?.()

    assert.equal(native.logs.length, 1)
    assert.equal(native.logs[0][0], '__NATIVE_BENCH_RESULT__')
    const payload = JSON.parse(native.logs[0][1] as string) as {
      name: string
      startMs: number
      endMs: number
      latencyMs: number
    }
    assert.deepEqual(Object.keys(payload), [
      'name',
      'startMs',
      'endMs',
      'latencyMs',
    ])
    assert.deepEqual(payload, {
      name: workload,
      startMs: 100,
      endMs: 125,
      latencyMs: 25,
    })
    observed.push(payload.name)
  }

  assert.deepEqual(observed, expectedWorkloads)
})

test('Native storms use timer tasks and finish after the final tick', () => {
  const native = createNativeGlobals()
  const bench = createNativeBench(native.globals)
  const ticks: number[] = []

  bench.runStorm('selectStorm', 3, tick => ticks.push(tick))
  assert.deepEqual(native.timerDelays, [0])
  assert.equal(native.frameTasks.length, 0)

  native.timerTasks.shift()?.()
  assert.deepEqual(ticks, [1])
  assert.deepEqual(native.timerDelays, [0, 0])
  assert.equal(native.frameTasks.length, 0)

  native.timerTasks.shift()?.()
  assert.deepEqual(ticks, [1, 2])
  assert.deepEqual(native.timerDelays, [0, 0, 0])
  assert.equal(native.frameTasks.length, 0)

  native.timerTasks.shift()?.()
  assert.deepEqual(ticks, [1, 2, 3])
  assert.equal(native.timerTasks.length, 0)
  assert.equal(native.frameTasks.length, 1)

  native.frameTasks.shift()?.()
  native.setNow(180)
  native.frameTasks.shift()?.()
  assert.deepEqual(native.logs, [[
    '__NATIVE_BENCH_RESULT__',
    JSON.stringify({
      name: 'selectStorm',
      startMs: 100,
      endMs: 180,
      latencyMs: 80,
    }),
  ]])
})

test('Vue and React wire every workload and create scale without changing bindings', () => {
  const benchmarkRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  )
  const vue = fs.readFileSync(
    path.join(benchmarkRoot, 'apps/ui-vdom/src/App.vue'),
    'utf8',
  )
  const react = fs.readFileSync(
    path.join(benchmarkRoot, 'apps/ui-react/src/App.tsx'),
    'utf8',
  )

  for (const workload of expectedWorkloads) {
    assert.ok(vue.includes(`'${workload}'`), `Vue is missing ${workload}`)
    assert.ok(react.includes(`'${workload}'`), `React is missing ${workload}`)
  }
  assert.ok(
    vue.includes('shallowRef<RowData[]>(buildDataSeeded(__BENCH_AUTOROWS__, 42))'),
    'Vue BENCH_AUTOROWS seeding changed',
  )
  assert.ok(
    react.includes('buildDataSeeded(__BENCH_AUTOROWS__, 42)'),
    'React BENCH_AUTOROWS seeding changed',
  )
  for (const scale of ['1,000', '3,000', '5,000', '10,000', '20,000', '30,000']) {
    assert.ok(vue.includes(`Create ${scale} rows`), `Vue is missing ${scale}`)
    assert.ok(react.includes(`Create ${scale} rows`), `React is missing ${scale}`)
  }
  assert.equal(
    vue.match(/startNativeMeasure\('create'\)/g)?.length,
    6,
    'Vue must measure every create scale',
  )
  assert.equal(
    react.match(/startNativeMeasure\('create'\)/g)?.length,
    6,
    'React must measure every create scale',
  )
  for (const [source, framework] of [[vue, 'Vue'], [react, 'React']] as const) {
    assert.ok(
      source.includes('const STORM_UPDATE_TICKS = 50'),
      `${framework} update storm tick count changed`,
    )
    assert.ok(
      source.includes('const STORM_SELECT_TICKS = 30'),
      `${framework} select storm tick count changed`,
    )
  }
  assert.ok(
    vue.includes("_rows[i].label.value = 'bench ' + t"),
    'Vue update storm predicate changed',
  )
  assert.ok(
    vue.includes(': _rows[0].id'),
    'Vue select storm completion changed',
  )
  assert.ok(
    react.includes("i % 10 === 0 ? { id: r.id, label: `bench ${t}` } : r"),
    'React update storm predicate changed',
  )
  assert.ok(
    react.includes(': ids[0]'),
    'React select storm completion changed',
  )

  for (const binding of [
    '@tap="run()"',
    '@tap="run3k()"',
    '@tap="run5k()"',
    '@tap="runLots()"',
    '@tap="run20k()"',
    '@tap="run30k()"',
    '@tap="select(row.id)"',
    '@tap="remove(row.id)"',
  ]) {
    assert.ok(vue.includes(binding), `Vue binding changed: ${binding}`)
  }
  for (const binding of [
    'bindtap={run}',
    'bindtap={run3k}',
    'bindtap={run5k}',
    'bindtap={runLots}',
    'bindtap={run20k}',
    'bindtap={run30k}',
    'onSelect={select}',
    'onRemove={remove}',
  ]) {
    assert.ok(react.includes(binding), `React binding changed: ${binding}`)
  }
})

test('ui-vapor is exactly generated from ui-vdom by the marker contract', () => {
  const benchmarkRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  )
  const marker = '<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">'
  const vue = fs.readFileSync(
    path.join(benchmarkRoot, 'apps/ui-vdom/src/App.vue'),
    'utf8',
  )
  const vapor = fs.readFileSync(
    path.join(benchmarkRoot, 'apps/ui-vapor/src/App.vue'),
    'utf8',
  )

  assert.ok(vue.startsWith(marker))
  assert.equal(
    vapor,
    `<!-- GENERATED from apps/ui-vdom/src/App.vue — do not edit -->\n${
      vue.replace(marker, '<script setup vapor lang="ts">')
    }`,
  )
})
