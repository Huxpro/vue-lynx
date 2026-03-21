<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import NumberKeyboard from '../components/NumberKeyboard/index.vue';
import PasswordInput from '../components/PasswordInput/index.vue';
const showKeyboard = ref(true);
const showKeyboardWithTitle = ref(false);
const showKeyboardExtra = ref(false);

const inputValue = ref('');
const inputValueTitle = ref('');
const inputValueExtra = ref('');

function onInput(key: string) {
  if (inputValue.value.length < 6) {
    inputValue.value += key;
  }
}

function onDelete() {
  inputValue.value = inputValue.value.slice(0, -1);
}

function onInputTitle(key: string) {
  if (inputValueTitle.value.length < 6) {
    inputValueTitle.value += key;
  }
}

function onDeleteTitle() {
  inputValueTitle.value = inputValueTitle.value.slice(0, -1);
}

function onInputExtra(key: string) {
  if (inputValueExtra.value.length < 10) {
    inputValueExtra.value += key;
  }
}

function onDeleteExtra() {
  inputValueExtra.value = inputValueExtra.value.slice(0, -1);
}
</script>

<template>
  <DemoPage title="NumberKeyboard">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Default keyboard -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Default Keyboard</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <PasswordInput
          :value="inputValue"
          :focused="showKeyboard"
          @focus="() => { showKeyboard = true; }"
        />
      </view>
      <NumberKeyboard
        :show="showKeyboard"
        close-button-text="Done"
        @input="onInput"
        @delete="onDelete"
        @close="() => { showKeyboard = false; }"
      />

      <!-- Keyboard with title -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">With Title</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardWithTitle ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardWithTitle = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueTitle ? '#323233' : '#c8c9cc' }">
            {{ inputValueTitle || 'Tap to enter' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardWithTitle"
        title="Enter Amount"
        close-button-text="Done"
        @input="onInputTitle"
        @delete="onDeleteTitle"
        @close="() => { showKeyboardWithTitle = false; }"
      />

      <!-- Keyboard with extra key -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">With Extra Key</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardExtra ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardExtra = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueExtra ? '#323233' : '#c8c9cc' }">
            {{ inputValueExtra || 'Tap to enter decimal' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardExtra"
        extra-key="."
        close-button-text="Done"
        @input="onInputExtra"
        @delete="onDeleteExtra"
        @close="() => { showKeyboardExtra = false; }"
      />
    </view>
  </DemoPage>
</template>
