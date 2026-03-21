<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Popover from '../components/Popover/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const showLight = ref(false);
const showDark = ref(false);
const showPlacement = ref(false);
const showDisabled = ref(false);
const selectedAction = ref('');

const lightActions = [
  { text: 'Option 1' },
  { text: 'Option 2' },
  { text: 'Option 3' },
];

const darkActions = [
  { text: 'Option A' },
  { text: 'Option B' },
  { text: 'Option C' },
];

const placementActions = [
  { text: 'Top Action 1' },
  { text: 'Top Action 2' },
];

const disabledActions = [
  { text: 'Option 1' },
  { text: 'Option 2', disabled: true },
  { text: 'Option 3' },
];

function onSelect(action: any, index: number) {
  selectedAction.value = `Selected: ${action.text} (index: ${index})`;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Popover</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Light Theme -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Light Theme</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showLight"
          :actions="lightActions"
          placement="bottom-start"
          @update:show="(v: boolean) => showLight = v"
          @select="onSelect"
        >
          <view
            :style="{
              backgroundColor: '#1989fa',
              borderRadius: 4,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
            }"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Light Popover</text>
          </view>
        </Popover>
      </view>

      <!-- Dark Theme -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dark Theme</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showDark"
          :actions="darkActions"
          theme="dark"
          placement="bottom-start"
          @update:show="(v: boolean) => showDark = v"
          @select="onSelect"
        >
          <view
            :style="{
              backgroundColor: '#1989fa',
              borderRadius: 4,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
            }"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Dark Popover</text>
          </view>
        </Popover>
      </view>

      <!-- Placement -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Placement</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showPlacement"
          :actions="placementActions"
          placement="top"
          @update:show="(v: boolean) => showPlacement = v"
          @select="onSelect"
        >
          <view
            :style="{
              backgroundColor: '#1989fa',
              borderRadius: 4,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
            }"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Top Placement</text>
          </view>
        </Popover>
      </view>

      <!-- Disabled Action -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled Action</text>
      <view :style="{ marginBottom: 16, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showDisabled"
          :actions="disabledActions"
          placement="bottom-start"
          @update:show="(v: boolean) => showDisabled = v"
          @select="onSelect"
        >
          <view
            :style="{
              backgroundColor: '#1989fa',
              borderRadius: 4,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
            }"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">Show Popover</text>
          </view>
        </Popover>
      </view>

      <!-- Result -->
      <view v-if="selectedAction" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ selectedAction }}</text>
      </view>
    </view>
  </view>
</template>
