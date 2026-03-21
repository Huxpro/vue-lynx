<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sidebar from '../components/Sidebar/index.vue';
import SidebarItem from '../components/SidebarItem/index.vue';

const basicActive = ref(0);
const badgeActive = ref(0);
const disabledActive = ref(0);
</script>

<template>
  <DemoPage title="SidebarItem">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24, display: 'flex', flexDirection: 'row' }">
        <Sidebar v-model="basicActive">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, backgroundColor: '#fff' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content for tab {{ basicActive + 1 }}</text>
        </view>
      </view>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Badge</text>
      <view :style="{ marginBottom: 24, display: 'flex', flexDirection: 'row' }">
        <Sidebar v-model="badgeActive">
          <SidebarItem title="Tab 1" :index="0" :dot="true" />
          <SidebarItem title="Tab 2" :index="1" badge="5" />
          <SidebarItem title="Tab 3" :index="2" badge="20" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, backgroundColor: '#fff' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content for tab {{ badgeActive + 1 }}</text>
        </view>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 24, display: 'flex', flexDirection: 'row' }">
        <Sidebar v-model="disabledActive">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" :disabled="true" />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, backgroundColor: '#fff' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content for tab {{ disabledActive + 1 }}</text>
        </view>
      </view>

      <!-- Custom Title Slot -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Title</text>
      <view :style="{ marginBottom: 24, display: 'flex', flexDirection: 'row' }">
        <Sidebar :model-value="0">
          <SidebarItem :index="0">
            <template #title>
              <text :style="{ fontSize: 14, color: '#ee0a24', fontWeight: 'bold' }">Custom</text>
            </template>
          </SidebarItem>
          <SidebarItem title="Normal" :index="1" />
          <SidebarItem title="Normal" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, backgroundColor: '#fff' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content area</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
