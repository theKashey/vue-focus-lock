<template>
  <div>
    <button>Button-1</button>
    <div style="margin-top: 70vh">
      <button @click="toggle">!ACTIVATE THE TRAP!</button>
    </div>

    <p>
      Probably would not work properly in storybook iframe.
      <a
        target="_blank"
        href="iframe.html?viewMode=story&id=notailingguardstory--no-tailing-guards"
      >
        Open iframe in new tab
      </a>
    </p>

    <div v-if="!disabled">
      <Trap no-focus-guards="tail">
        <button>BUTTON-2</button>
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
  name: 'NoTailingGuardStory',
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
