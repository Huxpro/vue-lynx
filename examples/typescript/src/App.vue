<script setup lang="ts">
/**
 * Root component demonstrating TypeScript integration patterns:
 *
 * 1. Imported interfaces & union types (User, Theme)
 * 2. Type-safe provide/inject (theme injection)
 * 3. Generic component usage (GenericList<User>)
 * 4. defineProps<T>() with withDefaults (UserCard)
 * 5. Typed reactive state & computed
 * 6. `as const satisfies` for type-safe config objects
 */
import { ref, computed, provide } from 'vue'
import type { User, Theme } from './types.js'
import { themes } from './types.js'
import GenericList from './GenericList.vue'
import UserCard from './UserCard.vue'

// -- Typed reactive state --
const isDark = ref(false)

const theme = computed<Theme>(() =>
  isDark.value ? themes.dark : themes.light,
)

// provide() is type-safe: inject<Theme>('theme') in descendants
provide<Theme>('theme', theme.value)

const users = ref<User[]>([
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'editor' },
  { id: 3, name: 'Carol', email: 'carol@example.com', role: 'viewer' },
])

const selectedUser = ref<User | null>(null)

// -- Generic component callback is fully typed --
// `user` is inferred as User because GenericList<User> narrows T.
function onSelectUser(user: User) {
  selectedUser.value = user
}

function onRemoveUser(userId: number) {
  users.value = users.value.filter(u => u.id !== userId)
  if (selectedUser.value?.id === userId) {
    selectedUser.value = null
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <view
    :style="{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.background,
      padding: 16,
    }"
  >
    <text :style="{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }">
      TypeScript Patterns
    </text>

    <!-- Theme toggle -->
    <view
      :style="{
        padding: '8px 16px',
        backgroundColor: theme.primary,
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: 'flex-start',
      }"
      @tap="toggleTheme"
    >
      <text :style="{ color: '#fff', fontSize: 14 }">
        {{ isDark ? 'Light mode' : 'Dark mode' }}
      </text>
    </view>

    <!-- Generic component: T is inferred as User from :items -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 8 }">
      User List (Generic Component)
    </text>
    <GenericList
      :items="users"
      :label="(u) => `${u.name} (${u.role})`"
      @select="onSelectUser"
    />

    <!-- Selected user detail with typed props -->
    <view v-if="selectedUser" :style="{ marginTop: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 8 }">
        Selected User
      </text>
      <UserCard
        :user="selectedUser"
        :theme="theme"
        @remove="onRemoveUser"
      />
    </view>

    <text
      v-else
      :style="{ marginTop: 16, fontSize: 13, color: theme.text, opacity: 0.5 }"
    >
      Tap a user above to see details
    </text>
  </view>
</template>
