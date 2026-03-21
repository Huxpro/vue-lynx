<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Checkbox from '../components/Checkbox/index.vue';
import CheckboxGroup from '../components/CheckboxGroup/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';

const basicChecked = ref(true);
const groupValue = ref(['a', 'b']);
const disabledGroupValue = ref(['a']);
const maxGroupValue = ref(['a']);
const horizontalGroupValue = ref(['a']);
const shapeValue = ref(['a']);
const customColorValue = ref(['a']);
const labelLeftValue = ref(['a']);
const labelDisabledValue = ref(['a']);
const iconSizeValue = ref(true);
const customIconValue = ref(true);
const toggleAllValue = ref(['a', 'b']);
const cellGroupValue = ref(['a']);
const checkboxGroupRef = ref<InstanceType<typeof CheckboxGroup> | null>(null);

function toggleAll(checked: boolean) {
  checkboxGroupRef.value?.toggleAll(checked);
}
</script>

<template>
  <DemoPage title="Checkbox">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Checkbox v-model="basicChecked">
          <text :style="{ fontSize: 14, color: '#323233' }">Checkbox</text>
        </Checkbox>
      </view>

      <!-- Checkbox Group -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Checkbox Group</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="groupValue">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ groupValue.join(', ') }}</text>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="disabledGroupValue" disabled>
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#969799' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#969799' }">Checkbox b</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Custom Shape (square) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Shape</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="shapeValue" shape="square">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="customColorValue" checkedColor="#ee0a24">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Label Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Label Position (left)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="labelLeftValue">
          <Checkbox name="a" labelPosition="left">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b" labelPosition="left">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Label Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disable Label Click</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="labelDisabledValue">
          <Checkbox name="a" labelDisabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a (label disabled)</text>
          </Checkbox>
          <Checkbox name="b" labelDisabled>
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b (label disabled)</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Maximum Count -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Maximum Count (max: 2)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="maxGroupValue" :max="2">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ maxGroupValue.join(', ') }}</text>
      </view>

      <!-- Horizontal Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Horizontal</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup v-model="horizontalGroupValue" direction="horizontal">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
      </view>

      <!-- Custom Icon Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Checkbox v-model="iconSizeValue" :icon-size="24">
          <text :style="{ fontSize: 14, color: '#323233' }">Custom size (24px)</text>
        </Checkbox>
      </view>

      <!-- Custom Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Checkbox v-model="customIconValue">
          <template #icon="{ checked }">
            <view :style="{ width: 20, height: 20, borderRadius: 10, backgroundColor: checked ? '#ee0a24' : '#fff', borderWidth: 1, borderStyle: 'solid', borderColor: checked ? '#ee0a24' : '#c8c9cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text v-if="checked" :style="{ fontSize: 12, color: '#fff' }">&#10003;</text>
            </view>
          </template>
          <text :style="{ fontSize: 14, color: '#323233' }">Custom icon</text>
        </Checkbox>
      </view>

      <!-- Toggle All -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toggle All</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CheckboxGroup ref="checkboxGroupRef" v-model="toggleAllValue">
          <Checkbox name="a">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox a</text>
          </Checkbox>
          <Checkbox name="b">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox b</text>
          </Checkbox>
          <Checkbox name="c">
            <text :style="{ fontSize: 14, color: '#323233' }">Checkbox c</text>
          </Checkbox>
        </CheckboxGroup>
        <view :style="{ display: 'flex', flexDirection: 'row', marginTop: 12 }">
          <view :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16, backgroundColor: '#1989fa', borderRadius: 4, marginRight: 8 }" @tap="toggleAll(false)">
            <text :style="{ fontSize: 14, color: '#fff' }">Uncheck All</text>
          </view>
          <view :style="{ paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16, backgroundColor: '#07c160', borderRadius: 4 }" @tap="toggleAll(true)">
            <text :style="{ fontSize: 14, color: '#fff' }">Check All</text>
          </view>
        </view>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Selected: {{ toggleAllValue.join(', ') || 'none' }}</text>
      </view>

      <!-- Inside a Cell -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Inside a Cell</text>
      <CellGroup>
        <CheckboxGroup v-model="cellGroupValue">
          <Cell
            v-for="name in ['a', 'b', 'c']"
            :key="name"
            :title="`Checkbox ${name}`"
            :border="name !== 'c'"
            clickable
            @click="() => { const i = cellGroupValue.indexOf(name); if (i > -1) cellGroupValue.splice(i, 1); else cellGroupValue.push(name); }"
          >
            <template #right-icon>
              <Checkbox :name="name" :bind-group="true" />
            </template>
          </Cell>
        </CheckboxGroup>
      </CellGroup>
    </view>
  </DemoPage>
</template>
