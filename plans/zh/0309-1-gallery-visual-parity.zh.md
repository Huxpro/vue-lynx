# Vue Gallery -- 与 React 原版的视觉/功能对齐

## 背景

Vue gallery 教程条目在功能上已经可以工作，但视觉上与 React 原版（`lynx-family/lynx-examples/examples/Gallery`）存在差异。用户要求**复用所有 CSS 并高保真地复刻其功能和 UI**。本计划更新每个 gallery 文件，以精确匹配 React 原版的样式、结构和行为。

React 源码（已克隆）：`/Users/bytedance/github/lynx-examples/examples/Gallery/src/`

## 变更摘要

### 1. 用 React 的精确 SCSS（作为纯 CSS）替换 `gallery.css`

**文件**：`e2e-lynx/src/gallery/gallery.css`

完全替换为 React `index.scss` 的内容（此处 SCSS 就是合法的 CSS -- 未使用嵌套/mixin）：

```css
.gallery-wrapper {
  height: 100vh;
  background-color: black;
}
.single-card {
  display: flex;
  align-items: center;
  justify-content: center;
}
.scrollbar {
  position: absolute;
  right: 7px;
  z-index: 1000;
  width: 4px;
  background: linear-gradient(to bottom, #ff6448, #ccddff, #3deae7);
  border-radius: 5px;
  overflow: hidden;
  box-shadow:
    0px 0px 4px 1px rgba(12, 205, 223, 0.4),
    0px 0px 16px 5px rgba(12, 205, 223, 0.5);
}
.scrollbar-effect {
  width: 100%;
  height: 80%;
}
.glow {
  background-color: #333;
  border-radius: 4px;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 20%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0) 80%
  );
  animation: flow 3s linear infinite;
}
@keyframes flow {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}
.list {
  width: 100vw;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 20px;
  height: calc(100% - 48px);
  list-main-axis-gap: 10px;
  list-cross-axis-gap: 10px;
}
.picture-wrapper {
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
}
.like-icon {
  position: absolute;
  display: grid;
  justify-items: center;
  align-items: center;
  top: 0px;
  right: 0px;
  width: 48px;
  height: 48px;
}
.heart-love {
  width: 16px;
  height: 16px;
}
.circle {
  position: absolute;
  top: calc(50% - 8px);
  left: calc(50% - 8px);
  height: 16px;
  width: 16px;
  border: 2px solid red;
  border-radius: 50%;
  transform: scale(0);
  opacity: 1;
  animation: ripple 1s 1 ease-out;
}
.circleAfter {
  animation-delay: 0.5s;
}
@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

移除旧类名：`.like-card`、`.scrollbar-track`、`.scrollbar-thumb`、`.scrollbar-glow`。

### 2. 从 React 源码复制心形 PNG 图片

**操作**：从 React 源码复制 `redHeart.png` 和 `whiteHeart.png` 到 Vue gallery：

```
cp /Users/bytedance/github/lynx-examples/examples/Gallery/src/Pictures/redHeart.png \
   packages/vue/e2e-lynx/src/gallery/Pictures/
cp /Users/bytedance/github/lynx-examples/examples/Gallery/src/Pictures/whiteHeart.png \
   packages/vue/e2e-lynx/src/gallery/Pictures/
```

### 3. 更新 `furnituresPictures.ts` -- 匹配 React 的精确尺寸

**文件**：`e2e-lynx/src/gallery/Pictures/furnituresPictures.ts`

更新尺寸以匹配 React 的精确值（React 使用本地 PNG；我们保留 picsum URL 但使用正确的宽×高）：

```
pic0:  512×429  →  保持不变
pic1:  511×437  →  更新（原为 512×640）
pic2:  1024×1589 → 更新（原为 512×384）
pic3:  510×418  →  更新（原为 512×512）
pic4:  509×438  →  更新（原为 512×341）
pic5:  1024×1557 → 更新（原为 512×682）
pic6:  509×415  →  更新（原为 512×455）
pic7:  509×426  →  更新（原为 512×576）
pic8:  1024×1544 → 更新（原为 512×400）
pic9:  510×432  →  更新（原为 512×614）
pic10: 1024×1467 → 更新（原为 512×480）
pic11: 1024×1545 → 更新（原为 512×550）
pic12: 512×416  →  更新（原为 512×370）
pic13: 1024×1509 → 更新（原为 512×600）
pic14: 512×411  →  更新（原为 512×460）
```

### 4. 更新 `LikeIcon.vue` -- 心形图片 + 涟漪效果 + 单向切换

**文件**：`e2e-lynx/src/gallery/Components/LikeIcon.vue`

用导入的 PNG 图片替换 unicode 心形。添加涟漪圆圈视图。使切换变为单向（仅白→红，与 React 一致）。

```vue
<script setup lang="ts">
import { ref } from 'vue-lynx';
import redHeart from '../Pictures/redHeart.png';
import whiteHeart from '../Pictures/whiteHeart.png';
const isLiked = ref(false);
function onTap() {
  isLiked.value = true;
}
</script>
<template>
  <view class="like-icon" @tap="onTap">
    <view v-if="isLiked" class="circle" />
    <view v-if="isLiked" class="circle circleAfter" />
    <image :src="isLiked ? redHeart : whiteHeart" class="heart-love" />
  </view>
</template>
```

### 5. 更新 `LikeImageCard.vue` -- 使用 `.picture-wrapper` 类名

**文件**：`e2e-lynx/src/gallery/Components/LikeImageCard.vue`

将类名从 `.like-card` 改为 `.picture-wrapper`（与 React 一致）。移除旧的 margin/白色背景样式。

```vue
<script setup lang="ts">
import type { Picture } from '../Pictures/furnituresPictures';
import LikeIcon from './LikeIcon.vue';
defineProps<{ picture: Picture }>();
</script>
<template>
  <view class="picture-wrapper">
    <image
      :style="{ width: '100%', aspectRatio: picture.width / picture.height }"
      :src="picture.src"
    />
    <LikeIcon />
  </view>
</template>
```

### 6. 更新 `ImageCard.vue` -- 使用 `.picture-wrapper` 类名

**文件**：`e2e-lynx/src/gallery/ImageCard/ImageCard.vue`

精确匹配 React 的 ImageCard 结构（使用类名 `picture-wrapper`，相同的样式绑定）。

### 7. 更新 `ImageCard/index.ts` -- 使用 `.gallery-wrapper.single-card`

**文件**：`e2e-lynx/src/gallery/ImageCard/index.ts`

用 `class="gallery-wrapper single-card"`（黑色背景，居中）替代内联的浅灰色样式作为渲染包裹器。

### 8. 更新 `LikeCard/index.ts` -- 同样使用 `.gallery-wrapper.single-card`

**文件**：`e2e-lynx/src/gallery/LikeCard/index.ts`

与 ImageCard 相同的包裹器变更。

### 9. 更新 `utils.ts` -- 使用 `SystemInfo` 获取动态宽度

**文件**：`e2e-lynx/src/gallery/utils.ts`

匹配 React 的精确计算方式，使用 `SystemInfo.pixelWidth / SystemInfo.pixelRatio`：

```ts
declare const SystemInfo: { pixelWidth: number; pixelRatio: number };
export const calculateEstimatedSize = (
  pictureWidth: number,
  pictureHeight: number,
): string => {
  const galleryPadding = 20;
  const galleryMainAxisGap = 10;
  const gallerySpanCount = 2;
  const galleryWidth = SystemInfo.pixelWidth / SystemInfo.pixelRatio;
  const itemWidth = (galleryWidth - galleryPadding * 2 - galleryMainAxisGap)
    / gallerySpanCount;
  return String(Math.round(itemWidth / pictureWidth * pictureHeight));
};
```

### 10. 更新所有 Gallery.vue 模板 -- 匹配 React 的列表属性

**文件**：`GalleryList/Gallery.vue`、`GalleryScrollbar/Gallery.vue`、`GalleryComplete/Gallery.vue`

所有文件的共同变更：

- 使用 `:column-count="2"` 替代 `:span-count="2"`（与 React 一致）
- 添加 `custom-list-name="list-container"`
- 移除 `flex: 1` 样式（CSS `.list` 现在使用 `height: calc(100% - 48px)`）
- 更新 `calculateEstimatedSize` 调用（现在返回字符串，仅接受 width+height）

### 11. 更新 `NiceScrollbar.vue` -- 使用 React 的类名结构

**文件**：`e2e-lynx/src/gallery/GalleryScrollbar/NiceScrollbar.vue`

用 `.scrollbar`/`.scrollbar-effect.glow` 替换 `.scrollbar-track`/`.scrollbar-thumb`。使用 `SystemInfo` 获取 listHeight。

```vue
<script setup lang="ts">
import { ref } from 'vue-lynx';
declare const SystemInfo: { pixelHeight: number; pixelRatio: number };
const scrollbarHeight = ref(0);
const scrollbarTop = ref(0);
function adjustScrollbar(scrollTop: number, scrollHeight: number) {
  const listHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio - 48;
  scrollbarHeight.value = listHeight * (listHeight / scrollHeight);
  scrollbarTop.value = listHeight * (scrollTop / scrollHeight);
}
defineExpose({ adjustScrollbar });
</script>
<template>
  <view
    class="scrollbar"
    :style="{ height: scrollbarHeight + 'px', top: scrollbarTop + 'px' }"
  >
    <view class="scrollbar-effect glow" />
  </view>
</template>
```

### 12. 更新 `NiceScrollbarMTS.vue` -- 匹配 React 结构

**文件**：`e2e-lynx/src/gallery/GalleryComplete/NiceScrollbarMTS.vue`

使用 `.scrollbar` 类名 + `.scrollbar-effect.glow` 子元素（与 React 一致）。移除 `.scrollbar-track` 包裹器。

### 13. 更新 `entry-main.ts` worklet -- 使用 `SystemInfo` 获取 listHeight

**文件**：`main-thread/src/entry-main.ts`

更新 `gallery:adjustScrollbarMTS` 以使用 `SystemInfo.pixelHeight / SystemInfo.pixelRatio - 48` 获取 listHeight，替代硬编码的 600。

### 14. 更新 `GalleryScrollbar/Gallery.vue` -- 使用 `SystemInfo` 获取 listHeight

从 `adjustScrollbar` 调用中移除硬编码的 `600` 参数。`NiceScrollbar.vue` 组件现在内部计算 listHeight。

## 修改的文件（完整列表）

| 文件                                                        | 操作                                     |
| ----------------------------------------------------------- | ---------------------------------------- |
| `e2e-lynx/src/gallery/gallery.css`                          | 替换为 React 的精确 CSS                  |
| `e2e-lynx/src/gallery/Pictures/redHeart.png`                | 从 React 源码复制                        |
| `e2e-lynx/src/gallery/Pictures/whiteHeart.png`              | 从 React 源码复制                        |
| `e2e-lynx/src/gallery/Pictures/furnituresPictures.ts`       | 更新尺寸以匹配 React                     |
| `e2e-lynx/src/gallery/Components/LikeIcon.vue`              | PNG 心形 + 涟漪圆圈 + 单向切换          |
| `e2e-lynx/src/gallery/Components/LikeImageCard.vue`         | 使用 `.picture-wrapper` 类名             |
| `e2e-lynx/src/gallery/ImageCard/ImageCard.vue`              | 使用 `.picture-wrapper` 类名             |
| `e2e-lynx/src/gallery/ImageCard/index.ts`                   | 使用 `.gallery-wrapper.single-card`      |
| `e2e-lynx/src/gallery/LikeCard/index.ts`                    | 使用 `.gallery-wrapper.single-card`      |
| `e2e-lynx/src/gallery/utils.ts`                             | 使用 `SystemInfo` 获取动态宽度           |
| `e2e-lynx/src/gallery/GalleryList/Gallery.vue`              | 匹配 React 列表属性 + 类名结构          |
| `e2e-lynx/src/gallery/GalleryScrollbar/Gallery.vue`         | 匹配 React，移除硬编码高度              |
| `e2e-lynx/src/gallery/GalleryScrollbar/NiceScrollbar.vue`   | React 类名结构 + SystemInfo              |
| `e2e-lynx/src/gallery/GalleryComplete/Gallery.vue`          | 匹配 React 列表属性                      |
| `e2e-lynx/src/gallery/GalleryComplete/NiceScrollbarMTS.vue` | React 类名结构                            |
| `main-thread/src/entry-main.ts`                             | 在 MTS 滚动条 worklet 中使用 SystemInfo  |

## 范围排除

- **自动滚动**（`useRef.invoke()`）：仍然跳过 -- Vue Lynx 尚不支持此功能
- **AddAutoScroll / ScrollbarCompare 条目**：未添加（需要 invoke API）
- **本地 PNG 家具图片**：保留 picsum.photos URL，但使用 React 的精确宽高比
- **SCSS 依赖**：未添加 -- React 的 SCSS 就是合法的纯 CSS（无嵌套）

## 验证

1. 在 `packages/vue/main-thread` 中执行 `pnpm build`（已更新的 worklet）
2. 在 `packages/vue/e2e-lynx` 中执行 `pnpm dev` -- 所有入口构建无错误
3. 在 LynxExplorer 中打开：
   - `gallery-image-card` -- **黑色背景**，居中卡片，10px 圆角
   - `gallery-like-card` -- 心形图标**右上角 48×48**，白色 PNG → 点击后变为红色 PNG，涟漪动画圆圈
   - `gallery-list` -- **黑色背景**，20px 内边距，条目间 10px 间距
   - `gallery-scrollbar` -- **渐变滚动条**（红→蓝→青）带**发光 box-shadow**，动画光泽效果
   - `gallery-complete` -- MTS 滚动条带相同的渐变/发光样式
4. DevTool 中无控制台错误
