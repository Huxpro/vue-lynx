<!--
  Lynx Limitations:
  - baseline alignment: Lynx does not support align-items: baseline, falls back to flex-start
  - inline-flex: Lynx default display is linear, we use display: flex explicitly
  - CSS class-based styling: replaced with inline styles for Lynx compatibility
-->
<script lang="ts">
import { computed, defineComponent, Comment, Fragment, Text, h } from 'vue-lynx';
import type { PropType, VNode, CSSProperties } from 'vue-lynx';
import type { SpaceSize, SpaceAlign } from './types';

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
  name: 'VanSpace',
  props: {
    align: String as PropType<SpaceAlign>,
    direction: {
      type: String as PropType<'vertical' | 'horizontal'>,
      default: 'horizontal',
    },
    size: {
      type: [Number, String, Array] as PropType<SpaceSize | [SpaceSize, SpaceSize]>,
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

    const alignMap: Record<string, string> = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      baseline: 'flex-start', // Lynx doesn't support baseline
    };

    return () => {
      const children = filterEmpty(slots.default?.());

      const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: props.direction === 'vertical' ? 'column' : 'row',
        flexWrap: props.wrap ? 'wrap' : 'nowrap',
      };

      if (mergedAlign.value) {
        containerStyle.alignItems = alignMap[mergedAlign.value] || mergedAlign.value;
      }

      if (props.fill) {
        containerStyle.width = '100%';
      }

      return h(
        'view',
        { style: containerStyle },
        children.map((child, index) =>
          h(
            'view',
            {
              key: `item-${index}`,
              style: {
                ...getMarginStyle(index === children.length - 1),
                ...(props.fill ? { flex: 1 } : {}),
              },
            },
            [child],
          ),
        ),
      );
    };
  },
});
</script>
