<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Dialog from '../components/Dialog/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const show = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');
const showCancelButton = ref(false);

function showAlert() {
  dialogTitle.value = 'Title';
  dialogMessage.value = 'This is a message.';
  showCancelButton.value = false;
  show.value = true;
}

function showConfirm() {
  dialogTitle.value = 'Confirm';
  dialogMessage.value = 'Are you sure you want to proceed?';
  showCancelButton.value = true;
  show.value = true;
}

function showMessageOnly() {
  dialogTitle.value = '';
  dialogMessage.value = 'Message-only dialog with no title.';
  showCancelButton.value = true;
  show.value = true;
}

function onConfirm() {
  show.value = false;
}

function onCancel() {
  show.value = false;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Dialog</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Alert Dialog -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Alert Dialog</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Button type="primary" @tap="showAlert">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Alert</text>
        </Button>
      </view>

      <!-- Confirm Dialog -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Confirm Dialog</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Button type="primary" @tap="showConfirm">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Confirm</text>
        </Button>
      </view>

      <!-- Message Only Dialog -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Message Only</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Button type="primary" @tap="showMessageOnly">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Message Only</text>
        </Button>
      </view>
    </view>

    <Dialog
      v-model:show="show"
      :title="dialogTitle"
      :message="dialogMessage"
      :show-cancel-button="showCancelButton"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </view>
</template>
