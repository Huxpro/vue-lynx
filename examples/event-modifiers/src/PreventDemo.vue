<template>
  <view :style="{ margin: '12px 12px 0', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <view :style="{ padding: '10px 14px', backgroundColor: '#fff8e1' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#b45309' }">
        @tap.prevent — compatibility no-op
      </text>
    </view>
    <view :style="{ padding: '12px 14px' }">
      <text :style="{ fontSize: '12px', color: '#444', lineHeight: '1.6' }">
        Lynx has no browser default actions to cancel — there is no {'<a>'} navigation or {'<form>'} submission. The .prevent modifier is accepted silently so that code written for the web can run on Lynx without modification, but it has no observable effect.
      </text>
      <view :style="{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }">
        <text :style="{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }">
          {'<!-- same behavior as @tap on Lynx -->'}
        </text>
        <text :style="{ fontSize: '11px', color: '#007744', fontFamily: 'monospace', marginTop: '4px' }">
          {'<view @tap.prevent="handler" />'}
        </text>
      </view>
    </view>
  </view>
</template>
