<script setup lang="ts">
/**
 * Demonstrates:
 * - Importing an interface from a shared types file
 * - defineProps<T>() with an imported interface
 * - withDefaults() for default values on type-only props
 * - defineEmits<T>() with a typed payload
 * - Typed computed properties
 */
import { computed } from 'vue'
import type { User, Theme } from './types.js'

const props = withDefaults(
  defineProps<{
    user: User;
    theme?: Theme;
    showEmail?: boolean;
  }>(),
  {
    showEmail: true,
  },
)

const emit = defineEmits<{
  remove: [userId: number];
}>()

const roleBadgeColor = computed<string>(() => {
  const colors: Record<User['role'], string> = {
    admin: '#e74c3c',
    editor: '#f39c12',
    viewer: '#2ecc71',
  }
  return colors[props.user.role]
})

const bg = computed(() => props.theme?.background ?? '#fff')
const fg = computed(() => props.theme?.text ?? '#333')
</script>

<template>
  <view
    :style="{
      display: 'flex',
      flexDirection: 'column',
      padding: 12,
      backgroundColor: bg,
      borderRadius: 8,
      marginBottom: 8,
    }"
  >
    <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }">
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: fg }">
        {{ props.user.name }}
      </text>
      <view
        :style="{
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 2,
          paddingBottom: 2,
          backgroundColor: roleBadgeColor,
          borderRadius: 10,
        }"
      >
        <text :style="{ fontSize: 11, color: '#fff' }">{{ props.user.role }}</text>
      </view>
    </view>

    <text
      v-if="props.showEmail"
      :style="{ fontSize: 12, color: fg, marginTop: 4, opacity: 0.7 }"
    >
      {{ props.user.email }}
    </text>

    <view
      :style="{
        marginTop: 8,
        padding: '4px 10px',
        backgroundColor: '#ff4444',
        borderRadius: 4,
        alignSelf: 'flex-start',
      }"
      @tap="emit('remove', props.user.id)"
    >
      <text :style="{ fontSize: 12, color: '#fff' }">Remove</text>
    </view>
  </view>
</template>
