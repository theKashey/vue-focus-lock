<template>
  <div ref="rootEl">
    <div v-if="hasLeadingGuards" :tabIndex="disabled ? -1 : 0" aria-hidden="true"></div>

    <div @focusout="onBlur" v-bind="groupAttr" data-lock>
      <slot></slot>
    </div>

    <div v-if="hasTailingGuards" :tabIndex="disabled ? -1 : 0" aria-hidden="true"></div>
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
  returnFocus?: boolean
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
}

interface LockState {
  instance?: ComponentInternalInstance['proxy']
  observed?: HTMLElement | null
  disabled: boolean
  onActivation: () => void
}

let instances: LockState[] = []
let originalFocusedElement: Element | HTMLElement

const props = defineProps<VueFocusLockProps>()

const { returnFocus, disabled, noFocusGuards, group } = toRefs(props)

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

onMounted(() => {
  const currentInstance = getCurrentInstance()

  if (!currentInstance) {
    return
  }

  data.value = {
    instance: currentInstance.proxy,
    observed: rootEl.value!.querySelector<HTMLElement>('[data-lock]'),
    disabled: disabled.value,
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
    ;(originalFocusedElement as HTMLElement).focus()
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
    const { observed, onActivation } = lastActiveTrap

    if (focusWasOutsideWindow || !isFreeFocus() || !lastActiveFocus) {
      if (observed && !focusInside(observed)) {
        onActivation()
        moveFocusInside(observed, lastActiveFocus as Element)
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
