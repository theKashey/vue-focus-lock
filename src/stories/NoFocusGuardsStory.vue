<template>
    <div>
        <button>Button-1</button>
        <div style="margin-top: 70vh">
            <button @click="toggle">!ACTIVATE THE TRAP!</button>
        </div>

        <div v-if="!disabled">
            <Trap :no-focus-guards="true">
                <button>BUTTON-2</button>
                <a href='#'>link somewhere</a> <br/>
                <button @click="toggle">DEACTIVATE</button>
            </Trap>
        </div>

        <div style="margin-top: 70vh">
            <button>Button-3</button>
        </div>
    </div>
</template>

<script>
  import Trap from '../index';

  export default {
    name: "NoFocusGuardsStory",
    components: {Trap},
    data() {
      return {
        disabled: true
      }
    },
    methods: {
      toggle() {
        this.disabled = !this.disabled
      }
    }
  }
</script>

<style scoped>

</style>
