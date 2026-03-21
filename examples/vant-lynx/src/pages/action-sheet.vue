<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ActionSheet from '../components/ActionSheet/index.vue';
import Button from '../components/Button/index.vue';
const showBasic = ref(false);
const showWithCancel = ref(false);
const showWithDescription = ref(false);
const showOptionStatus = ref(false);
const showCustomPanel = ref(false);
const lastSelected = ref('');

const basicActions = [
  { name: 'Option 1' },
  { name: 'Option 2' },
  { name: 'Option 3' },
];

const statusActions = [
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
  <DemoPage title="ActionSheet">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showBasic = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Basic ActionSheet</text>
        </Button>
      </view>

      <!-- Show Cancel Button -->
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

      <!-- Option Status -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Option Status</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showOptionStatus = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Option Status</text>
        </Button>
      </view>

      <!-- Custom Panel -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Panel</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" block @tap="showCustomPanel = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Custom Panel</text>
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

    <!-- ActionSheet with option status -->
    <ActionSheet
      v-model:show="showOptionStatus"
      title="Option Status"
      :actions="statusActions"
      cancel-text="Cancel"
      @select="onSelect"
    />

    <!-- ActionSheet with custom panel -->
    <ActionSheet
      v-model:show="showCustomPanel"
      title="Custom Panel"
    >
      <view :style="{ padding: 16 }">
        <text :style="{ fontSize: 14, color: '#323233', marginBottom: 12 }">Custom content inside the ActionSheet.</text>
        <view :style="{ height: 100, backgroundColor: '#f7f8fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 16, color: '#969799' }">Custom Content Area</text>
        </view>
      </view>
    </ActionSheet>
  </DemoPage>
</template>
