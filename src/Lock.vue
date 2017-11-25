<template>
    <div @focusout="onBlur">
        <slot>It is a Trap</slot>
    </div>
</template>

<script>
  import moveFocusInside, {focusInside} from 'focus-lock';

  function deferAction(action) {
    setImmediate
      ? setImmediate(action)
      : setTimeout(action, 1)
  }


  let lastActiveTrap = 0;
  let lastActiveFocus = null;
  const activateTrap = () => {
    let result = false;
    if (lastActiveTrap) {
      const {observed, onActivation} = lastActiveTrap;
      if (observed && !focusInside(observed)) {
        onActivation();
        result = moveFocusInside(observed, lastActiveFocus);
      }
      lastActiveFocus = document.activeElement;
    }
    return result;
  };

  const reducePropsToState = (propsList) => {
    return propsList
      .filter(({disabled}) => !disabled)
      .slice(-1)[0];
  };

  const handleStateChangeOnClient = (trap) => {
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
      }
    },
    data(){
      return {
        data: {}
      }
    },
    watch: {
      disabled(){
        this.data.disabled = this.disabled;
        emitChange();
      }
    },

    methods: {
      onBlur() {
        deferAction(emitChange);
      },
    },

    mounted(){
      this.data.vue = this;
      this.data.observed = this.$el;
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

    destroyed(){
      instances = instances.filter(({vue}) => vue != this);
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