<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// WORKAROUND: RuntimeWrapperWebpackPlugin passes `fetch` as a function
// parameter which shadows the global. The web-platform background thread
// doesn't provide it, so the parameter is `undefined` even though the
// Web Worker has native `fetch` on `globalThis`.
// See: https://github.com/anthropics/anthropic-cookbook/issues/XXX
// TODO: Remove once lynx-stack web-platform shims `fetch` on `tt`/`lynx`.
const _fetch: typeof fetch = globalThis.fetch ?? fetch

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

const queryClient = useQueryClient()

const fetchPosts = async (): Promise<Post[]> => {
  const response = await _fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  const data = await response.json()
  return data.slice(0, 10)
}

const deletePost = async (postId: number) => {
  const response = await _fetch(
    `https://jsonplaceholder.typicode.com/posts/${postId}`,
    { method: 'DELETE' },
  )
  if (!response.ok) {
    throw new Error('Failed to delete post')
  }
  return postId
}

const { data: posts, isLoading, isError, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

const mutation = useMutation({
  mutationFn: () => deletePost(1),
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: ['posts'] })

    const previousPosts = queryClient.getQueryData<Post[]>(['posts'])

    queryClient.setQueryData(['posts'], (oldPosts: Post[] | undefined) => {
      return oldPosts ? oldPosts.filter((post) => post.id !== 1) : []
    })

    return { previousPosts }
  },
  onError: (_err, _variables, context) => {
    if (context?.previousPosts) {
      queryClient.setQueryData(['posts'], context.previousPosts)
    }
  },
})

function deleteFirstPost() {
  mutation.mutate()
}
</script>

<template>
  <view :style="styles.container">
    <text :style="styles.title">Vue Query × Lynx</text>

    <text v-if="isLoading" :style="styles.loading">Loading...</text>

    <text v-else-if="isError" :style="styles.error">
      {{ error?.message || 'Error fetching posts' }}
    </text>

    <scroll-view v-else :style="styles.list" scroll-orientation="vertical">
      <view v-for="post in posts" :key="post.id" :style="styles.post">
        <text :style="styles.postText">{{ post.id }} : {{ post.title }}</text>
      </view>
    </scroll-view>

    <view :style="styles.button" @tap="deleteFirstPost">
      <text :style="styles.buttonText">Delete Post 1</text>
    </view>
  </view>
</template>

<script lang="ts">
const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    margin: '30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#111',
  },
  loading: {
    fontSize: '20px',
    color: '#666',
  },
  error: {
    fontSize: '16px',
    color: 'red',
  },
  list: {
    flex: 1,
  },
  post: {
    marginBottom: '8px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
  },
  postText: {
    fontSize: '14px',
    color: '#333',
  },
  button: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#4c8caf',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
  },
}
</script>
