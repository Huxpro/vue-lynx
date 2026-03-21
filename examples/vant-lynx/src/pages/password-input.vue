<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import PasswordInput from '../components/PasswordInput/index.vue';
import NumberKeyboard from '../components/NumberKeyboard/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

const value = ref('');
const valuePlain = ref('123');
const focused = ref(false);

function onFocus() {
  focused.value = true;
}

function onInput(key: string) {
  if (value.value.length < 6) {
    value.value += key;
  }
}

function onDelete() {
  value.value = value.value.slice(0, -1);
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">PasswordInput</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic (mask) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage (Masked)</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <PasswordInput
          :value="value"
          :focused="focused"
          info="6-digit password"
          @focus="onFocus"
        />
      </view>

      <!-- Plain digits -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Plain Digits</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <PasswordInput
          :value="valuePlain"
          :mask="false"
          :length="6"
        />
      </view>

      <!-- With gutter -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Gutter</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <PasswordInput
          value="12"
          :length="4"
          :gutter="10"
          :mask="true"
        />
      </view>

      <!-- Error state -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error Info</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <PasswordInput
          value="123456"
          :length="6"
          error-info="Password incorrect, please try again"
        />
      </view>
    </view>

    <!-- Keyboard attached -->
    <NumberKeyboard
      :show="focused"
      @input="onInput"
      @delete="onDelete"
      @close="() => { focused = false; }"
    />
  </view>
</template>
