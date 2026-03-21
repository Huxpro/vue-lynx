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
const active6 = ref(0);
const clickLog = ref('');

function onClickTab(info: { name: string | number; title: string }) {
  clickLog.value = `Clicked: ${info.title} (name: ${info.name})`;
}
</script>

<template>
  <DemoPage title="Tabs">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
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

      <!-- Match by Name -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Match by Name</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active2">
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

      <!-- Swipeable -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Swipeable</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active6" swipeable>
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Swipe left or right</text>
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

      <!-- Scrollable (many tabs) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Scrollable</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active3">
          <Tab v-for="i in 8" :key="i" :name="i - 1" :title="'Tab ' + i">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content of Tab {{ i }}</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- Card Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Card Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active4" type="card">
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Card Style 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Card Style 2</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Card Style 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- Disabled Tab -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Tab</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs v-model:active="active5">
          <Tab :name="0" title="Tab 1">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 1</text>
            </view>
          </Tab>
          <Tab :name="1" title="Tab 2" disabled>
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 2 (disabled)</text>
            </view>
          </Tab>
          <Tab :name="2" title="Tab 3">
            <view :style="{ padding: 16 }">
              <text :style="{ fontSize: 14, color: '#323233' }">Content 3</text>
            </view>
          </Tab>
        </Tabs>
      </view>

      <!-- Click Event -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Click Event</text>
      <view :style="{ marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Tabs @click-tab="onClickTab">
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
        </Tabs>
      </view>
      <view v-if="clickLog" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ clickLog }}</text>
      </view>
    </view>
  </DemoPage>
</template>
