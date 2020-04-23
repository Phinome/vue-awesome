<script>
import nanoid from "nanoid/non-secure";
import {
  h,
  mergeProps,
  defineComponent,
  ref,
  computed,
  onMounted,
  warn,
  nextTick
} from "vue";

import { icons } from "./register";
// function warn(msg, vm) {
//   if (!vm) {
//     /* eslint-disable no-console */
//     console.error(msg);
//     /* eslint-enable no-console */
//     return;
//   }
//   vm.constructor.super.util.warn(msg, vm);
// }

export default defineComponent({
  name: "fa-icon",
  props: {
    name: {
      type: String,
      validator(val) {
        if (val && !(val in icons)) {
          warn(
            `Invalid prop: prop "name" is referring to an unregistered icon "${val}".\n` +
              `Please make sure you have imported this icon before using it.`
          );
          return false;
        }
        return true;
      }
    },
    title: String,
    scale: [Number, String],
    spin: Boolean,
    inverse: Boolean,
    pulse: Boolean,
    flip: {
      validator(val) {
        return val === "horizontal" || val === "vertical" || val === "both";
      }
    },
    label: String,
    tabindex: [Number, String]
  },
  setup(props, { slots, attrs }) {
    const id = ref(getId("va-"));
    const childrenWidth = ref(0);
    const childrenHeight = ref(0);
    const outerScale = ref(1);

    const normalizedScale = computed(() => {
      let scale = props.scale;
      scale = typeof scale === "undefined" ? 1 : Number(scale);
      if (isNaN(scale) || scale <= 0) {
        warn(`Invalid prop: prop "scale" should be a number over 0.`);
        return outerScale.value;
      }
      return scale * outerScale.value;
    });

    const klass = computed(() => {
      let classes = {
        "fa-icon": true,
        "fa-spin": props.spin,
        "fa-flip-horizontal": props.flip === "horizontal",
        "fa-flip-vertical": props.flip === "vertical",
        "fa-flip-both": props.flip === "both",
        "fa-inverse": props.inverse,
        "fa-pulse": props.pulse
      };

      if (props.classes) {
        Object.keys(props.classes).forEach(c => {
          if (props.classes[c]) {
            classes[c] = true;
          }
        });
      }

      return classes;
    });

    const icon = computed(() => {
      if (props.name) {
        return icons[props.name];
      }
      return null;
    });

    const width = computed(() => {
      return (
        childrenWidth.value ||
        (icon.value &&
          (icon.value.width / ratio.value) * normalizedScale.value) ||
        0
      );
    });

    const height = computed(() => {
      return (
        childrenHeight.value ||
        (icon.value &&
          (icon.value.height / ratio.value) * normalizedScale.value) ||
        0
      );
    });

    const box = computed(() => {
      if (icon.value) {
        return `0 0 ${icon.value.width} ${icon.value.height}`;
      }
      return `0 0 ${width.value} ${height.value}`;
    });

    const ratio = computed(() => {
      if (!icon.value) {
        return 1;
      }
      let { width, height } = icon.value;
      return Math.max(width, height) / 16;
    });

    const style = computed(() => {
      if (normalizedScale.value === 1) {
        return false;
      }
      return {
        fontSize: normalizedScale.value + "em"
      };
    });

    const raw = computed(() => {
      // generate unique id for each icon's SVG element with ID
      if (!icon.value || !icon.value.raw) {
        return null;
      }
      let raw = icon.value.raw;
      let ids = {};
      raw = raw.replace(
        /\s(?:xml:)?id=(["']?)([^"')\s]+)\1/g,
        (match, quote, id) => {
          let uniqueId = getId("vat-");
          ids[id] = uniqueId;
          return ` id="${uniqueId}"`;
        }
      );
      raw = raw.replace(
        /#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g,
        (match, rawId, _, pointerId) => {
          let id = rawId || pointerId;
          if (!id || !ids[id]) {
            return match;
          }

          return `#${ids[id]}`;
        }
      );

      return raw;
    });

    const focusable = computed(() => {
      let { tabindex } = props;
      if (tabindex == null) {
        return "false";
      }
      let index = typeof tabindex === "string" ? +tabindex : tabindex;
      if (index >= 0) {
        return null;
      }
      return "false";
    });

    function updateStack() {
      const children =
        typeof slots.default === "function" ? slots.default() : [];
      if (!props.name && props.name !== null && children.length === 0) {
        warn(`Invalid prop: prop "name" is required.`);
        return;
      }

      if (icon.value) {
        return;
      }

      let width = 0;
      let height = 0;
      children.forEach(async (child) => {
        await nextTick();
        child.outerScale = normalizedScale.value;

        width = Math.max(width, child.width || 0);
        height = Math.max(height, child.height || 0);
      });
      childrenWidth.value = width;
      childrenHeight.value = height;
      children.forEach(async (child) => {
        await nextTick();
        child.x = (width - child.width || 0) / 2;
        child.y = (height - child.height || 0) / 2;
      });
    }

    const render = () => {
      if (props.name === null) {
        return h();
      }

      let options = mergeProps(
        {
          class: klass.value,
          style: style.value,
          role: attrs.role || (props.label || props.title ? "img" : null),
          "aria-label": props.label || null,
          "aria-hidden": !(props.label || props.title),
          tabindex: props.tabindex,
          width: width.value,
          height: height.value,
          viewBox: box.value,
          focusable: focusable.value
        },
        attrs
      );

      let titleId = id.value;
      if (props.title) {
        options["aria-labelledby"] = titleId;
      }

      if (raw.value) {
        let html = `<g>${raw.value}</g>`;

        if (props.title) {
          html = `<title id="${titleId}">${escapeHTML(
            props.title
          )}</title>${html}`;
        }

        options.innerHTML = html;
      }

      let content = props.title
        ? [h("title", { id: titleId }, props.title)]
        : [];

      const slotContent = slots.default ? slots.default() : [];

      return h(
        "svg",
        options,
        raw.value
          ? null
          : content.concat([
              h(
                "g",
                slotContent.length ||
                  (icon.value
                    ? [
                        ...icon.value.paths.map((path, i) =>
                          h("path", {
                            ...path,
                            key: `path-${i}`
                          })
                        ),
                        ...icon.value.polygons.map((polygon, i) =>
                          h("polygon", {
                            polygon,
                            key: `polygon-${i}`
                          })
                        )
                      ]
                    : [])
              )
            ])
      );
    };

    onMounted(updateStack);

    // onUpdated(updateStack);

    return render;
  }
});

function getId(prefix = "") {
  return prefix + nanoid(7);
}

const ESCAPE_MAP = {
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "&": "&amp;"
};

function escapeHTML(html) {
  return html.replace(/[<>"&]/g, c => ESCAPE_MAP[c] || c);
}
</script>

<style>
.fa-icon {
  display: inline-block;
  fill: currentColor;
  overflow: visible;
}

.fa-icon > g {
  transform-origin: 50% 50%;
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both {
  transform: scale(-1, -1);
}

.fa-spin > g {
  animation: fa-spin 1s 0s infinite linear;
}

.fa-pulse > g {
  animation: fa-spin 1s infinite steps(8);
}

.fa-inverse {
  color: #fff;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
