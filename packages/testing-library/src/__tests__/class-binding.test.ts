/**
 * class binding tests — verify that string, array, and object `:class` forms
 * all reach the Main Thread correctly:
 * Vue patchProp('class', ...) → SET_CLASS op → __SetClasses → JSDOM class attr
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue-lynx'
import { render, waitForUpdate } from '../index.js'

import { OP } from '../../../vue-lynx/internal/src/ops.js'
import { nodeOps } from '../../../vue-lynx/runtime/src/node-ops.js'
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js'
import { ShadowElement } from '../../../vue-lynx/runtime/src/shadow-element.js'

// ---------------------------------------------------------------------------
// SET_CLASS (nodeOps level)
// ---------------------------------------------------------------------------

describe('SET_CLASS (nodeOps)', () => {
  it('string value emits SET_CLASS with the verbatim string', () => {
    const el = new ShadowElement('view', 100)

    nodeOps.patchProp(el, 'class', null, 'foo bar')

    const ops = takeOps()
    expect(ops[0]).toBe(OP.SET_CLASS)
    expect(ops[1]).toBe(100)
    expect(ops[2]).toBe('foo bar')
  })

  it('empty string emits SET_CLASS with empty string', () => {
    const el = new ShadowElement('view', 101)

    nodeOps.patchProp(el, 'class', 'previous', '')

    const ops = takeOps()
    expect(ops[0]).toBe(OP.SET_CLASS)
    expect(ops[2]).toBe('')
  })

  it('null value emits SET_CLASS with empty string', () => {
    const el = new ShadowElement('view', 102)

    nodeOps.patchProp(el, 'class', 'previous', null)

    const ops = takeOps()
    expect(ops[0]).toBe(OP.SET_CLASS)
    expect(ops[2]).toBe('')
  })
})

// ---------------------------------------------------------------------------
// class binding forms (full pipeline)
// ---------------------------------------------------------------------------

describe('class binding — string form', () => {
  it('renders the class directly', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: 'flex flex-col' })
      },
    })

    const { container } = render(Comp)
    expect(container.querySelector('view')!.getAttribute('class')).toBe('flex flex-col')
  })

  it('ternary expression picks the correct branch', () => {
    const large = true
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: large ? 'text-lg' : 'text-sm' })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('text-lg')
    expect(classes).not.toContain('text-sm')
  })
})

describe('class binding — object form', () => {
  it('includes keys whose value is truthy, excludes falsy keys', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: { active: true, hidden: false, visible: true } })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('active')
    expect(classes).toContain('visible')
    expect(classes).not.toContain('hidden')
  })

  it('supports truthy non-boolean values in object form', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: { active: 1, hidden: 0, visible: 'yes', empty: '' } })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('active')
    expect(classes).toContain('visible')
    expect(classes).not.toContain('hidden')
    expect(classes).not.toContain('empty')
  })
})

describe('class binding — array form', () => {
  it('joins truthy string entries, drops falsy values', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: ['base', 'extra', false, null, undefined] })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('base')
    expect(classes).toContain('extra')
    expect(classes).not.toContain('false')
    expect(classes).not.toContain('null')
    expect(classes).not.toContain('undefined')
  })

  it('supports conditional ternary inside the array', () => {
    const isLarge = true
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: [isLarge ? 'text-lg' : 'text-sm', 'font-bold'] })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('text-lg')
    expect(classes).toContain('font-bold')
    expect(classes).not.toContain('text-sm')
  })

  it('supports mixed string and object entries', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: ['base', { active: true, disabled: false }] })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('base')
    expect(classes).toContain('active')
    expect(classes).not.toContain('disabled')
  })

  it('supports nested arrays', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: [['base'], { active: true }] })
      },
    })

    const { container } = render(Comp)
    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('base')
    expect(classes).toContain('active')
  })
})

// ---------------------------------------------------------------------------
// reactive updates
// ---------------------------------------------------------------------------

describe('class binding — reactivity', () => {
  it('updates when a reactive string condition changes', async () => {
    const isMd = ref(false)

    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: isMd.value ? 'flex-row gap-4' : 'flex-col' })
      },
    })

    const { container } = render(Comp)
    expect(container.querySelector('view')!.getAttribute('class')).toBe('flex-col')

    isMd.value = true
    await waitForUpdate()

    expect(container.querySelector('view')!.getAttribute('class')).toBe('flex-row gap-4')
  })

  it('updates when a reactive value inside an array changes', async () => {
    const isActive = ref(false)

    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: ['base', isActive.value && 'active'] })
      },
    })

    const { container } = render(Comp)
    expect(container.querySelector('view')!.getAttribute('class')).not.toContain('active')

    isActive.value = true
    await waitForUpdate()

    const classes = container.querySelector('view')!.getAttribute('class')!.split(' ')
    expect(classes).toContain('active')
    expect(classes).toContain('base')
  })

  it('updates when a reactive value inside an object changes', async () => {
    const highlighted = ref(false)

    const Comp = defineComponent({
      setup() {
        return () => h('view', { class: { card: true, highlighted: highlighted.value } })
      },
    })

    const { container } = render(Comp)
    expect(container.querySelector('view')!.getAttribute('class')).toContain('card')
    expect(container.querySelector('view')!.getAttribute('class')).not.toContain('highlighted')

    highlighted.value = true
    await waitForUpdate()

    expect(container.querySelector('view')!.getAttribute('class')).toContain('highlighted')
  })
})
