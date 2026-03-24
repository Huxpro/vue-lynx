<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const nav = [
  {
    title: '基础组件',
    items: [
      { title: 'Button 按钮', path: '/button' },
      { title: 'Cell 单元格', path: '/cell' },
      { title: 'ConfigProvider 全局配置', path: '/config-provider' },
      { title: 'Icon 图标', path: '/icon' },
      { title: 'Image 图片', path: '/image' },
      { title: 'Layout 布局', path: '/layout' },
      { title: 'Popup 弹出层', path: '/popup' },
      { title: 'Space 间距', path: '/space' },
      { title: 'Toast 轻提示', path: '/toast' },
    ],
  },
  {
    title: '表单组件',
    items: [
      { title: 'Calendar 日历', path: '/calendar' },
      { title: 'Cascader 级联选择', path: '/cascader' },
      { title: 'Checkbox 复选框', path: '/checkbox' },
      { title: 'DatePicker 日期选择', path: '/date-picker' },
      { title: 'Field 输入框', path: '/field' },
      { title: 'Form 表单', path: '/form' },
      { title: 'NumberKeyboard 数字键盘', path: '/number-keyboard' },
      { title: 'PasswordInput 密码输入框', path: '/password-input' },
      { title: 'Picker 选择器', path: '/picker' },
      { title: 'PickerGroup 选择器组', path: '/picker-group' },
      { title: 'Radio 单选框', path: '/radio' },
      { title: 'Rate 评分', path: '/rate' },
      { title: 'Search 搜索', path: '/search' },
      { title: 'Slider 滑块', path: '/slider' },
      { title: 'Signature 签名', path: '/signature' },
      { title: 'Stepper 步进器', path: '/stepper' },
      { title: 'Switch 开关', path: '/switch' },
      { title: 'TimePicker 时间选择', path: '/time-picker' },
      { title: 'Uploader 文件上传', path: '/uploader' },
    ],
  },
  {
    title: '反馈组件',
    items: [
      { title: 'ActionSheet 动作面板', path: '/action-sheet' },
      { title: 'Barrage 弹幕', path: '/barrage' },
      { title: 'Dialog 弹出框', path: '/dialog' },
      { title: 'DropdownMenu 下拉菜单', path: '/dropdown-menu' },
      { title: 'FloatingPanel 浮动面板', path: '/floating-panel' },
      { title: 'FloatingBubble 浮动气泡', path: '/floating-bubble' },
      { title: 'Loading 加载', path: '/loading' },
      { title: 'Notify 消息通知', path: '/notify' },
      { title: 'Overlay 遮罩层', path: '/overlay' },
      { title: 'PullRefresh 下拉刷新', path: '/pull-refresh' },
      { title: 'ShareSheet 分享面板', path: '/share-sheet' },
      { title: 'SwipeCell 滑动单元格', path: '/swipe-cell' },
    ],
  },
  {
    title: '展示组件',
    items: [
      { title: 'Badge 徽标', path: '/badge' },
      { title: 'Circle 环形进度条', path: '/circle' },
      { title: 'Collapse 折叠面板', path: '/collapse' },
      { title: 'CountDown 倒计时', path: '/count-down' },
      { title: 'Divider 分割线', path: '/divider' },
      { title: 'Empty 空状态', path: '/empty' },
      { title: 'Highlight 高亮文本', path: '/highlight' },
      { title: 'ImagePreview 图片预览', path: '/image-preview' },
      { title: 'List 列表', path: '/list' },
      { title: 'NoticeBar 通知栏', path: '/notice-bar' },
      { title: 'Popover 气泡弹出框', path: '/popover' },
      { title: 'Progress 进度条', path: '/progress' },
      { title: 'RollingText 翻滚文本', path: '/rolling-text' },
      { title: 'Skeleton 骨架屏', path: '/skeleton' },
      { title: 'Steps 步骤条', path: '/steps' },
      { title: 'Sticky 粘性布局', path: '/sticky' },
      { title: 'Swipe 轮播', path: '/swipe' },
      { title: 'Tag 标签', path: '/tag' },
      { title: 'TextEllipsis 文本省略', path: '/text-ellipsis' },
      { title: 'Watermark 水印', path: '/watermark' },
    ],
  },
  {
    title: '导航组件',
    items: [
      { title: 'ActionBar 动作栏', path: '/action-bar' },
      { title: 'BackTop 回到顶部', path: '/back-top' },
      { title: 'Grid 宫格', path: '/grid' },
      { title: 'IndexBar 索引栏', path: '/index-bar' },
      { title: 'NavBar 导航栏', path: '/nav-bar' },
      { title: 'Pagination 分页', path: '/pagination' },
      { title: 'Sidebar 侧边导航', path: '/sidebar' },
      { title: 'Tab 标签页', path: '/tab' },
      { title: 'Tabbar 标签栏', path: '/tabbar' },
      { title: 'TreeSelect 分类选择', path: '/tree-select' },
    ],
  },
  {
    title: '业务组件',
    items: [
      { title: 'AddressEdit 地址编辑', path: '/address-edit' },
      { title: 'AddressList 地址列表', path: '/address-list' },
      { title: 'Area 省市区选择', path: '/area' },
      { title: 'Card 商品卡片', path: '/card' },
      { title: 'ContactCard 联系人卡片', path: '/contact-card' },
      { title: 'ContactEdit 联系人编辑', path: '/contact-edit' },
      { title: 'ContactList 联系人列表', path: '/contact-list' },
      { title: 'Coupon 优惠券', path: '/coupon-list' },
      { title: 'SubmitBar 提交订单栏', path: '/submit-bar' },
    ],
  },
];

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <scroll-view scroll-orientation="vertical">
    <view class="demo-home">
      <!-- Title -->
      <view class="demo-home__title">
        <text class="demo-home__title-text">Vant Lynx</text>
      </view>
      <text class="demo-home__desc">轻量、可定制的移动端组件库</text>

      <!-- Nav groups -->
      <view v-for="(group, gi) in nav" :key="gi" class="demo-home-nav">
        <text class="demo-home-nav__title">{{ group.title }}</text>
        <view class="demo-home-nav__group">
          <view
            v-for="item in group.items"
            :key="item.path"
            class="demo-home-nav__block"
            @tap="navigate(item.path)"
          >
            <text class="demo-home-nav__block-text">{{ item.title }}</text>
            <text class="demo-home-nav__icon">›</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="less">
.demo-home {
  width: 100%;
  padding: 46px 20px 20px;

  &__title {
    padding-left: 16px;
    margin-bottom: 16px;
  }

  &__title-text {
    font-size: 32px;
    font-weight: bold;
    color: #323233;
  }

  &__desc {
    padding-left: 16px;
    margin-bottom: 40px;
    color: #969799;
    font-size: 14px;
    line-height: 1.6;
  }
}

.demo-home-nav {
  &__title {
    margin: 24px 0 8px 16px;
    color: #969799;
    font-size: 14px;
  }

  &__group {
    display: flex;
    flex-direction: column;
  }

  &__block {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
    padding-left: 20px;
    padding-right: 16px;
    height: 40px;
    background-color: #f7f8fa;
    border-radius: 99px;
  }

  &__block-text {
    flex: 1;
    color: #323233;
    font-weight: 600;
    font-size: 14px;
  }

  &__icon {
    color: #b6b7b9;
    font-size: 16px;
  }
}
</style>
