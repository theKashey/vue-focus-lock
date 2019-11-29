<template>
    <div>
        <button>Button-1</button>
        <div style="margin-top: 70vh">
            <button @click="toggle">!ACTIVATE THE TRAP!</button>
        </div>

        <p>
            Probably would not work properly in storybook iframe.
            <a target="_blank" href="iframe.html?selectedKind=No%20focus%20guards&selectedStory=no%20tailing%20guard">
                Open iframe in new tab
            </a>
        </p>

        <div v-if="!disabled">
            <Trap no-focus-guards="tail">
                <button>BUTTON-2</button>
                <a href='#'>link somewhere</a> <br/>
                <button @click="toggle">DEACTIVATE</button>
            </Trap>
        </div>
    </div>
</template>

<script>
  import Trap from '../index';

  export default {
    name: "NoTailingGuardStory",
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
