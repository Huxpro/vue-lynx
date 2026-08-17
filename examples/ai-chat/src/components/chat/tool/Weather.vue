<script setup lang="ts">
import { computed } from 'vue-lynx';

import type { ToolUIPart } from '../../../types/ai';
import Icon from '../../ui/Icon.vue';

/**
 * Port of app/components/chat/tool/Weather.vue — same layout and gradient;
 * tailwind gradient stop utilities aren't in the Lynx preset so the
 * gradient is a plain CSS class.
 */
const props = defineProps<{
  invocation: ToolUIPart;
}>();

interface WeatherOutput {
  location: string;
  temperature: number;
  temperatureHigh: number;
  temperatureLow: number;
  condition: { text: string; icon: string };
  humidity: number;
  windSpeed: number;
  dailyForecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: { text: string; icon: string };
  }>;
}

const output = computed(() => props.invocation.output as unknown as WeatherOutput);

const icon = computed(() => {
  return (
    {
      'input-available': 'i-lucide-cloud-sun',
      'output-error': 'i-lucide-triangle-alert',
    }[props.invocation.state as string] || 'i-lucide-loader-circle'
  );
});

const message = computed(() => {
  return (
    {
      'input-available': 'Loading weather data...',
      'output-error': "Can't get weather data, please try again later",
    }[props.invocation.state as string] || 'Loading weather data...'
  );
});
</script>

<template>
  <view
    class="rounded-xl px-5 py-4 my-2"
    :class="invocation.state === 'output-error' ? 'bg-muted' : 'weather-gradient'"
  >
    <template v-if="invocation.state === 'output-available'">
      <view class="flex flex-row items-start justify-between mb-3">
        <view class="flex flex-row items-end">
          <text class="weather-temp">{{ output.temperature }}°</text>
          <text class="text-base weather-dim pb-1.5">C</text>
        </view>
        <view class="flex flex-col items-end">
          <text class="text-base font-medium text-white mb-1">{{ output.location }}</text>
          <text class="text-xs weather-dim">
            H:{{ output.temperatureHigh }}° L:{{ output.temperatureLow }}°
          </text>
        </view>
      </view>

      <view class="flex flex-row items-center justify-between mb-4">
        <view class="flex flex-row items-center gap-2">
          <Icon :name="output.condition.icon" tone="white" :size="24" />
          <text class="text-sm font-medium text-white">{{ output.condition.text }}</text>
        </view>

        <view class="flex flex-row gap-3">
          <view class="flex flex-row items-center gap-1">
            <Icon name="i-lucide-droplets" tone="#bfdbfe" :size="12" />
            <text class="text-xs text-white">{{ output.humidity }}%</text>
          </view>
          <view class="flex flex-row items-center gap-1">
            <Icon name="i-lucide-wind" tone="#bfdbfe" :size="12" />
            <text class="text-xs text-white">{{ output.windSpeed }} km/h</text>
          </view>
        </view>
      </view>

      <view
        v-if="output.dailyForecast.length > 0"
        class="flex flex-row items-center justify-between"
      >
        <view
          v-for="(forecast, index) in output.dailyForecast"
          :key="index"
          class="flex flex-col items-center gap-1.5"
        >
          <text class="text-xs weather-dim font-medium">{{ forecast.day }}</text>
          <Icon :name="forecast.condition.icon" tone="white" :size="20" />
          <view class="flex flex-col items-center">
            <text class="text-xs font-medium text-white">{{ forecast.high }}°</text>
            <text class="text-xs weather-dimmer">{{ forecast.low }}°</text>
          </view>
        </view>
      </view>

      <view v-else class="flex flex-row items-center justify-center py-3">
        <text class="text-xs text-white">No forecast available</text>
      </view>
    </template>

    <view v-else class="flex flex-col items-center justify-center weather-loading">
      <Icon
        :name="icon"
        :tone="invocation.state === 'output-error' ? 'error' : 'white'"
        :size="32"
        :class="invocation.state === 'input-streaming' ? 'spin' : ''"
      />
      <text
        class="text-sm mt-2"
        :class="invocation.state === 'output-error' ? 'text-error' : 'text-white'"
      >
        {{ message }}
      </text>
    </view>
  </view>
</template>

<style>
.weather-gradient {
  background: linear-gradient(135deg, #38bdf8, #3b82f6, #4f46e5);
}
.theme-dark .weather-gradient {
  background: linear-gradient(135deg, #0ea5e9, #2563eb, #4338ca);
}
.weather-temp {
  font-size: 40px;
  line-height: 44px;
  font-weight: 700;
  color: #ffffff;
}
.weather-dim {
  color: rgba(255, 255, 255, 0.8);
}
.weather-dimmer {
  color: rgba(255, 255, 255, 0.6);
}
.weather-loading {
  height: 176px;
}
</style>
