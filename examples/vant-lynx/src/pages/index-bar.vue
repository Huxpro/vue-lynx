<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import IndexBar from '../components/IndexBar/index.vue';
import IndexAnchor from '../components/IndexAnchor/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const indexList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const selectedIndex = ref('');

function onSelect(index: string | number) {
  selectedIndex.value = String(index);
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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">IndexBar</text>
    </view>

    <view v-if="selectedIndex" :style="{ padding: 8, paddingLeft: 16, backgroundColor: '#e8f4ff' }">
      <text :style="{ fontSize: 12, color: '#1989fa' }">Selected: {{ selectedIndex }}</text>
    </view>

    <!-- Index Bar with content -->
    <view :style="{ flex: 1, display: 'flex', flexDirection: 'column' }">
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
  </view>
</template>
