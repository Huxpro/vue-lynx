<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar/index.vue';
import SidebarItem from '../components/SidebarItem/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const active1 = ref(0);
const active2 = ref(0);
const active3 = ref(0);

function onChange(index: number) {
  // handle sidebar change
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Sidebar</text>
    </view>

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
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', height: 200 }">
        <Sidebar v-model="active3">
          <SidebarItem title="Tab 1" :index="0" />
          <SidebarItem title="Tab 2" :index="1" disabled />
          <SidebarItem title="Tab 3" :index="2" />
        </Sidebar>
        <view :style="{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ active3 + 1 }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
