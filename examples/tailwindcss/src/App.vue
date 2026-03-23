<script setup lang="ts">
import { ref, computed } from 'vue-lynx'

import './App.css'

// --- Theme switching via CSS class selectors ---
type ThemeName = 'dark' | 'light' | 'ocean'
const themeNames: ThemeName[] = ['dark', 'light', 'ocean']

const currentTheme = ref<ThemeName>('dark')

// dark is the :root default, so no class needed; light/ocean use .theme-* class
// Workaround: Always use explicit theme class to avoid empty string issue with __SetClasses
const themeClass = computed(() => `theme-${currentTheme.value}`)

function setTheme(name: ThemeName) {
  currentTheme.value = name
}

// --- Profile state ---
const name = ref('Hux')
const email = ref('hux@example.com')
const plan = ref<'free' | 'pro'>('pro')

// --- Settings state ---
const pushEnabled = ref(true)
const emailEnabled = ref(false)

function togglePush() {
  pushEnabled.value = !pushEnabled.value
}

function toggleEmail() {
  emailEnabled.value = !emailEnabled.value
}

function upgradePlan() {
  plan.value = plan.value === 'free' ? 'pro' : 'free'
}

const planBadgeClass = computed(() =>
  plan.value === 'pro'
    ? 'bg-primary text-primary-foreground'
    : 'bg-secondary text-secondary-foreground',
)
</script>

<template>
  <scroll-view
    :class="['w-full h-full bg-background', themeClass]"
    scroll-orientation="vertical"
  >
    <view class="p-6 flex flex-col gap-6">
      <!-- Header -->
      <view class="flex flex-col gap-1">
        <text class="text-foreground text-2xl font-bold">Settings</text>
        <text class="text-muted-foreground text-sm">
          Manage your account and preferences.
        </text>
      </view>

      <!-- Card: Theme Switcher -->
      <view class="bg-card rounded-lg border border-border flex flex-col">
        <view class="p-4 pb-0 flex flex-col gap-1">
          <text class="text-card-foreground text-lg font-semibold">Theme</text>
          <text class="text-muted-foreground text-sm">
            Switch design tokens at runtime via CSS variables.
          </text>
        </view>

        <view class="p-4 flex flex-row gap-2">
          <view
            v-for="t in themeNames"
            :key="t"
            :class="[
              'flex-1 rounded-md py-2 items-center justify-center border',
              currentTheme === t
                ? 'bg-primary border-primary'
                : 'bg-secondary border-border',
            ]"
            @tap="setTheme(t)"
          >
            <text
              :class="[
                'text-sm font-medium',
                currentTheme === t
                  ? 'text-primary-foreground'
                  : 'text-secondary-foreground',
              ]"
            >
              {{ t[0].toUpperCase() + t.slice(1) }}
            </text>
          </view>
        </view>
      </view>

      <!-- Card: Profile -->
      <view class="bg-card rounded-lg border border-border flex flex-col">
        <view class="p-4 pb-0 flex flex-col gap-1">
          <text class="text-card-foreground text-lg font-semibold">Profile</text>
          <text class="text-muted-foreground text-sm">
            Your public profile information.
          </text>
        </view>

        <view class="p-4 flex flex-col gap-4">
          <!-- Avatar + Name row -->
          <view class="flex flex-row items-center gap-3">
            <view class="w-10 h-10 rounded-full bg-primary items-center justify-center">
              <text class="text-primary-foreground text-lg font-semibold">H</text>
            </view>
            <view class="flex flex-col">
              <text class="text-card-foreground text-base font-medium">
                {{ name }}
              </text>
              <text class="text-muted-foreground text-sm">{{ email }}</text>
            </view>
            <view class="ml-auto">
              <view :class="['rounded-full px-2.5 py-0.5', planBadgeClass]">
                <text class="text-xs font-medium">{{ plan.toUpperCase() }}</text>
              </view>
            </view>
          </view>

          <view class="h-px bg-border" />

          <!-- Input: Name -->
          <view class="flex flex-col gap-1.5">
            <text class="text-card-foreground text-sm font-medium">Display Name</text>
            <view class="bg-secondary rounded-md border border-border px-3 py-2">
              <text class="text-secondary-foreground text-sm">{{ name }}</text>
            </view>
          </view>

          <!-- Input: Email -->
          <view class="flex flex-col gap-1.5">
            <text class="text-card-foreground text-sm font-medium">Email</text>
            <view class="bg-secondary rounded-md border border-border px-3 py-2">
              <text class="text-secondary-foreground text-sm">{{ email }}</text>
            </view>
          </view>
        </view>

        <view class="p-4 pt-0 flex flex-row gap-2">
          <view
            class="bg-primary rounded-md py-2 px-4 items-center justify-center"
            @tap="upgradePlan"
          >
            <text class="text-primary-foreground text-sm font-medium">
              {{ plan === 'pro' ? 'Downgrade' : 'Upgrade to Pro' }}
            </text>
          </view>
        </view>
      </view>

      <!-- Card: Notifications -->
      <view class="bg-card rounded-lg border border-border flex flex-col">
        <view class="p-4 pb-0 flex flex-col gap-1">
          <text class="text-card-foreground text-lg font-semibold">
            Notifications
          </text>
          <text class="text-muted-foreground text-sm">
            Choose how you want to be notified.
          </text>
        </view>

        <view class="p-4 flex flex-col gap-3">
          <!-- Switch row: Push -->
          <view class="flex flex-row items-center justify-between" @tap="togglePush">
            <view class="flex flex-col">
              <text class="text-card-foreground text-sm font-medium">
                Push Notifications
              </text>
              <text class="text-muted-foreground text-xs">
                Receive push notifications on your device.
              </text>
            </view>
            <view
              :class="[
                'w-10 h-6 rounded-full p-0.5',
                pushEnabled ? 'bg-primary' : 'bg-secondary',
              ]"
            >
              <view
                :class="[
                  'w-5 h-5 rounded-full bg-white',
                  pushEnabled ? 'ml-4' : 'ml-0',
                ]"
              />
            </view>
          </view>

          <view class="h-px bg-border" />

          <!-- Switch row: Email -->
          <view class="flex flex-row items-center justify-between" @tap="toggleEmail">
            <view class="flex flex-col">
              <text class="text-card-foreground text-sm font-medium">
                Email Notifications
              </text>
              <text class="text-muted-foreground text-xs">
                Receive email digests and updates.
              </text>
            </view>
            <view
              :class="[
                'w-10 h-6 rounded-full p-0.5',
                emailEnabled ? 'bg-primary' : 'bg-secondary',
              ]"
            >
              <view
                :class="[
                  'w-5 h-5 rounded-full bg-white',
                  emailEnabled ? 'ml-4' : 'ml-0',
                ]"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- Card: Danger Zone -->
      <view class="bg-card rounded-lg border border-destructive flex flex-col">
        <view class="p-4 pb-0 flex flex-col gap-1">
          <text class="text-destructive text-lg font-semibold">Danger Zone</text>
          <text class="text-muted-foreground text-sm">
            Irreversible and destructive actions.
          </text>
        </view>

        <view class="p-4 flex flex-row gap-2">
          <view
            class="bg-destructive rounded-md py-2 px-4 items-center justify-center"
          >
            <text class="text-destructive-foreground text-sm font-medium">
              Delete Account
            </text>
          </view>
          <view
            class="bg-secondary rounded-md py-2 px-4 items-center justify-center border border-border"
          >
            <text class="text-secondary-foreground text-sm font-medium">
              Cancel
            </text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>
