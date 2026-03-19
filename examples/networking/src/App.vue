<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// WORKAROUND: lynx-stack web-platform's RuntimeWrapperWebpackPlugin shadows
// `fetch` with an `undefined` parameter. Use `globalThis.fetch` to bypass.
// TODO: Remove once lynx-stack shims `fetch` on the `lynx` global.
const _fetch: typeof fetch = globalThis.fetch ?? fetch

// --- Types ---

interface User {
  id: number
  name: string
  email: string
  company: { name: string }
}

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

// --- State ---

const search = ref('')
const selectedUserId = ref<number | null>(null)
const queryClient = useQueryClient()

// --- Queries ---

// 1. Fetch all users
const {
  data: users,
  isLoading: usersLoading,
  isError: usersError,
} = useQuery({
  queryKey: ['users'],
  queryFn: async (): Promise<User[]> => {
    const res = await _fetch('https://jsonplaceholder.typicode.com/users')
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  },
})

// 2. Reactive filtered list — driven by `search` ref
const filteredUsers = computed(() => {
  if (!users.value) return []
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.company.name.toLowerCase().includes(q),
  )
})

// 3. Dependent query — only runs when a user is selected.
//    The queryKey is a reactive array: when `selectedUserId` changes,
//    Vue Query automatically refetches.
const {
  data: posts,
  isLoading: postsLoading,
  isError: postsError,
} = useQuery({
  queryKey: computed(() => ['users', selectedUserId.value, 'posts']),
  queryFn: async (): Promise<Post[]> => {
    const res = await _fetch(
      `https://jsonplaceholder.typicode.com/users/${selectedUserId.value}/posts`,
    )
    if (!res.ok) throw new Error('Failed to fetch posts')
    return res.json()
  },
  enabled: computed(() => selectedUserId.value !== null),
})

// 4. Mutation — optimistic delete with rollback
const deleteMutation = useMutation({
  mutationFn: async (postId: number) => {
    const res = await _fetch(
      `https://jsonplaceholder.typicode.com/posts/${postId}`,
      { method: 'DELETE' },
    )
    if (!res.ok) throw new Error('Failed to delete post')
    return postId
  },
  onMutate: async (postId) => {
    const key = ['users', selectedUserId.value, 'posts']
    await queryClient.cancelQueries({ queryKey: key })
    const previous = queryClient.getQueryData<Post[]>(key)
    queryClient.setQueryData(key, (old: Post[] | undefined) =>
      old ? old.filter((p) => p.id !== postId) : [],
    )
    return { previous, key }
  },
  onError: (_err, _postId, context) => {
    if (context?.previous) {
      queryClient.setQueryData(context.key, context.previous)
    }
  },
})

// --- Actions ---

function selectUser(id: number) {
  selectedUserId.value = id
}

function goBack() {
  selectedUserId.value = null
}

function deletePost(postId: number) {
  deleteMutation.mutate(postId)
}
</script>

<template>
  <scroll-view :style="styles.root" scroll-orientation="vertical">
    <view :style="styles.container">
      <text :style="styles.title">Vue Query × Lynx</text>

      <!-- User List View -->
      <template v-if="selectedUserId === null">
        <input
          :style="styles.searchInput"
          :value="search"
          placeholder="Search users..."
          @input="(e: InputEvent) => (search = (e as any).detail.value ?? '')"
        />

        <text v-if="usersLoading" :style="styles.hint">Loading users...</text>
        <text v-else-if="usersError" :style="styles.error">Failed to load users</text>

        <template v-else>
          <view
            v-for="user in filteredUsers"
            :key="user.id"
            :style="styles.userCard"
            @tap="selectUser(user.id)"
          >
            <text :style="styles.userName">{{ user.name }}</text>
            <text :style="styles.userMeta">{{ user.company.name }} · {{ user.email }}</text>
          </view>
          <text v-if="filteredUsers.length === 0" :style="styles.hint">No matches</text>
        </template>
      </template>

      <!-- Posts Detail View -->
      <template v-else>
        <view :style="styles.backRow" @tap="goBack">
          <text :style="styles.backText">← Back</text>
        </view>

        <text v-if="postsLoading" :style="styles.hint">Loading posts...</text>
        <text v-else-if="postsError" :style="styles.error">Failed to load posts</text>

        <template v-else>
          <view v-for="post in posts" :key="post.id" :style="styles.postCard">
            <view :style="styles.postHeader">
              <text :style="styles.postTitle">{{ post.title }}</text>
              <text :style="styles.deleteBtn" @tap="deletePost(post.id)">✕</text>
            </view>
            <text :style="styles.postBody">{{ post.body }}</text>
          </view>
        </template>
      </template>
    </view>
  </scroll-view>
</template>

<script lang="ts">
const styles = {
  root: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  container: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#111',
  },
  searchInput: {
    height: '36px',
    fontSize: '14px',
    padding: '0 12px',
    marginBottom: '12px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    borderWidth: '1px',
    borderColor: '#ddd',
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '20px',
    textAlign: 'center' as const,
  },
  error: {
    fontSize: '14px',
    color: '#e53e3e',
    marginTop: '20px',
    textAlign: 'center' as const,
  },
  // User card
  userCard: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#fff',
    borderRadius: '8px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#222',
  },
  userMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  // Back button
  backRow: {
    marginBottom: '12px',
  },
  backText: {
    fontSize: '15px',
    color: '#4c8caf',
    fontWeight: 'bold',
  },
  // Post card
  postCard: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#fff',
    borderRadius: '8px',
  },
  postHeader: {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  postTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  deleteBtn: {
    fontSize: '16px',
    color: '#e53e3e',
    marginLeft: '8px',
    padding: '0 4px',
  },
  postBody: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    lineHeight: '18px',
  },
}
</script>
