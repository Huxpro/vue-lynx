<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  to: string;
  label: string;
}>();
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ navigate, isActive }">
    <view
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <text
        @tap="navigate"
        :style="{
          color: '#fff',
          fontSize: '15px',
          fontWeight: isActive ? '600' : '300',
          letterSpacing: '0.075em',
          lineHeight: '24px',
          marginRight: '1em',
          whiteSpace: 'nowrap',
        }"
      >
        {{ label }}
      </text>
    </view>
  </RouterLink>
</template>
