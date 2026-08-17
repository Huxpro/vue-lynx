import { useState } from '@lynx-js/react'

export function App() {
  const [alter, setAlter] = useState(false)
  const rows = []
  for (let i = 0; i < 16; i++) {
    rows.push(
      <view class={`row row-${i % 4}`} key={i}>
        <image class="icon" src="asset://icon.png" />
        <view class="body">
          <text class="title">{`Row title ${i % 7}`}</text>
          <text class="sub">A static subtitle line</text>
        </view>
      </view>,
    )
  }
  return (
    <view class="page">
      <view class="hero" bindtap={() => setAlter(!alter)}>
        <text class="hero-title">{alter ? 'Tapped' : 'React on Lynx'}</text>
        <text class="hero-sub">IFR probe</text>
      </view>
      <view class="rows">{rows}</view>
    </view>
  )
}
