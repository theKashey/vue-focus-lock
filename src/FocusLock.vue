<template>
  <div ref="rootEl">
    <div
      v-if="hasLeadingGuards"
      :tabIndex="disabled ? -1 : 0"
      aria-hidden="true"
      data-focus-guard
    ></div>

    <div @focusout="onBlur" v-bind="groupAttr" data-lock>
      <slot></slot>
    </div>

    <div
      v-if="hasTailingGuards"
      :tabIndex="disabled ? -1 : 0"
      aria-hidden="true"
      data-focus-guard
    ></div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref,
  toRefs,
  watch,
  type ComponentInternalInstance
} from 'vue'
import { focusInside, focusIsHidden, moveFocusInside } from 'focus-lock'
import { constants } from 'focus-lock'

interface VueFocusLockProps {
  /**
   * controls focus restoration behavior.
   * @default false, but is expected to be enabled almost always
   **/
  returnFocus?: boolean | FocusOptions
  /**
   * disables the lock
   * @default false
   **/
  disabled?: boolean
  /**
   * removes virtual nodes around the lock
   * @default false
   **/
  noFocusGuards?: boolean | 'tail'
  /**
   * specifies a group for the lock
   * other nodes can be added to the group by adding similar `[constants.FOCUS_GROUP]`('data-focus-lock') attribute
   **/
  group?: string
  /**
   * options to pass to focus operations (e.g. { preventScroll: true })
   **/
  focusOptions?: FocusOptions
}

interface LockState {
  instance?: ComponentInternalInstance['proxy']
  observed?: HTMLElement | null
  disabled: boolean
  focusOptions?: FocusOptions
  onActivation: () => void
}

let instances: LockState[] = []
let originalFocusedElement: Element | HTMLElement

const props = defineProps<VueFocusLockProps>()

const { returnFocus, disabled, noFocusGuards, group, focusOptions } = toRefs(props)

const rootEl = ref<HTMLDivElement | null>(null)
const data = ref<LockState>({ disabled: true, onActivation: () => {} })

const groupAttr = computed(() => {
  return { [constants.FOCUS_GROUP]: group.value }
})

const hasLeadingGuards = computed(() => {
  return noFocusGuards.value !== true
})

const hasTailingGuards = computed(() => {
  return hasLeadingGuards.value && noFocusGuards.value !== 'tail'
})

watch(disabled, () => {
  data.value.disabled = disabled.value
  emitChange()
})

watch(
  () => focusOptions?.value,
  () => {
    data.value.focusOptions = focusOptions?.value
  }
)

onMounted(() => {
  const currentInstance = getCurrentInstance()

  if (!currentInstance) {
    return
  }

  data.value = {
    instance: currentInstance.proxy,
    observed: rootEl.value!.querySelector<HTMLElement>('[data-lock]'),
    disabled: disabled.value,
    focusOptions: focusOptions?.value,
    onActivation: () => {
      originalFocusedElement = originalFocusedElement || (document && document.activeElement)
    }
  }

  if (!instances.length) {
    attachHandler()
  }

  instances.push(data.value)
  emitChange()
})

onUnmounted(() => {
  const currentInstance = getCurrentInstance()

  if (!currentInstance) {
    return
  }

  instances = instances.filter(({ instance }) => instance !== currentInstance.proxy)

  if (!instances.length) {
    detachHandler()
  }

  if (
    returnFocus.value &&
    originalFocusedElement &&
    (originalFocusedElement as HTMLElement).focus
  ) {
    const returnFocusOptions =
      typeof returnFocus.value === 'object' ? returnFocus.value : focusOptions?.value
    ;(originalFocusedElement as HTMLElement).focus(returnFocusOptions)
  }

  if (!instances.length) {
    originalFocusedElement = undefined as any
    lastActiveFocus = null
  }

  emitChange()
})

function deferAction(action: () => void) {
  setTimeout(action, 0)
}

let lastActiveTrap: LockState | null = null
let lastActiveFocus: Element | null = null

let focusWasOutsideWindow = false

const focusOnBody = () => document && document.activeElement === document.body

const isFreeFocus = () => focusOnBody() || focusIsHidden()

const activateTrap = () => {
  if (lastActiveTrap) {
    const { observed, onActivation, focusOptions } = lastActiveTrap

    if (focusWasOutsideWindow || !isFreeFocus() || !lastActiveFocus) {
      if (observed && !focusInside(observed)) {
        onActivation()
        moveFocusInside(observed, lastActiveFocus as Element, { focusOptions })
      }

      focusWasOutsideWindow = false
      lastActiveFocus = document && document.activeElement
    }
  }
}

const reducePropsToState = (propsList: LockState[]): LockState => {
  return propsList.filter(({ disabled }) => !disabled).slice(-1)[0]
}

const handleStateChangeOnClient = (trap: LockState) => {
  if (lastActiveTrap !== trap) {
    lastActiveTrap = null
  }

  lastActiveTrap = trap

  if (trap) {
    activateTrap()
    deferAction(activateTrap)
  }
}

const emitChange = () => {
  handleStateChangeOnClient(reducePropsToState(instances))
}

const onTrap = () => {
  activateTrap()
}

const onBlur = () => {
  deferAction(activateTrap)
}

const onWindowBlur = () => {
  focusWasOutsideWindow = true
  lastActiveFocus = null
}

const attachHandler = () => {
  document.addEventListener('focusin', onTrap, true)
  document.addEventListener('focusout', onBlur)
  window.addEventListener('blur', onWindowBlur)
}

const detachHandler = () => {
  document.removeEventListener('focusin', onTrap, true)
  document.removeEventListener('focusout', onBlur)
  window.removeEventListener('blur', onWindowBlur)
}
</script>
