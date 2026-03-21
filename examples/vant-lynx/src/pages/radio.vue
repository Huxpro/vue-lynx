<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Radio from '../components/Radio/index.vue';
import RadioGroup from '../components/RadioGroup/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const basicValue = ref('1');
const horizontalValue = ref('1');
const disabledValue = ref('1');
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Radio</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="basicValue">
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
        </RadioGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ basicValue }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal Direction</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="horizontalValue" direction="horizontal">
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 2</text>
          </Radio>
          <Radio name="3">
            <text :style="{ fontSize: 14, color: '#323233' }">Radio 3</text>
          </Radio>
        </RadioGroup>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <RadioGroup v-model="disabledValue" disabled>
          <Radio name="1">
            <text :style="{ fontSize: 14, color: '#969799' }">Radio 1</text>
          </Radio>
          <Radio name="2">
            <text :style="{ fontSize: 14, color: '#969799' }">Radio 2</text>
          </Radio>
        </RadioGroup>
      </view>
    </view>
  </view>
</template>
