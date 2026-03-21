<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Grid from '../components/Grid/index.vue';
import GridItem from '../components/GridItem/index.vue';
</script>

<template>
  <DemoPage title="GridItem">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Basic Usage</text>
      <Grid>
        <GridItem icon="photo-o" text="Item 1" />
        <GridItem icon="photo-o" text="Item 2" />
        <GridItem icon="photo-o" text="Item 3" />
        <GridItem icon="photo-o" text="Item 4" />
      </Grid>

      <!-- With Icon -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Different Icons</text>
      <Grid>
        <GridItem icon="home-o" text="Home" />
        <GridItem icon="search" text="Search" />
        <GridItem icon="friends-o" text="Friends" />
        <GridItem icon="setting-o" text="Settings" />
      </Grid>

      <!-- Column Number -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">3 Columns</text>
      <Grid :column-num="3">
        <GridItem icon="photo-o" text="Item 1" />
        <GridItem icon="photo-o" text="Item 2" />
        <GridItem icon="photo-o" text="Item 3" />
        <GridItem icon="photo-o" text="Item 4" />
        <GridItem icon="photo-o" text="Item 5" />
        <GridItem icon="photo-o" text="Item 6" />
      </Grid>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Custom Content</text>
      <Grid :column-num="3" :border="false">
        <GridItem>
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <text :style="{ fontSize: 24, color: '#ee0a24', marginBottom: 4 }">128</text>
            <text :style="{ fontSize: 12, color: '#969799' }">Following</text>
          </view>
        </GridItem>
        <GridItem>
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <text :style="{ fontSize: 24, color: '#1989fa', marginBottom: 4 }">256</text>
            <text :style="{ fontSize: 12, color: '#969799' }">Followers</text>
          </view>
        </GridItem>
        <GridItem>
          <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <text :style="{ fontSize: 24, color: '#07c160', marginBottom: 4 }">512</text>
            <text :style="{ fontSize: 12, color: '#969799' }">Likes</text>
          </view>
        </GridItem>
      </Grid>

      <!-- Square -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Square</text>
      <Grid square>
        <GridItem icon="photo-o" text="Item 1" />
        <GridItem icon="photo-o" text="Item 2" />
        <GridItem icon="photo-o" text="Item 3" />
        <GridItem icon="photo-o" text="Item 4" />
        <GridItem icon="photo-o" text="Item 5" />
        <GridItem icon="photo-o" text="Item 6" />
        <GridItem icon="photo-o" text="Item 7" />
        <GridItem icon="photo-o" text="Item 8" />
      </Grid>

      <!-- With Gutter -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">With Gutter</text>
      <Grid :gutter="10">
        <GridItem icon="photo-o" text="Item 1" />
        <GridItem icon="photo-o" text="Item 2" />
        <GridItem icon="photo-o" text="Item 3" />
        <GridItem icon="photo-o" text="Item 4" />
        <GridItem icon="photo-o" text="Item 5" />
        <GridItem icon="photo-o" text="Item 6" />
        <GridItem icon="photo-o" text="Item 7" />
        <GridItem icon="photo-o" text="Item 8" />
      </Grid>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Horizontal Direction</text>
      <Grid :column-num="3" direction="horizontal">
        <GridItem icon="photo-o" text="Item 1" />
        <GridItem icon="photo-o" text="Item 2" />
        <GridItem icon="photo-o" text="Item 3" />
      </Grid>

      <!-- Clickable -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">Clickable</text>
      <Grid :column-num="3" clickable>
        <GridItem icon="home-o" text="Home" />
        <GridItem icon="search" text="Search" />
        <GridItem icon="setting-o" text="Settings" />
      </Grid>

      <!-- With Badge -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 16 }">With Badge</text>
      <Grid :column-num="3">
        <GridItem icon="home-o" text="Home" :dot="true" />
        <GridItem icon="search" text="Search" badge="5" />
        <GridItem icon="friends-o" text="Friends" badge="99+" />
      </Grid>
    </view>
  </DemoPage>
</template>
