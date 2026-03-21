<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const active1 = ref(0);
const active2 = ref('a');
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Tabs</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model="active1">
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab 3</text>
            </view>
          </Tab>
          <Tab :name="3" title="Tab 4">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab 4</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Card Style</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model="active2" type="card">
          <Tab name="a" title="Tab A">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab A</text>
            </view>
          </Tab>
          <Tab name="b" title="Tab B">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab B</text>
            </view>
          </Tab>
          <Tab name="c" title="Tab C">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab C</text>
            </view>
          </Tab>
        </Tabs>
      </view>
    </view>
  </view>
</template>
