<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';
import List from '../components/List/index.vue';
import Cell from '../components/Cell/index.vue';

const list = ref([
  {
    items: [] as string[],
    loading: false,
    error: false,
    finished: false,
  },
  {
    items: [] as string[],
    loading: false,
    error: false,
    finished: false,
  },
  {
    items: [] as string[],
    loading: false,
    error: false,
    finished: false,
  },
]);

function onLoad(index: number) {
  const currentList = list.value[index];
  currentList.loading = true;

  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      const text = currentList.items.length + 1;
      currentList.items.push(text < 10 ? '0' + text : String(text));
    }

    currentList.loading = false;

    if (index === 1 && currentList.items.length === 10 && !currentList.error) {
      currentList.error = true;
    } else {
      currentList.error = false;
    }

    if (currentList.items.length >= 40) {
      currentList.finished = true;
    }
  }, 1000);
}
</script>

<template>
  <DemoPage title="List 列表">
    <Tabs>
      <Tab title="基础用法">
        <List
          v-model:loading="list[0].loading"
          :finished="list[0].finished"
          finished-text="没有更多了"
          @load="onLoad(0)"
        >
          <Cell v-for="item in list[0].items" :key="item" :title="item" />
        </List>
      </Tab>

      <Tab title="错误提示">
        <List
          v-model:loading="list[1].loading"
          v-model:error="list[1].error"
          :finished="list[1].finished"
          error-text="请求失败，点击重新加载"
          @load="onLoad(1)"
        >
          <Cell v-for="item in list[1].items" :key="item" :title="item" />
        </List>
      </Tab>

      <Tab title="下拉刷新">
        <!--
          Lynx Limitation: PullRefresh component not yet implemented.
          Showing basic list as placeholder.
        -->
        <List
          v-model:loading="list[2].loading"
          :finished="list[2].finished"
          finished-text="没有更多了"
          @load="onLoad(2)"
        >
          <Cell v-for="item in list[2].items" :key="item" :title="item" />
        </List>
      </Tab>
    </Tabs>
  </DemoPage>
</template>
