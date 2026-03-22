<!--
  Lynx Limitations:
  - teleport: Not supported in Lynx
-->
<script lang="ts">
import { defineComponent, computed, provide, ref, watch, h, Comment, Fragment, type VNode } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Tabs from '../Tabs/index.vue';
import Tab from '../Tab/index.vue';
import PickerToolbar from '../Picker/PickerToolbar.vue';
import { PICKER_GROUP_KEY, type PickerGroupChild } from './types';
import './index.less';

const [, bem] = createNamespace('picker-group');

export default defineComponent({
  name: 'van-picker-group',

  props: {
    tabs: {
      type: Array as () => string[],
      default: () => [],
    },
    activeTab: {
      type: [Number, String],
      default: 0,
    },
    nextStepText: String,
    showToolbar: {
      type: Boolean,
      default: true,
    },
    title: String,
    confirmButtonText: String,
    cancelButtonText: String,
  },

  emits: ['confirm', 'cancel', 'update:activeTab'],

  setup(props, { emit, slots }) {
    // Track active tab internally, sync with prop
    const internalActiveTab = ref<number | string>(props.activeTab);

    watch(
      () => props.activeTab,
      (val) => {
        if (val !== internalActiveTab.value) {
          internalActiveTab.value = val;
        }
      },
    );

    function onUpdateActive(val: number | string) {
      internalActiveTab.value = val;
      emit('update:activeTab', val);
    }

    // Child picker registration
    const children: PickerGroupChild[] = [];

    provide(PICKER_GROUP_KEY, {
      register(child: PickerGroupChild) {
        children.push(child);
      },
      unregister(child: PickerGroupChild) {
        const index = children.indexOf(child);
        if (index > -1) {
          children.splice(index, 1);
        }
      },
    });

    // Next step logic
    function showNextButton() {
      return +internalActiveTab.value < props.tabs.length - 1 && props.nextStepText;
    }

    function onConfirm() {
      if (showNextButton()) {
        const next = +internalActiveTab.value + 1;
        internalActiveTab.value = next;
        emit('update:activeTab', next);
      } else {
        emit(
          'confirm',
          children.map((item) => item.confirm()),
        );
      }
    }

    function onCancel() {
      emit('cancel');
    }

    // Flatten slot children (remove Comment, flatten Fragment)
    function getChildNodes(): VNode[] | undefined {
      const defaultSlot = slots.default?.();
      if (!defaultSlot) return undefined;

      const result: VNode[] = [];
      for (const node of defaultSlot) {
        if (node.type === Comment) continue;
        if (node.type === Fragment && Array.isArray(node.children)) {
          for (const child of node.children as VNode[]) {
            if ((child as VNode).type !== Comment) {
              result.push(child as VNode);
            }
          }
        } else {
          result.push(node);
        }
      }
      return result;
    }

    return () => {
      const childNodes = getChildNodes();

      const confirmButtonText = showNextButton()
        ? props.nextStepText
        : props.confirmButtonText;

      const toolbarSlots: Record<string, () => VNode[]> = {};
      if (slots.toolbar) toolbarSlots.toolbar = slots.toolbar;
      if (slots.title) toolbarSlots.title = slots.title;
      if (slots.confirm) toolbarSlots.confirm = slots.confirm;
      if (slots.cancel) toolbarSlots.cancel = slots.cancel;

      return h('view', { class: bem() }, [
        // Toolbar
        props.showToolbar
          ? h(
              PickerToolbar,
              {
                title: props.title,
                cancelButtonText: props.cancelButtonText,
                confirmButtonText: confirmButtonText,
                onConfirm,
                onCancel,
              },
              toolbarSlots,
            )
          : null,

        // Tabs
        h(
          Tabs,
          {
            active: internalActiveTab.value,
            class: bem('tabs'),
            shrink: true,
            animated: true,
            lazyRender: false,
            showHeader: true,
            'onUpdate:active': onUpdateActive,
          },
          () =>
            props.tabs.map((title, index) =>
              h(
                Tab,
                {
                  key: index,
                  title,
                  titleClass: bem('tab-title'),
                },
                () => (childNodes?.[index] ? [childNodes[index]] : []),
              ),
            ),
        ),
      ]);
    };
  },
});
</script>
