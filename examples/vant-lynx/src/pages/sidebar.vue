<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sidebar from '../components/Sidebar/index.vue';
import SidebarItem from '../components/SidebarItem/index.vue';
const active1 = ref(0);
const active2 = ref(0);
const active3 = ref(0);
const active4 = ref(0);
const changeResult = ref('');

function onChange(index: number) {
  // handle sidebar change
}

function onChangeEvent(index: number) {
  changeResult.value = `Changed to tab ${index + 1}`;
}
</script>

<template>
  <DemoPage title="Sidebar">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', height: 200 }">
        <Sidebar v-model="active1" @change="onChange">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ active1 + 1 }}</text>
        </view>
      </view>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Badge</text>
      <view :style="{ marginBottom: 16, display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', height: 200 }">
        <Sidebar v-model="active2">
          <SidebarItem title="Tab 1" :index="0" dot />
          <SidebarItem title="Tab 2" :index="1" :badge="5" />
          <SidebarItem title="Tab 3" :index="2" :badge="20" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ active2 + 1 }}</text>
        </view>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', height: 200 }">
        <Sidebar v-model="active3">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" disabled />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ active3 + 1 }}</text>
        </view>
      </view>

      <!-- Change Event -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Change Event</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', height: 200 }">
        <Sidebar v-model="active4" @change="onChangeEvent">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ active4 + 1 }}</text>
          <text v-if="changeResult" :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">{{ changeResult }}</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
