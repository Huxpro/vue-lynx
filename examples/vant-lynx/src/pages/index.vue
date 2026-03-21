<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const components = [
  { name: 'Button', path: '/button' },
  { name: 'Cell', path: '/cell' },
  { name: 'Icon', path: '/icon' },
  { name: 'Image', path: '/image' },
  { name: 'Loading', path: '/loading' },
  { name: 'Tag', path: '/tag' },
  { name: 'Badge', path: '/badge' },
  { name: 'Divider', path: '/divider' },
  { name: 'Space', path: '/space' },
  { name: 'Layout', path: '/layout' },
  { name: 'Popup', path: '/popup' },
  { name: 'Overlay', path: '/overlay' },
  { name: 'Switch', path: '/switch' },
  { name: 'Checkbox', path: '/checkbox' },
  { name: 'Radio', path: '/radio' },
  { name: 'Field', path: '/field' },
  { name: 'Rate', path: '/rate' },
  { name: 'Stepper', path: '/stepper' },
  { name: 'Progress', path: '/progress' },
  { name: 'Circle', path: '/circle' },
  { name: 'CountDown', path: '/count-down' },
  { name: 'Empty', path: '/empty' },
  { name: 'NoticeBar', path: '/notice-bar' },
  { name: 'NavBar', path: '/nav-bar' },
  { name: 'Tabbar', path: '/tabbar' },
  { name: 'Tab', path: '/tab' },
  { name: 'Grid', path: '/grid' },
  { name: 'Collapse', path: '/collapse' },
  { name: 'Steps', path: '/steps' },
  { name: 'Toast', path: '/toast' },
  { name: 'ConfigProvider', path: '/config-provider' },
  { name: 'ActionSheet', path: '/action-sheet' },
  { name: 'Dialog', path: '/dialog' },
  { name: 'DropdownMenu', path: '/dropdown-menu' },
  { name: 'Notify', path: '/notify' },
  { name: 'ShareSheet', path: '/share-sheet' },
  { name: 'SwipeCell', path: '/swipe-cell' },
  { name: 'FloatingPanel', path: '/floating-panel' },
  { name: 'FloatingBubble', path: '/floating-bubble' },
  { name: 'Search', path: '/search' },
  { name: 'Slider', path: '/slider' },
  { name: 'Highlight', path: '/highlight' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Picker', path: '/picker' },
  { name: 'Cascader', path: '/cascader' },
  { name: 'DatePicker', path: '/date-picker' },
  { name: 'TimePicker', path: '/time-picker' },
  { name: 'NumberKeyboard', path: '/number-keyboard' },
  { name: 'PasswordInput', path: '/password-input' },
  { name: 'Uploader', path: '/uploader' },
  { name: 'Form', path: '/form' },
  { name: 'Skeleton', path: '/skeleton' },
  { name: 'Card', path: '/card' },
  { name: 'Pagination', path: '/pagination' },
  { name: 'Sticky', path: '/sticky' },
  { name: 'Swipe', path: '/swipe' },
  { name: 'TextEllipsis', path: '/text-ellipsis' },
  { name: 'Watermark', path: '/watermark' },
  { name: 'ActionBar', path: '/action-bar' },
  { name: 'BackTop', path: '/back-top' },
  { name: 'IndexBar', path: '/index-bar' },
  { name: 'Sidebar', path: '/sidebar' },
  { name: 'Barrage', path: '/barrage' },
  { name: 'ImagePreview', path: '/image-preview' },
  { name: 'List', path: '/list' },
  { name: 'Popover', path: '/popover' },
  { name: 'RollingText', path: '/rolling-text' },
  { name: 'TreeSelect', path: '/tree-select' },
  { name: 'AddressEdit', path: '/address-edit' },
  { name: 'AddressList', path: '/address-list' },
  { name: 'Area', path: '/area' },
  { name: 'ContactCard', path: '/contact-card' },
  { name: 'ContactEdit', path: '/contact-edit' },
  { name: 'ContactList', path: '/contact-list' },
  { name: 'CouponList', path: '/coupon-list' },
  { name: 'SubmitBar', path: '/submit-bar' },
  { name: 'Signature', path: '/signature' },
  { name: 'PullRefresh', path: '/pull-refresh' },
];

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column' }">
    <text :style="{
      fontSize: 20,
      fontWeight: 'bold',
      padding: 16,
      color: '#323233',
      backgroundColor: '#fff',
    }">
      Vant Lynx
    </text>
    <text :style="{
      fontSize: 14,
      color: '#969799',
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 12,
      backgroundColor: '#fff',
    }">
      Mobile UI Components for Lynx
    </text>

    <view :style="{ padding: 12, display: 'flex', flexDirection: 'column' }">
      <view
        v-for="comp in components"
        :key="comp.name"
        :style="{
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 16,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }"
        @tap="navigate(comp.path)"
      >
        <text :style="{ fontSize: 16, color: '#323233' }">{{ comp.name }}</text>
        <text :style="{ fontSize: 14, color: '#969799' }">></text>
      </view>
    </view>
  </view>
</template>
