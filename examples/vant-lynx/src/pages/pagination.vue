<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Pagination from '../components/Pagination/index.vue';
const simplePage = ref(1);
const multiPage = ref(1);
const customPage = ref(3);
const ellipsisPage = ref(1);
const largePage = ref(1);
</script>

<template>
  <DemoPage title="Pagination">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Simple Mode -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Simple Mode</text>
      <view :style="{ backgroundColor: '#fff', padding: 16 }">
        <Pagination
          v-model="simplePage"
          :page-count="5"
          mode="simple"
        />
        <text :style="{ fontSize: 12, color: '#969799', textAlign: 'center', marginTop: 8 }">
          Current: {{ simplePage }}
        </text>
      </view>

      <!-- Multi Mode -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Multi Mode</text>
      <view :style="{ backgroundColor: '#fff', padding: 16 }">
        <Pagination
          v-model="multiPage"
          :page-count="5"
          mode="multi"
        />
        <text :style="{ fontSize: 12, color: '#969799', textAlign: 'center', marginTop: 8 }">
          Current: {{ multiPage }}
        </text>
      </view>

      <!-- Custom Button Text -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Button Text</text>
      <view :style="{ backgroundColor: '#fff', padding: 16 }">
        <Pagination
          v-model="customPage"
          :page-count="10"
          prev-text="Previous"
          next-text="Following"
        />
      </view>

      <!-- Force Ellipses -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Force Ellipses</text>
      <view :style="{ backgroundColor: '#fff', padding: 16 }">
        <Pagination
          v-model="ellipsisPage"
          :page-count="12"
          :show-page-size="3"
          force-ellipses
        />
        <text :style="{ fontSize: 12, color: '#969799', textAlign: 'center', marginTop: 8 }">
          Current: {{ ellipsisPage }}
        </text>
      </view>

      <!-- Total Items -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Using Total Items</text>
      <view :style="{ backgroundColor: '#fff', padding: 16 }">
        <Pagination
          v-model="largePage"
          :total-items="100"
          :items-per-page="10"
          mode="simple"
        />
        <text :style="{ fontSize: 12, color: '#969799', textAlign: 'center', marginTop: 8 }">
          Page {{ largePage }} of 10
        </text>
      </view>
    </view>
  </DemoPage>
</template>
