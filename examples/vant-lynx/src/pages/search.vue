<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Search from '../components/Search/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const basicValue = ref('');
const roundValue = ref('');
const actionValue = ref('');
const labelValue = ref('');
const searchResult = ref('');

function onSearch(val: string) {
  searchResult.value = `Searched: ${val}`;
}

function onCancel() {
  actionValue.value = '';
  searchResult.value = 'Cancelled';
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Search</text>
    </view>

    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Basic Usage</text>
      <Search
        v-model="basicValue"
        placeholder="Search"
        @search="onSearch"
      />

      <!-- Round Shape -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Round Shape</text>
      <Search
        v-model="roundValue"
        shape="round"
        placeholder="Search"
        @search="onSearch"
      />

      <!-- Show Action -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Show Action Button</text>
      <Search
        v-model="actionValue"
        :show-action="true"
        placeholder="Search"
        @search="onSearch"
        @cancel="onCancel"
      />

      <!-- With Label -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">With Label</text>
      <Search
        v-model="labelValue"
        label="Location"
        placeholder="Enter location"
        @search="onSearch"
      />

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Disabled</text>
      <Search
        model-value="Disabled search"
        disabled
        placeholder="Disabled"
      />

      <!-- Result -->
      <view v-if="searchResult" :style="{ margin: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ searchResult }}</text>
      </view>
    </view>
  </view>
</template>
