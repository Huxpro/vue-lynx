<script setup lang="ts">
import { ref } from 'vue-lynx';
import Card from './Card.vue';
import DataList from './DataList.vue';

const items = ref([
  { id: 1, name: 'Vue', description: 'Progressive JS framework' },
  { id: 2, name: 'Lynx', description: 'Cross-platform UI engine' },
]);
</script>

<template>
  <scroll-view
    :style="{
      flex: 1,
      backgroundColor: '#f5f5f5',
    }"
    scroll-orientation="vertical"
  >
  <view
    :style="{
      display: 'flex',
      flexDirection: 'column',
      padding: 16,
    }"
  >
    <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 }">
      Slots (default + named + scoped)
    </text>

    <!-- ① Default slot -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 4 }">
      1. Default slot
    </text>
    <Card>
      <text :style="{ fontSize: 13, color: '#333' }">
        This content is passed via the default slot.
      </text>
    </Card>

    <!-- ② Named slots -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 12, marginBottom: 4 }">
      2. Named slots (header + footer)
    </text>
    <Card>
      <template #header>
        <text :style="{ fontSize: 15, fontWeight: 'bold', color: '#0077ff' }">
          Custom Header
        </text>
      </template>
      <text :style="{ fontSize: 13, color: '#333' }">
        Body content between named header and footer.
      </text>
      <template #footer>
        <text :style="{ fontSize: 11, color: '#999' }">
          Custom Footer · via #footer slot
        </text>
      </template>
    </Card>

    <!-- ③ Scoped slot -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 12, marginBottom: 4 }">
      3. Scoped slot
    </text>
    <DataList :items="items">
      <template #item="{ item, index }">
        <view
          :style="{
            display: 'flex',
            flexDirection: 'row',
            padding: 8,
            backgroundColor: index % 2 === 0 ? '#fff' : '#f0f0f0',
            borderRadius: 4,
            marginBottom: 4,
          }"
        >
          <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#222', marginRight: 8 }">
            {{ item.name }}
          </text>
          <text :style="{ fontSize: 13, color: '#666' }">
            {{ item.description }}
          </text>
        </view>
      </template>
    </DataList>
  </view>
  </scroll-view>
</template>
