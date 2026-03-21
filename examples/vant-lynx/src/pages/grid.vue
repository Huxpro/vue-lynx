<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';

function onClickItem(name: string) {
  console.log(`GridItem clicked: ${name}`);
}
</script>

<template>
  <DemoPage title="Grid">

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid>
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Column Number -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Column Number</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :column-num="3">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Icon with Badge -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Badge</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :column-num="2">
          <GridItem icon="photo" text="Text" dot />
          <GridItem icon="photo" text="Text" :badge="3" />
          <GridItem icon="photo" text="Text" badge="99+" />
        </Grid>
      </view>

      <!-- Square Grid -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Square</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid square :column-num="4">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Gutter -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Gutter</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Grid :gutter="10" :column-num="4">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid direction="horizontal" :column-num="3">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Reverse -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Reverse</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid reverse :column-num="3">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Clickable -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Clickable</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid clickable :column-num="3">
          <GridItem icon="photo" text="Item 1" @click="onClickItem('1')" />
          <GridItem icon="photo" text="Item 2" @click="onClickItem('2')" />
          <GridItem icon="photo" text="Item 3" @click="onClickItem('3')" />
        </Grid>
      </view>

      <!-- No Border -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">No Border</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :border="false" :column-num="4">
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
          <GridItem icon="photo" text="Text" />
        </Grid>
      </view>

      <!-- Custom Icon Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Icon Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :column-num="3">
          <GridItem icon="star" text="Red" icon-color="#ee0a24" />
          <GridItem icon="star" text="Blue" icon-color="#1989fa" />
          <GridItem icon="star" text="Green" icon-color="#07c160" />
        </Grid>
      </view>
    </view>
  </DemoPage>
</template>
