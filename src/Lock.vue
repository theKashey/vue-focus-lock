<template>
    <div @focusout="onBlur">
        <slot>It is a Trap</slot>
    </div>
</template>

<script>
  import moveFocusInside, { focusInside } from 'focus-lock';

  let lastActiveTrap = 0;
  let lastActiveFocus = null;
  const activateTrap = () => {
    if (lastActiveTrap) {
      const { observed, onActivation } = lastActiveTrap;
      if (observed && !focusInside(observed)) {
        onActivation && onActivation();
        moveFocusInside(observed, lastActiveFocus);
      }
      lastActiveFocus = document.activeElement;
    }
  };

  const reducePropsToState = (propsList) => {
    return propsList
      .filter(({ disabled }) => !disabled)
      .slice(-1)[0];
  };

  const handleStateChangeOnClient = (trap) => {
    lastActiveTrap = trap;
    if (trap) {
      activateTrap();
      setImmediate(activateTrap);
    }
  };

  let instances = [];

  const emitChange = () => {
    handleStateChangeOnClient(reducePropsToState(instances));
  };

  export default {
    name: 'Lock',
    props: {
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
        setImmediate(emitChange);
      },
    },

    mounted(){
      this.data.vue = this;
      this.data.observed = this.$el;
      this.data.disabled = this.disabled;

      instances.push(this.data);
      emitChange();
    },

    destroyed(){
      instances = instances.filter(({ vue }) => vue != this);
      emitChange();
    }
  }

</script>