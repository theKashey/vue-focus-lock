import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import FocusLock from '../src/FocusLock.vue'

describe('FocusLock Component', () => {
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
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders guards with tabindex="0" by default', () => {
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
      expect(guard.getAttribute('tabindex')).toBe('0')
    })

    app.unmount()
  })

  it('sets tabindex="-1" on guards when disabled', () => {
    const app = createApp({
      render() {
        return h(
          FocusLock,
          { disabled: true },
          {
            default: () => [h('button', { id: 'btn' }, 'Disabled Button')]
          }
        )
      }
    })

    app.mount(container)

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    expect(guards.length).toBe(2)
    guards.forEach((guard) => {
      expect(guard.getAttribute('tabindex')).toBe('-1')
    })

    app.unmount()
  })

  it('supports noFocusGuards=true to omit guards completely', () => {
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

  it('supports noFocusGuards="tail" to omit only the tailing guard', () => {
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

    secondBtn.focus()
    expect(document.activeElement).toBe(secondBtn)

    // Simulate tabbing forward past the last element into tailing guard
    tailingGuard.focus()
    tailingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(document.activeElement).toBe(firstBtn)

    // Simulate shift-tabbing backward past first element into leading guard
    leadingGuard.focus()
    leadingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 10))

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
  })

  it('forwards focusOptions to focus calls when trapping focus', async () => {
    const originalFocus = HTMLElement.prototype.focus
    const focusSpy = vi.fn(function (this: HTMLElement, options?: FocusOptions) {
      originalFocus.call(this, options)
    })
    HTMLElement.prototype.focus = focusSpy

    const app = createApp({
      render() {
        return h(
          FocusLock,
          { focusOptions: { preventScroll: true } },
          {
            default: () => [
              h('button', { id: 'btn-target-1' }, 'Button 1'),
              h('button', { id: 'btn-target-2' }, 'Button 2')
            ]
          }
        )
      }
    })

    app.mount(container)
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    const tailingGuard = guards[1]

    focusSpy.mockClear()

    // Trigger focus trap activation via guard
    tailingGuard.focus()
    tailingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    // Ensure focus was called on the button inside with preventScroll: true
    const callsWithPreventScroll = focusSpy.mock.calls.filter(
      (args) => args[0] && (args[0] as FocusOptions).preventScroll === true
    )
    expect(callsWithPreventScroll.length).toBeGreaterThan(0)

    app.unmount()
  })

  it('passes focusOptions to returnFocus on unmount', async () => {
    const originalFocus = HTMLElement.prototype.focus
    const focusSpy = vi.fn(function (this: HTMLElement, options?: FocusOptions) {
      originalFocus.call(this, options)
    })
    HTMLElement.prototype.focus = focusSpy

    const outsideBtn = document.createElement('button')
    outsideBtn.id = 'outside-btn'
    document.body.appendChild(outsideBtn)
    outsideBtn.focus()

    const app = createApp({
      render() {
        return h(
          FocusLock,
          { returnFocus: true, focusOptions: { preventScroll: true } },
          {
            default: () => [h('button', { id: 'inside-btn' }, 'Inside')]
          }
        )
      }
    })

    app.mount(container)
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    focusSpy.mockClear()

    app.unmount()
    await nextTick()

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('supports passing FocusOptions object directly to returnFocus', async () => {
    const originalFocus = HTMLElement.prototype.focus
    const focusSpy = vi.fn(function (this: HTMLElement, options?: FocusOptions) {
      originalFocus.call(this, options)
    })
    HTMLElement.prototype.focus = focusSpy

    const outsideBtn = document.createElement('button')
    outsideBtn.id = 'outside-btn-direct'
    document.body.appendChild(outsideBtn)
    outsideBtn.focus()

    const app = createApp({
      render() {
        return h(
          FocusLock,
          { returnFocus: { preventScroll: true } },
          {
            default: () => [h('button', { id: 'inside-btn' }, 'Inside')]
          }
        )
      }
    })

    app.mount(container)
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    focusSpy.mockClear()

    app.unmount()
    await nextTick()

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('handles reactive update of focusOptions prop', async () => {
    const originalFocus = HTMLElement.prototype.focus
    const focusSpy = vi.fn(function (this: HTMLElement, options?: FocusOptions) {
      originalFocus.call(this, options)
    })
    HTMLElement.prototype.focus = focusSpy

    const currentFocusOptions = ref<FocusOptions>({ preventScroll: false })

    const app = createApp({
      render() {
        return h(
          FocusLock,
          { focusOptions: currentFocusOptions.value },
          {
            default: () => [h('button', { id: 'btn-dyn' }, 'Dynamic Button')]
          }
        )
      }
    })

    app.mount(container)
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    // Dynamically change focusOptions
    currentFocusOptions.value = { preventScroll: true }
    await nextTick()

    focusSpy.mockClear()

    const guards = container.querySelectorAll<HTMLElement>('[data-focus-guard]')
    const tailingGuard = guards[1]

    tailingGuard.focus()
    tailingGuard.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 20))

    const callsWithPreventScroll = focusSpy.mock.calls.filter(
      (args) => args[0] && (args[0] as FocusOptions).preventScroll === true
    )
    expect(callsWithPreventScroll.length).toBeGreaterThan(0)

    app.unmount()
  })
})
