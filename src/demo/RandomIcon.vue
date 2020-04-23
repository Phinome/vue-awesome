<template>
  <v-icon :name="name" scale="4" />
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import VIcon from "../components/Icon.vue";
import { icons } from "../components/register";
import "../icons";
const keys = Object.keys(icons);

function randomIcon() {
  return keys[Math.floor(Math.random() * keys.length)];
}

export default defineComponent({
  name: "random-icon",
  components: {
    VIcon
  },
  props: {
    playing: Boolean
  },
  setup(props) {
    let name = ref(randomIcon());

    function change() {
      name.value = randomIcon();
    }

    const intervalPlaying = () =>
      setInterval(() => {
        if (props.playing) {
          change();
        }
      }, 200);

    onMounted(intervalPlaying);

    return {
      name
    };
  }
});
</script>
