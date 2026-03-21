<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import IndexBar from '../components/IndexBar/index.vue';
import IndexAnchor from '../components/IndexAnchor/index.vue';
const indexList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const selectedIndex = ref('');
const customSelectedIndex = ref('');

function onSelect(index: string | number) {
  selectedIndex.value = String(index);
}

function onCustomSelect(index: string | number) {
  customSelectedIndex.value = String(index);
}

const itemsByLetter: Record<string, string[]> = {
  A: ['Apple', 'Apricot', 'Avocado'],
  B: ['Banana', 'Blueberry', 'Blackberry'],
  C: ['Cherry', 'Coconut', 'Cranberry'],
  D: ['Date', 'Dragonfruit', 'Durian'],
  E: ['Elderberry', 'Etrog'],
  F: ['Fig', 'Feijoa'],
  G: ['Grape', 'Guava', 'Grapefruit'],
  H: ['Honeydew', 'Huckleberry'],
};
</script>

<template>
  <DemoPage title="IndexBar">
    <!-- Basic Usage -->
    <text :style="{ fontSize: 14, color: '#969799', padding: 16, paddingBottom: 8 }">Basic Usage</text>
    <view v-if="selectedIndex" :style="{ padding: 8, paddingLeft: 16, backgroundColor: '#e8f4ff' }">
      <text :style="{ fontSize: 12, color: '#1989fa' }">Selected: {{ selectedIndex }}</text>
    </view>
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <IndexBar :index-list="indexList" @select="onSelect">
        <template v-for="letter in indexList" :key="letter">
          <IndexAnchor :index="letter">
            <view
              v-for="item in itemsByLetter[letter]"
              :key="item"
              :style="{ padding: 12, paddingLeft: 16, borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0', backgroundColor: '#fff' }"
            >
              <text :style="{ fontSize: 14, color: '#323233' }">{{ item }}</text>
            </view>
          </IndexAnchor>
        </template>
      </IndexBar>
    </view>

    <!-- Custom Index List -->
    <text :style="{ fontSize: 14, color: '#969799', padding: 16, paddingBottom: 8 }">Custom Index List</text>
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <IndexBar :index-list="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]">
        <IndexAnchor :index="1">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Item 1</text>
          </view>
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Item 2</text>
          </view>
        </IndexAnchor>
        <IndexAnchor :index="2">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Item 3</text>
          </view>
        </IndexAnchor>
        <IndexAnchor :index="3">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Item 4</text>
          </view>
        </IndexAnchor>
      </IndexBar>
    </view>

    <!-- Custom Highlight Color -->
    <text :style="{ fontSize: 14, color: '#969799', padding: 16, paddingBottom: 8 }">Custom Highlight Color</text>
    <view v-if="customSelectedIndex" :style="{ padding: 8, paddingLeft: 16, backgroundColor: '#fef0f0' }">
      <text :style="{ fontSize: 12, color: '#ee0a24' }">Selected: {{ customSelectedIndex }}</text>
    </view>
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <IndexBar :index-list="['A', 'B', 'C', 'D']" highlight-color="#ee0a24" @select="onCustomSelect">
        <IndexAnchor index="A">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Aaron</text>
          </view>
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Alice</text>
          </view>
        </IndexAnchor>
        <IndexAnchor index="B">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Bob</text>
          </view>
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Bruce</text>
          </view>
        </IndexAnchor>
        <IndexAnchor index="C">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">Carol</text>
          </view>
        </IndexAnchor>
        <IndexAnchor index="D">
          <view :style="{ padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#ebedf0' }">
            <text :style="{ fontSize: 14, color: '#323233' }">David</text>
          </view>
        </IndexAnchor>
      </IndexBar>
    </view>
  </DemoPage>
</template>
