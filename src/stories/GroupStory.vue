<template>
  <div>
    <button>Button</button>
    <div style="margin-top: 70vh">
      <button @click="toggle">!ACTIVATE THE TRAP!</button>
    </div>

    <div v-if="!disabled">
      <Trap group="g1">
        <button>BUTTON</button>
        <a href="#">link somewhere</a> <br />
        <button @click="toggle">DEACTIVATE</button>
      </Trap>
    </div>

    some text outside

    <div style="margin-top: 70vh">
      <button>Button</button>
    </div>

    some text outside

    <div v-if="!disabled">
      <Trap group="g1">
        <button>BUTTON</button>
        <a href="#">link somewhere</a> <br />
        <button @click="toggle">DEACTIVATE</button>
      </Trap>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Trap from '../index'

export default defineComponent({
  name: 'GroupStory',
  components: { Trap },
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
})
</script>

<style scoped></style>
