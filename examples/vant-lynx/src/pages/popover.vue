<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Popover from '../components/Popover/index.vue';
const showLight = ref(false);
const showDark = ref(false);
const showPlacement = ref(false);
const showDisabled = ref(false);
const showHorizontal = ref(false);
const showIcon = ref(false);
const showCustom = ref(false);
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

const horizontalActions = [
  { text: 'Option 1' },
  { text: 'Option 2' },
  { text: 'Option 3' },
];

const iconActions = [
  { text: 'Option 1', icon: 'add-o' },
  { text: 'Option 2', icon: 'music-o' },
  { text: 'Option 3', icon: 'more-o' },
];

function onSelect(action: any, index: number) {
  selectedAction.value = `Selected: ${action.text} (index: ${index})`;
}
</script>

<template>
  <DemoPage title="Popover">
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

      <!-- Horizontal -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showHorizontal"
          :actions="horizontalActions"
          actions-direction="horizontal"
          placement="bottom-start"
          @update:show="(v: boolean) => showHorizontal = v"
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
            <text :style="{ fontSize: 14, color: '#fff' }">Horizontal Popover</text>
          </view>
        </Popover>
      </view>

      <!-- Show Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Icon</text>
      <view :style="{ marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showIcon"
          :actions="iconActions"
          placement="bottom-start"
          @update:show="(v: boolean) => showIcon = v"
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
            <text :style="{ fontSize: 14, color: '#fff' }">With Icons</text>
          </view>
        </Popover>
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Content</text>
      <view :style="{ marginBottom: 16, padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
        <Popover
          :show="showCustom"
          placement="bottom-start"
          @update:show="(v: boolean) => showCustom = v"
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
            <text :style="{ fontSize: 14, color: '#fff' }">Custom Content</text>
          </view>
          <template #content>
            <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
              <text :style="{ fontSize: 14, color: '#323233', marginBottom: 8 }">Custom Header</text>
              <view :style="{ display: 'flex', flexDirection: 'row' }">
                <view
                  v-for="i in 3"
                  :key="i"
                  :style="{
                    width: 60,
                    height: 60,
                    backgroundColor: '#f2f3f5',
                    borderRadius: 4,
                    marginRight: i < 3 ? 8 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }"
                  @tap="() => { showCustom = false; selectedAction = `Custom item ${i}`; }"
                >
                  <text :style="{ fontSize: 12, color: '#323233' }">Item {{ i }}</text>
                </view>
              </view>
            </view>
          </template>
        </Popover>
      </view>

      <!-- Result -->
      <view v-if="selectedAction" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ selectedAction }}</text>
      </view>
    </view>
  </DemoPage>
</template>
