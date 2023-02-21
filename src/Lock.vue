<template>
    <div ref="rootEl">
        <div v-if="hasLeadingGuards" :tabIndex="disabled ? -1 : 0" :style="hidden" aria-hidden="true"></div>

        <div @focusout="onBlur" v-bind="groupAttr" data-lock>
            <slot></slot>
        </div>

        <div v-if="hasTailingGuards" :tabIndex="disabled ? -1 : 0" :style="hidden" aria-hidden="true"></div>
    </div>
</template>

<script>
  import { computed, getCurrentInstance, onMounted, onUnmounted, ref, toRefs, watch } from 'vue-demi';
  import moveFocusInside, {focusInside, focusIsHidden} from 'focus-lock';
  import {constants} from 'focus-lock';

  function deferAction(action) {
    const setImmediate = window.setImmediate;
    if (typeof setImmediate !== 'undefined') {
      setImmediate(action)
    } else {
      setTimeout(action, 1)
    }
  }

  let lastActiveTrap = 0;
  let lastActiveFocus = null;

  let focusWasOutsideWindow = false;

  const focusOnBody = () => (
    document && document.activeElement === document.body
  );

  const isFreeFocus = () => focusOnBody() || focusIsHidden();

  const activateTrap = () => {
    let result = false;
    if (lastActiveTrap) {
      const {observed, onActivation} = lastActiveTrap;
      if (focusWasOutsideWindow || !isFreeFocus() || !lastActiveFocus) {
        if (observed && !focusInside(observed)) {
          onActivation();
          result = moveFocusInside(observed, lastActiveFocus);
        }
        focusWasOutsideWindow = false;
        lastActiveFocus = document && document.activeElement;
      }
    }
    return result;
  };

  const reducePropsToState = (propsList) => {
    return propsList
      .filter(({disabled}) => !disabled)
      .slice(-1)[0];
  };

  const handleStateChangeOnClient = (trap) => {
    if (lastActiveTrap !== trap) {
      lastActiveTrap = null;
    }
    lastActiveTrap = trap;
    if (trap) {
      activateTrap();
      deferAction(activateTrap);
    }
  };

  let instances = [];

  const emitChange = () => {
    handleStateChangeOnClient(reducePropsToState(instances));
  };

  const onTrap = (event) => {
    if (activateTrap() && event) {
      // prevent scroll jump
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const onBlur = () => {
    deferAction(activateTrap);
  };

  const onWindowBlur = () => {
    focusWasOutsideWindow = true;
  };

  const attachHandler = () => {
    document.addEventListener('focusin', onTrap, true);
    document.addEventListener('focusout', onBlur);
    window.addEventListener('blur', onWindowBlur);
  };

  const detachHandler = () => {
    document.removeEventListener('focusin', onTrap, true);
    document.removeEventListener('focusout', onBlur);
    window.removeEventListener('blur', onWindowBlur);
  };


  export default {
    name: 'Lock',
    props: {
      returnFocus: {
        type: Boolean
      },
      disabled: {
        type: Boolean
      },
      noFocusGuards: {
        type: [Boolean, String],
        default: false
      },
      group: {
        type: String
      }
    },
    setup(props) {
      const { returnFocus, disabled, noFocusGuards, group } = toRefs(props);

      const rootEl = ref(null);
      const data = ref({});
      const hidden = ref(""); //    "width: 1px;height: 0px;padding: 0;overflow: hidden;position: fixed;top: 0;left: 0;"

      const groupAttr = computed(() => {
        return {[constants.FOCUS_GROUP]: group.value};
      });

      const hasLeadingGuards = computed(() => {
        return noFocusGuards.value !== true;
      });

      const hasTailingGuards = computed(() => {
        return hasLeadingGuards.value && (noFocusGuards.value !== 'tail');
      });

      watch(disabled, () => {
        data.value.disabled = disabled.value;
        emitChange();
      });


      let originalFocusedElement;

      onMounted(() => {
        data.value.vue = getCurrentInstance()?.proxy;
        data.value.observed = rootEl.value.querySelector("[data-lock]");

        data.value.disabled = disabled.value;
        data.value.onActivation = () => {
          originalFocusedElement = originalFocusedElement || document && document.activeElement;
        };

        if (!instances.length) {
          attachHandler();
        }
        instances.push(data.value);
        emitChange();
      });

      onUnmounted(() => {
        instances = instances.filter(({vue}) => vue !== getCurrentInstance()?.proxy);
        if (!instances.length) {
          detachHandler();
        }
        if (
          returnFocus.value &&
          originalFocusedElement &&
          originalFocusedElement.focus
        ) {
          originalFocusedElement.focus();
        }
        emitChange();
      });

      return {
        groupAttr,
        hasLeadingGuards,
        hasTailingGuards,
        hidden,
        onBlur: () => deferAction(emitChange),
        rootEl,
      };
    },
  }

</script>
