<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import IndexBar from '../components/IndexBar/index.vue';
import IndexAnchor from '../components/IndexAnchor/index.vue';
import Cell from '../components/Cell/index.vue';
</script>

<template>
  <DemoPage title="IndexAnchor">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Basic Usage</text>
      <view :style="{ height: 400 }">
        <IndexBar :index-list="['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']">
          <IndexAnchor index="A" />
          <Cell title="Alice" />
          <Cell title="Amy" />
          <Cell title="Andrew" />

          <IndexAnchor index="B" />
          <Cell title="Bob" />
          <Cell title="Brian" />

          <IndexAnchor index="C" />
          <Cell title="Carol" />
          <Cell title="Charlie" />
          <Cell title="Chris" />

          <IndexAnchor index="D" />
          <Cell title="David" />
          <Cell title="Diana" />

          <IndexAnchor index="E" />
          <Cell title="Emily" />
          <Cell title="Eric" />

          <IndexAnchor index="F" />
          <Cell title="Frank" />
          <Cell title="Fiona" />

          <IndexAnchor index="G" />
          <Cell title="George" />
          <Cell title="Grace" />

          <IndexAnchor index="H" />
          <Cell title="Harry" />
          <Cell title="Helen" />
        </IndexBar>
      </view>

      <!-- Custom Highlight Color -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Custom Highlight Color</text>
      <view :style="{ height: 300 }">
        <IndexBar :index-list="['A', 'B', 'C']" highlight-color="#ee0a24">
          <IndexAnchor index="A" />
          <Cell title="Alice" />
          <Cell title="Amy" />

          <IndexAnchor index="B" />
          <Cell title="Bob" />
          <Cell title="Brian" />

          <IndexAnchor index="C" />
          <Cell title="Carol" />
          <Cell title="Charlie" />
        </IndexBar>
      </view>

      <!-- Custom Anchor Content -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Custom Anchor Content</text>
      <view :style="{ height: 250 }">
        <IndexBar :index-list="['1', '2', '3']">
          <IndexAnchor index="1">
            <text :style="{ fontSize: 16, color: '#1989fa', fontWeight: 'bold' }">Section 1 (Custom)</text>
          </IndexAnchor>
          <Cell title="Item 1-1" />
          <Cell title="Item 1-2" />

          <IndexAnchor index="2">
            <text :style="{ fontSize: 16, color: '#ee0a24', fontWeight: 'bold' }">Section 2 (Custom)</text>
          </IndexAnchor>
          <Cell title="Item 2-1" />
          <Cell title="Item 2-2" />

          <IndexAnchor index="3">
            <text :style="{ fontSize: 16, color: '#07c160', fontWeight: 'bold' }">Section 3 (Custom)</text>
          </IndexAnchor>
          <Cell title="Item 3-1" />
          <Cell title="Item 3-2" />
        </IndexBar>
      </view>
    </view>
  </DemoPage>
</template>
