import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import axe from 'axe-core'
import FocusLock from '../src/FocusLock.vue'

describe('FocusLock Sentinel Accessibility and Trapping', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    if (typeof document.elementFromPoint !== 'function') {
      document.elementFromPoint = () => null
    }
    if (typeof document.elementsFromPoint !== 'function') {
      document.elementsFromPoint = () => []
    }

    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it('renders sentinels without aria-hidden to eliminate WCAG conflict', () => {
    const app = createApp({
      render() {
        return h(FocusLock, null, {
          default: () => [
            h('button', { id: 'btn1' }, 'Button 1'),
            h('button', { id: 'btn2' }, 'Button 2')
          ]
        })
      }
    })

    app.mount(container)

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    expect(guards.length).toBe(2)

    guards.forEach((guard) => {
      // Must NOT have aria-hidden (fixes Issue #23 conflict with tabindex="0")
      expect(guard.getAttribute('aria-hidden')).toBeNull()
      expect(guard.getAttribute('tabindex')).toBe('0')

      // Must be styled offscreen and hidden from sighted users
      expect(guard.style.position).toBe('fixed')
      expect(guard.style.width).toBe('1px')
      expect(guard.style.height).toBe('0px')
      expect(guard.style.overflow).toBe('hidden')
      expect(guard.style.top).toBe('1px')
      expect(guard.style.left).toBe('1px')
    })

    app.unmount()
  })

  it('passes axe-core aria-hidden-focus rule', async () => {
    const app = createApp({
      render() {
        return h(FocusLock, null, {
          default: () => [
            h('input', { id: 'input1', type: 'text' }),
            h('button', { id: 'btn1' }, 'Submit')
          ]
        })
      }
    })

    app.mount(container)

    const results = await axe.run(container, {
      runOnly: {
        type: 'rule',
        values: ['aria-hidden-focus']
      }
    })

    expect(results.violations).toHaveLength(0)

    app.unmount()
  })

  it('detects a violation if aria-hidden=true were present on a focusable element', async () => {
    const buggyDiv = document.createElement('div')
    buggyDiv.setAttribute('tabindex', '0')
    buggyDiv.setAttribute('aria-hidden', 'true')
    container.appendChild(buggyDiv)

    const results = await axe.run(container, {
      runOnly: {
        type: 'rule',
        values: ['aria-hidden-focus']
      }
    })

    expect(results.violations.some((v) => v.id === 'aria-hidden-focus')).toBe(true)
  })

  it('sets tabindex="-1" on guards when disabled', () => {
    const app = createApp({
      render() {
        return h(
          FocusLock,
          { disabled: true },
          {
            default: () => [h('button', { id: 'btn' }, 'Disabled Lock Button')]
          }
        )
      }
    })

    app.mount(container)

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    expect(guards.length).toBe(2)
    guards.forEach((guard) => {
      expect(guard.getAttribute('tabindex')).toBe('-1')
      expect(guard.getAttribute('aria-hidden')).toBeNull()
    })

    app.unmount()
  })

  it('supports noFocusGuards=true to omit sentinels completely', () => {
    const app = createApp({
      render() {
        return h(
          FocusLock,
          { noFocusGuards: true },
          {
            default: () => [h('button', { id: 'btn' }, 'No Guards')]
          }
        )
      }
    })

    app.mount(container)

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    expect(guards.length).toBe(0)

    app.unmount()
  })

  it('supports noFocusGuards="tail" to omit only the tailing sentinel', () => {
    const app = createApp({
      render() {
        return h(
          FocusLock,
          { noFocusGuards: 'tail' },
          {
            default: () => [h('button', { id: 'btn' }, 'Leading Guard Only')]
          }
        )
      }
    })

    app.mount(container)

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    expect(guards.length).toBe(1)
    expect(guards[0].getAttribute('aria-hidden')).toBeNull()
    expect(guards[0].getAttribute('tabindex')).toBe('0')

    app.unmount()
  })

  it('traps focus inside the locked container when sentinels receive focus', async () => {
    const app = createApp({
      render() {
        return h(FocusLock, null, {
          default: () => [
            h('button', { id: 'btn-first' }, 'First'),
            h('button', { id: 'btn-second' }, 'Second')
          ]
        })
      }
    })

    app.mount(container)
    await nextTick()

    const firstBtn = container.querySelector<HTMLButtonElement>('#btn-first')!
    const secondBtn = container.querySelector<HTMLButtonElement>('#btn-second')!
    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    const leadingGuard = guards[0]
    const tailingGuard = guards[1]

    // Focus the second button initially
    secondBtn.focus()
    expect(document.activeElement).toBe(secondBtn)

    // Simulate tabbing forward past the last element into tailing guard
    tailingGuard.focus()
    tailingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Focus should be trapped and moved to the first button
    expect(document.activeElement).toBe(firstBtn)

    // Simulate shift-tabbing backward past first element into leading guard
    leadingGuard.focus()
    leadingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Focus should be trapped and moved back inside the container
    expect(document.activeElement === firstBtn || document.activeElement === secondBtn).toBe(true)

    app.unmount()
  })

  it('restores focus to original focused element when returnFocus is enabled', async () => {
    const outsideBtn = document.createElement('button')
    outsideBtn.id = 'outside'
    document.body.appendChild(outsideBtn)
    outsideBtn.focus()
    expect(document.activeElement).toBe(outsideBtn)

    const app = createApp({
      render() {
        return h(
          FocusLock,
          { returnFocus: true },
          {
            default: () => [h('button', { id: 'inside' }, 'Inside')]
          }
        )
      }
    })

    app.mount(container)
    await nextTick()

    const insideBtn = container.querySelector<HTMLButtonElement>('#inside')!
    insideBtn.focus()
    expect(document.activeElement).toBe(insideBtn)

    app.unmount()
    await nextTick()

    expect(document.activeElement).toBe(outsideBtn)
    document.body.removeChild(outsideBtn)
  })
})
