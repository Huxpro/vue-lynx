<!--
  Lynx Limitations:
  - inline-flex: Lynx has no inline layout; uses display: flex instead of inline-flex
  - baseline alignment: Lynx may not support align-items: baseline; falls back to flex-start
-->
<script lang="ts">
import { computed, defineComponent, Comment, Fragment, Text, h } from 'vue-lynx';
import type { PropType, VNode, CSSProperties } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import type { SpaceSize, SpaceAlign } from './types';
import './index.less';

const [name, bem] = createNamespace('space');

function filterEmpty(children: VNode[] = []): VNode[] {
  const nodes: VNode[] = [];
  children.forEach((child) => {
    if (Array.isArray(child)) {
      nodes.push(...(child as VNode[]));
    } else if (child.type === Fragment) {
      nodes.push(...filterEmpty(child.children as VNode[]));
    } else {
      nodes.push(child);
    }
  });
  return nodes.filter(
    (c) =>
      !(
        c &&
        (c.type === Comment ||
          (c.type === Fragment && (c.children as VNode[])?.length === 0) ||
          (c.type === Text && (c.children as string).trim() === ''))
      ),
  );
}

export default defineComponent({
  name,
  props: {
    align: String as PropType<SpaceAlign>,
    direction: {
      type: String as PropType<'vertical' | 'horizontal'>,
      default: 'horizontal',
    },
    size: {
      type: [Number, String, Array] as PropType<
        number | string | [SpaceSize, SpaceSize]
      >,
      default: 8,
    },
    wrap: Boolean,
    fill: Boolean,
  },
  setup(props, { slots }) {
    const mergedAlign = computed(
      () => props.align ?? (props.direction === 'horizontal' ? 'center' : ''),
    );

    const getMargin = (size: SpaceSize): string => {
      if (typeof size === 'number') {
        return size + 'px';
      }
      return size;
    };

    const getMarginStyle = (isLast: boolean): CSSProperties => {
      const style: CSSProperties = {};

      const marginRight = getMargin(
        Array.isArray(props.size) ? props.size[0] : props.size,
      );
      const marginBottom = getMargin(
        Array.isArray(props.size) ? props.size[1] : props.size,
      );

      if (isLast) {
        return props.wrap ? { marginBottom } : {};
      }

      if (props.direction === 'horizontal') {
        style.marginRight = marginRight;
      }
      if (props.direction === 'vertical' || props.wrap) {
        style.marginBottom = marginBottom;
      }

      return style;
    };

    return () => {
      const children = filterEmpty(slots.default?.());
      return h(
        'view',
        {
          class: bem([
            props.direction,
            {
              [`align-${mergedAlign.value}`]: !!mergedAlign.value,
              wrap: props.wrap,
              fill: props.fill,
            },
          ]),
        },
        children.map((c, i) =>
          h(
            'view',
            {
              key: `item-${i}`,
              class: `${name}-item`,
              style: getMarginStyle(i === children.length - 1),
            },
            [c],
          ),
        ),
      );
    };
  },
});
</script>
