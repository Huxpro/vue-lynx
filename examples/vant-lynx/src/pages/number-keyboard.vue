<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import NumberKeyboard from '../components/NumberKeyboard/index.vue';
import PasswordInput from '../components/PasswordInput/index.vue';
const showKeyboard = ref(true);
const showKeyboardWithTitle = ref(false);
const showKeyboardExtra = ref(false);
const showKeyboardSidebar = ref(false);
const showKeyboardIdNumber = ref(false);
const showKeyboardMultiExtra = ref(false);
const showKeyboardRandom = ref(false);

const inputValue = ref('');
const inputValueTitle = ref('');
const inputValueExtra = ref('');
const inputValueSidebar = ref('');
const inputValueIdNumber = ref('');
const inputValueMultiExtra = ref('');
const inputValueRandom = ref('');

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

function onInputSidebar(key: string) {
  if (inputValueSidebar.value.length < 10) {
    inputValueSidebar.value += key;
  }
}

function onDeleteSidebar() {
  inputValueSidebar.value = inputValueSidebar.value.slice(0, -1);
}

function onInputIdNumber(key: string) {
  if (inputValueIdNumber.value.length < 18) {
    inputValueIdNumber.value += key;
  }
}

function onDeleteIdNumber() {
  inputValueIdNumber.value = inputValueIdNumber.value.slice(0, -1);
}

function onInputMultiExtra(key: string) {
  if (inputValueMultiExtra.value.length < 10) {
    inputValueMultiExtra.value += key;
  }
}

function onDeleteMultiExtra() {
  inputValueMultiExtra.value = inputValueMultiExtra.value.slice(0, -1);
}

function onInputRandom(key: string) {
  if (inputValueRandom.value.length < 6) {
    inputValueRandom.value += key;
  }
}

function onDeleteRandom() {
  inputValueRandom.value = inputValueRandom.value.slice(0, -1);
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

      <!-- Keyboard with sidebar (custom theme) -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Keyboard With Sidebar</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardSidebar ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardSidebar = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueSidebar ? '#323233' : '#c8c9cc' }">
            {{ inputValueSidebar || 'Tap to enter' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardSidebar"
        theme="custom"
        extra-key="."
        close-button-text="Close"
        @input="onInputSidebar"
        @delete="onDeleteSidebar"
        @close="() => { showKeyboardSidebar = false; }"
      />

      <!-- IdNumber keyboard -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">IdNumber Keyboard</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardIdNumber ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardIdNumber = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueIdNumber ? '#323233' : '#c8c9cc' }">
            {{ inputValueIdNumber || 'Tap to enter ID number' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardIdNumber"
        extra-key="X"
        close-button-text="Close"
        @input="onInputIdNumber"
        @delete="onDeleteIdNumber"
        @close="() => { showKeyboardIdNumber = false; }"
      />

      <!-- Multiple extra keys -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Multiple ExtraKey</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardMultiExtra ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardMultiExtra = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueMultiExtra ? '#323233' : '#c8c9cc' }">
            {{ inputValueMultiExtra || 'Tap to enter' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardMultiExtra"
        theme="custom"
        :extra-key="['00', '.']"
        close-button-text="Close"
        @input="onInputMultiExtra"
        @delete="onDeleteMultiExtra"
        @close="() => { showKeyboardMultiExtra = false; }"
      />

      <!-- Random key order -->
      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Random Key Order</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8 }">
        <view
          :style="{
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: showKeyboardRandom ? '#1989fa' : '#ebedf0',
            paddingBottom: 8,
          }"
          @tap="() => { showKeyboardRandom = true; }"
        >
          <text :style="{ fontSize: 16, color: inputValueRandom ? '#323233' : '#c8c9cc' }">
            {{ inputValueRandom || 'Tap to enter' }}
          </text>
        </view>
      </view>
      <NumberKeyboard
        :show="showKeyboardRandom"
        random-key-order
        close-button-text="Done"
        @input="onInputRandom"
        @delete="onDeleteRandom"
        @close="() => { showKeyboardRandom = false; }"
      />
    </view>
  </DemoPage>
</template>
