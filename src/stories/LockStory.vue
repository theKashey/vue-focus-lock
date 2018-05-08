<template>
    <div class="hello">
        <h1>{{ msg }}</h1>
        <h2>Essential Links</h2>
        <button @click="active=true" v-if="!active">ENABLE TRAP</button>
        <div style='background-color:#EEE'>you will be trapped here
            <Trap :disabled="trapActive">
                <ul>
                    <li>
                        <a href="https://vuejs.org" target="_blank">Core Docs</a>
                    </li>
                    <li>
                        <a href="https://forum.vuejs.org" target="_blank">Forum</a>
                    </li>
                    <li>
                        <a href="https://gitter.im/vuejs/vue" target="_blank">Gitter Chat</a>
                    </li>
                    <li>
                        <a href="https://twitter.com/vuejs" target="_blank">Twitter</a>
                    </li>
                    <br>
                    <li>
                        <a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a>
                    </li>
                </ul>
                <div v-if="active">
                    <button @click="active=false">DISABLE TRAP</button>
                </div>
            </Trap>
        </div>
        <h2>Ecosystem</h2>
        <ul>
            <li>
                <a href="http://router.vuejs.org/" target="_blank">vue-router</a>
            </li>
            <li>
                <a href="http://vuex.vuejs.org/" target="_blank">vuex</a>
            </li>
            <li>
                <a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a>
            </li>
            <li>
                <a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a>
            </li>
        </ul>
    </div>
</template>

<script>
  import Trap from '../index';
  export default {
    name: 'hello',
    components: {
      Trap: Trap
    },
    computed: {
      trapActive() {
        return !this.active;
      }
    },
    data () {
      return {
        msg: 'Welcome to Your Vue.js App',
        active: false
      }
    }
  }

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    h1,
    h2 {
        font-weight: normal;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    a {
        color: #42b983;
    }
</style>