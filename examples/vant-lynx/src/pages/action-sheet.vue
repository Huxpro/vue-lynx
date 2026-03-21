<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ActionSheet from '../components/ActionSheet/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const showBasic = ref(false);
const showWithTitle = ref(false);
const showWithCancel = ref(false);
const showWithDescription = ref(false);
const lastSelected = ref('');

const basicActions = [
  { name: 'Option 1' },
  { name: 'Option 2' },
  { name: 'Option 3' },
];

const colorActions = [
  { name: 'Colored Option', color: '#ee0a24' },
  { name: 'Disabled Option', disabled: true },
  { name: 'Loading Option', loading: true },
];

const descriptionActions = [
  { name: 'Option A' },
  { name: 'Option B' },
];

function onSelect(action: { name: string }, index: number) {
  lastSelected.value = `Selected: ${action.name} (index ${index})`;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ActionSheet</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showBasic = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Basic ActionSheet</text>
        </Button>
      </view>

      <!-- With Title -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Title</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showWithTitle = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show ActionSheet With Title</text>
        </Button>
      </view>

      <!-- With Cancel Button -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Cancel Button</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showWithCancel = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show ActionSheet With Cancel</text>
        </Button>
      </view>

      <!-- With Description -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Description</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showWithDescription = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show ActionSheet With Description</text>
        </Button>
      </view>

      <!-- Last selected -->
      <view v-if="lastSelected" :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ lastSelected }}</text>
      </view>
    </view>

    <!-- Basic ActionSheet -->
    <ActionSheet
      v-model:show="showBasic"
      :actions="basicActions"
      @select="onSelect"
    />

    <!-- ActionSheet with title and colored/disabled/loading actions -->
    <ActionSheet
      v-model:show="showWithTitle"
      title="Select an option"
      :actions="colorActions"
      @select="onSelect"
    />

    <!-- ActionSheet with cancel button -->
    <ActionSheet
      v-model:show="showWithCancel"
      :actions="basicActions"
      cancel-text="Cancel"
      @select="onSelect"
      @cancel="lastSelected = 'Cancelled'"
    />

    <!-- ActionSheet with description -->
    <ActionSheet
      v-model:show="showWithDescription"
      title="Share to"
      description="You can share this content to your friends"
      :actions="descriptionActions"
      cancel-text="Cancel"
      @select="onSelect"
    />
  </view>
</template>
