<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="Button">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- 按钮类型 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">按钮类型</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" text="主要按钮" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="success" text="成功按钮" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="default" text="默认按钮" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="warning" text="警告按钮" />
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="danger" text="危险按钮" />
        </view>
      </view>

      <!-- 朴素按钮 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">朴素按钮</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" plain text="朴素按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" plain text="朴素按钮" />
        </view>
      </view>

      <!-- 细边框 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">细边框</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" plain hairline text="细边框按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" plain hairline text="细边框按钮" />
        </view>
      </view>

      <!-- 禁用状态 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">禁用状态</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" disabled text="禁用状态" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="success" disabled text="禁用状态" />
        </view>
      </view>

      <!-- 加载状态 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">加载状态</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" loading />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" loading loading-type="spinner" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" loading loading-text="加载中..." />
        </view>
      </view>

      <!-- 按钮形状 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">按钮形状</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" square text="方形按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" round text="圆形按钮" />
        </view>
      </view>

      <!-- 图标按钮 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">图标按钮</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" text="按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" icon="plus" text="按钮" icon-position="right" />
        </view>
      </view>

      <!-- 按钮尺寸 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">按钮尺寸</text>
      <view :style="{ display: 'flex', flexDirection: 'column', marginBottom: 16 }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" size="large" text="大号按钮" />
        </view>
        <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 8 }">
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="normal" text="普通按钮" />
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="small" text="小型按钮" />
          </view>
          <view :style="{ marginRight: 8 }">
            <Button type="primary" size="mini" text="迷你按钮" />
          </view>
        </view>
      </view>

      <!-- 块级元素 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">块级元素</text>
      <view :style="{ marginBottom: 16 }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" block text="块级元素" />
        </view>
      </view>

      <!-- 路由跳转 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">路由跳转</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button type="primary" url="/home" text="URL 跳转" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button type="primary" :to="{ name: 'home' }" text="路由跳转" />
        </view>
      </view>

      <!-- 自定义颜色 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">自定义颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: 8 }">
          <Button color="#7232dd" text="单色按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button color="#7232dd" plain text="单色按钮" />
        </view>
        <view :style="{ marginRight: 8 }">
          <Button color="linear-gradient(to right, #ff6034, #ee0a24)" text="渐变按钮" />
        </view>
      </view>
    </view>
  </DemoPage>
</template>
