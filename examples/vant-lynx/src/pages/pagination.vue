<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Pagination from '../components/Pagination/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const simplePage = ref(1);
const multiPage = ref(1);
const customPage = ref(3);
const ellipsisPage = ref(1);
const largePage = ref(1);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Pagination</text>
    </view>

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
  </view>
</template>
