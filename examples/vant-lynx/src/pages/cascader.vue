<script setup lang="ts">
import { ref, reactive, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Field from '../components/Field/index.vue';
import Popup from '../components/Popup/index.vue';
import Cascader from '../components/Cascader/index.vue';
import type { CascaderOption } from '../components/Cascader/types';
import type { Numeric } from '../utils/format';

const options: CascaderOption[] = [
  {
    text: '浙江',
    value: '330000',
    children: [
      {
        text: '杭州',
        value: '330100',
        children: [
          { text: '上城区', value: '330102' },
          { text: '下城区', value: '330103' },
          { text: '江干区', value: '330104' },
        ],
      },
      {
        text: '宁波',
        value: '330200',
        children: [
          { text: '海曙区', value: '330203' },
          { text: '江北区', value: '330205' },
        ],
      },
    ],
  },
  {
    text: '江苏',
    value: '320000',
    children: [
      {
        text: '南京',
        value: '320100',
        children: [
          { text: '玄武区', value: '320102' },
          { text: '秦淮区', value: '320104' },
        ],
      },
      {
        text: '苏州',
        value: '320500',
        children: [
          { text: '姑苏区', value: '320508' },
          { text: '吴中区', value: '320506' },
        ],
      },
    ],
  },
];

// 基础用法
const baseState = reactive({
  show: false,
  value: '' as Numeric,
  result: '',
});

// 自定义颜色
const customColorState = reactive({
  show: false,
  value: undefined as Numeric | undefined,
  result: '',
});

// 异步加载选项
const asyncOptions = ref<CascaderOption[]>([
  {
    text: '浙江',
    value: '330000',
    children: [],
  },
]);
const asyncState = reactive({
  show: false,
  value: undefined as Numeric | undefined,
  result: '',
});

const loadDynamicOptions = ({ value }: { value: Numeric; tabIndex: number; selectedOptions: CascaderOption[] }) => {
  if (value === '330000' && asyncOptions.value[0].children?.length === 0) {
    setTimeout(() => {
      asyncOptions.value[0].children = [
        { text: '杭州', value: '330100' },
        { text: '宁波', value: '330200' },
      ];
    }, 500);
  }
};

// 自定义字段名
const fieldNames = {
  text: 'name',
  value: 'code',
  children: 'items',
};

const customFieldOptions = computed(() => {
  const adjust = (list: CascaderOption[]): any[] =>
    list.map((item) => {
      const result: any = { name: item.text, code: item.value };
      if (item.children) {
        result.items = adjust(item.children);
      }
      return result;
    });
  return adjust(options);
});

const customFieldState = reactive({
  show: false,
  value: undefined as Numeric | undefined,
  result: '',
});

// 自定义选项上方内容
const customContentState = reactive({
  show: false,
  value: undefined as Numeric | undefined,
  result: '',
});

const onFinish = (
  state: { show: boolean; value: Numeric | string | undefined; result: string },
  { value, selectedOptions }: { value: Numeric; tabIndex: number; selectedOptions: CascaderOption[] },
) => {
  const result = selectedOptions
    .map((option) => option.text || option.name)
    .join('/');
  state.show = false;
  state.value = value;
  state.result = result;
};
</script>

<template>
  <DemoPage title="Cascader 级联选择">
    <!-- 基础用法 -->
    <view class="demo-cascader-block">
      <text class="demo-cascader-title">基础用法</text>
      <Field
        :model-value="baseState.result"
        is-link
        readonly
        label="地区"
        placeholder="请选择地区"
        @tap="baseState.show = true"
      />
      <Popup
        v-model:show="baseState.show"
        round
        position="bottom"
      >
        <Cascader
          v-model="baseState.value"
          title="请选择地区"
          :options="options"
          @close="baseState.show = false"
          @finish="onFinish(baseState, $event)"
        />
      </Popup>
    </view>

    <!-- 自定义颜色 -->
    <view class="demo-cascader-block">
      <text class="demo-cascader-title">自定义颜色</text>
      <Field
        :model-value="customColorState.result"
        is-link
        readonly
        label="地区"
        placeholder="请选择地区"
        @tap="customColorState.show = true"
      />
      <Popup
        v-model:show="customColorState.show"
        round
        position="bottom"
      >
        <Cascader
          v-model="customColorState.value"
          title="请选择地区"
          :options="options"
          active-color="#ee0a24"
          @close="customColorState.show = false"
          @finish="onFinish(customColorState, $event)"
        />
      </Popup>
    </view>

    <!-- 异步加载选项 -->
    <view class="demo-cascader-block">
      <text class="demo-cascader-title">异步加载选项</text>
      <Field
        :model-value="asyncState.result"
        is-link
        readonly
        label="地区"
        placeholder="请选择地区"
        @tap="asyncState.show = true"
      />
      <Popup
        v-model:show="asyncState.show"
        round
        position="bottom"
      >
        <Cascader
          v-model="asyncState.value"
          title="请选择地区"
          :options="asyncOptions"
          @close="asyncState.show = false"
          @change="loadDynamicOptions"
          @finish="onFinish(asyncState, $event)"
        />
      </Popup>
    </view>

    <!-- 自定义字段名 -->
    <view class="demo-cascader-block">
      <text class="demo-cascader-title">自定义字段名</text>
      <Field
        :model-value="customFieldState.result"
        is-link
        readonly
        label="地区"
        placeholder="请选择地区"
        @tap="customFieldState.show = true"
      />
      <Popup
        v-model:show="customFieldState.show"
        round
        position="bottom"
      >
        <Cascader
          v-model="customFieldState.value"
          title="请选择地区"
          :options="customFieldOptions"
          :field-names="fieldNames"
          @close="customFieldState.show = false"
          @finish="onFinish(customFieldState, $event)"
        />
      </Popup>
    </view>

    <!-- 自定义选项上方内容 -->
    <view class="demo-cascader-block">
      <text class="demo-cascader-title">自定义选项上方内容</text>
      <Field
        :model-value="customContentState.result"
        is-link
        readonly
        label="地区"
        placeholder="请选择地区"
        @tap="customContentState.show = true"
      />
      <Popup
        v-model:show="customContentState.show"
        round
        position="bottom"
      >
        <Cascader
          v-model="customContentState.value"
          title="请选择地区"
          :options="customFieldOptions"
          :field-names="fieldNames"
          @close="customContentState.show = false"
          @finish="onFinish(customContentState, $event)"
        >
          <template #options-top="{ tabIndex }">
            <view :style="{ padding: '16px 16px 0' }">
              <text :style="{ fontSize: '14px', color: '#969799' }">当前为第 {{ tabIndex + 1 }} 级</text>
            </view>
          </template>
        </Cascader>
      </Popup>
    </view>
  </DemoPage>
</template>
