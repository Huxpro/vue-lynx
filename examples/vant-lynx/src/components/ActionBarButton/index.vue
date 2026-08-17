<!--
  Vant Feature Parity Report (ActionBarButton):
  - Props: 6/8 supported (type, text, icon, color, loading, disabled)
    - type: 'default'|'primary'|'success'|'warning'|'danger' - button theme
    - text: string - button label
    - icon: string - icon name (uses Icon component)
    - color: string - custom background color
    - loading: boolean - show loading state (uses Loading component)
    - disabled: boolean - disable interactions
    - Missing: route-related props (to, url, replace) - no router in Lynx
  - Events: 1/1 supported (click)
  - Slots: 1/1 supported (default - replaces text)
  - Lynx Adaptations:
    - Uses Loading component for loading state instead of "..."
    - Uses Icon component for icon rendering
    - No border-radius logic based on sibling buttons (Vant uses isFirst/isLast)
  - Gaps:
    - No route navigation (to, url, replace props)
    - No isFirst/isLast border-radius adjustment (requires useChildren/useParent)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Loading from '../Loading/index.vue';

export interface ActionBarButtonProps {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  text?: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ActionBarButtonProps>(), {
  type: 'default',
  text: '',
  icon: '',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const typeColors: Record<string, { bg: string; text: string }> = {
  default: { bg: '#fff', text: '#323233' },
  primary: { bg: '#1989fa', text: '#fff' },
  success: { bg: '#07c160', text: '#fff' },
  warning: { bg: '#ff976a', text: '#fff' },
  danger: { bg: '#ee0a24', text: '#fff' },
};

function onTap(event: any) {
  if (props.disabled || props.loading) return;
  emit('click', event);
}

const buttonStyle = computed(() => {
  const colors = typeColors[props.type] || typeColors.default;
  const bgColor = props.color || colors.bg;

  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 40,
    backgroundColor: bgColor,
    borderRadius: 0,
    opacity: props.disabled ? 0.5 : 1,
    paddingLeft: 8,
    paddingRight: 8,
  };
});

const textStyle = computed(() => {
  const colors = typeColors[props.type] || typeColors.default;
  return {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: props.color ? '#fff' : colors.text,
  };
});

const iconColor = computed(() => {
  const colors = typeColors[props.type] || typeColors.default;
  return props.color ? '#fff' : colors.text;
});
</script>

<template>
  <view :style="buttonStyle" @tap="onTap">
    <Loading
      v-if="loading"
      :size="16"
      :color="iconColor"
    />
    <template v-else>
      <Icon
        v-if="icon"
        :name="icon"
        :size="16"
        :color="iconColor"
      />
      <text :style="textStyle">
        <slot>{{ text }}</slot>
      </text>
    </template>
  </view>
</template>
