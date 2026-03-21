<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ContactEdit from '../components/ContactEdit/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const result = ref('');

const editContactInfo = {
  name: 'John Doe',
  tel: '13000000000',
  isDefault: true,
};

function onSave(info: any) {
  result.value = 'Saved: ' + info.name + ' - ' + info.tel;
}

function onDelete(info: any) {
  result.value = 'Deleted: ' + info.name;
}

function onChangeDefault(value: boolean) {
  result.value = 'Default changed to: ' + value;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ContactEdit</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- New Contact -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">New Contact</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <ContactEdit
          :show-set-default="true"
          @save="onSave"
          @change-default="onChangeDefault"
        />
      </view>

      <!-- Edit Contact -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Edit Contact</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <ContactEdit
          :contact-info="editContactInfo"
          :is-edit="true"
          :show-set-default="true"
          @save="onSave"
          @delete="onDelete"
          @change-default="onChangeDefault"
        />
      </view>

      <view v-if="result" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ result }}</text>
      </view>
    </view>
  </view>
</template>
