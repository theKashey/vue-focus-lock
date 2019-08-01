<template>
    <div>
        <div :tabIndex="disabled ? -1 : 0" :style="hidden"></div>
        <div :tabIndex="disabled ? -1 : 1" :style="hidden"></div>

        <div @focusout="onBlur" data-lock>
            <slot></slot>
        </div>

        <div :tabIndex="disabled ? -1 : 0" :style="hidden"></div>
    </div>
</template>

<script>
  import moveFocusInside, {focusInside, focusIsHidden} from 'focus-lock';

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

  const focusOnBody = () => (
    document && document.activeElement === document.body
  );

  const isFreeFocus = () => focusOnBody() || focusIsHidden();

  const activateTrap = () => {
    let result = false;
    if (lastActiveTrap) {
      const {observed, onActivation} = lastActiveTrap;
      if (!isFreeFocus() || !lastActiveFocus) {
        if (observed && !focusInside(observed)) {
          onActivation();
          result = moveFocusInside(observed, lastActiveFocus);
        }
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

  const attachHandler = () => {
    document.addEventListener('focusin', onTrap, true);
    document.addEventListener('focusout', onBlur);
  };

  const detachHandler = () => {
    document.removeEventListener('focusin', onTrap, true);
    document.removeEventListener('focusout', onBlur);
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
        type: Boolean
      }
    },
    data() {
      return {
        data: {},
        hidden: ""//    "width: 1px;height: 0px;padding: 0;overflow: hidden;position: fixed;top: 0;left: 0;"
      }
    },
    computed: {
      guardsEnabled() {
        return !(this.disabled || this.noFocusGuards);
      }
    },
    watch: {
      disabled() {
        this.data.disabled = this.disabled;
        emitChange();
      }
    },

    methods: {
      onBlur() {
        deferAction(emitChange);
      },
    },

    mounted() {
      this.data.vue = this;
      this.data.observed = this.$el.querySelector("[data-lock]");

      this.data.disabled = this.disabled;
      this.data.onActivation = () => {
        this.originalFocusedElement = this.originalFocusedElement || document.activeElement;
      };

      if (!instances.length) {
        attachHandler();
      }
      instances.push(this.data);
      emitChange();
    },

    destroyed() {
      instances = instances.filter(({vue}) => vue !== this);
      if (!instances.length) {
        detachHandler();
      }
      if (
        this.returnFocus &&
        this.originalFocusedElement &&
        this.originalFocusedElement.focus
      ) {
        this.originalFocusedElement.focus();
      }
      emitChange();
    }
  }

</script>