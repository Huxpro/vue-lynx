<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import Field from '../components/Field/index.vue';
import NumberKeyboard from '../components/NumberKeyboard/index.vue';

const keyboard = ref('');
const bindValue = ref('');

function onInput(value: string) {
  // In real app, would use showToast
}

function onDelete() {
  // In real app, would use showToast
}
</script>

<template>
  <DemoPage title="NumberKeyboard">
    <view :style="{ paddingBottom: '300px' }">
      <!-- Trigger cells -->
      <Cell
        is-link
        title="Show Default Keyboard"
        @tap="keyboard = 'default'"
      />
      <Cell
        is-link
        title="Show Keyboard With Sidebar"
        @tap="keyboard = 'custom'"
      />
      <Cell
        is-link
        title="Show IdNumber Keyboard"
        @tap="keyboard = 'extraKey'"
      />
      <Cell
        is-link
        title="Show Keyboard With Title"
        @tap="keyboard = 'title'"
      />
      <Cell
        is-link
        title="Show Keyboard With Multiple ExtraKey"
        @tap="keyboard = 'multiExtraKey'"
      />
      <Cell
        is-link
        title="Show Keyboard With Random Key Order"
        @tap="keyboard = 'randomKeyOrder'"
      />

      <!-- Bind Value -->
      <Field
        v-model="bindValue"
        readonly
        clickable
        label="Bind Value"
        placeholder="Click To Input"
        @tap="keyboard = 'bindValue'"
      />
    </view>

    <!-- Default Keyboard -->
    <NumberKeyboard
      :show="keyboard === 'default'"
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- Keyboard With Sidebar (custom theme) -->
    <NumberKeyboard
      :show="keyboard === 'custom'"
      close-button-text="Close"
      theme="custom"
      extra-key="."
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- IdNumber Keyboard -->
    <NumberKeyboard
      :show="keyboard === 'extraKey'"
      close-button-text="Close"
      extra-key="X"
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- Keyboard With Title -->
    <NumberKeyboard
      :show="keyboard === 'title'"
      close-button-text="Close"
      title="Keyboard Title"
      extra-key="."
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- Multiple ExtraKey -->
    <NumberKeyboard
      :show="keyboard === 'multiExtraKey'"
      close-button-text="Close"
      theme="custom"
      :extra-key="['00', '.']"
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- Random Key Order -->
    <NumberKeyboard
      :show="keyboard === 'randomKeyOrder'"
      random-key-order
      @blur="keyboard = ''"
      @input="onInput"
      @delete="onDelete"
    />

    <!-- Bind Value -->
    <NumberKeyboard
      v-model="bindValue"
      :show="keyboard === 'bindValue'"
      :maxlength="6"
      @blur="keyboard = ''"
    />
  </DemoPage>
</template>
