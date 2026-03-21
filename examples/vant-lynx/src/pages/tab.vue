<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Tabs from '../components/Tabs/index.vue';
import Tab from '../components/Tab/index.vue';
const active1 = ref(0);
const active2 = ref('a');
const active3 = ref(0);
const active4 = ref(0);
const active5 = ref(0);
</script>

<template>
  <DemoPage title="Tabs">

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active1">
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
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active2" type="card">
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

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active3" color="#ee0a24" titleActiveColor="#ee0a24">
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Tab</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active4">
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2" disabled>
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dot & Badge</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active5">
          <Tab :name="0" title="Tab 1" dot>
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 1 (with dot)</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2" :badge="5">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 2 (badge: 5)</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3" badge="99+">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 3 (badge: 99+)</text>
            </view>
          </Tab>
        </Tabs>
      </view>
    </view>
  </DemoPage>
</template>
