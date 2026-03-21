<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Grid</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage (4 Columns)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid>
          <GridItem text="Text 1" />
          <GridItem text="Text 2" />
          <GridItem text="Text 3" />
          <GridItem text="Text 4" />
          <GridItem text="Text 5" />
          <GridItem text="Text 6" />
          <GridItem text="Text 7" />
          <GridItem text="Text 8" />
        </Grid>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">3 Columns</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :column-num="3">
          <GridItem text="Item 1" />
          <GridItem text="Item 2" />
          <GridItem text="Item 3" />
          <GridItem text="Item 4" />
          <GridItem text="Item 5" />
          <GridItem text="Item 6" />
        </Grid>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Square Grid</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Grid :column-num="4" square>
          <GridItem text="Square 1" />
          <GridItem text="Square 2" />
          <GridItem text="Square 3" />
          <GridItem text="Square 4" />
        </Grid>
      </view>
    </view>
  </view>
</template>
