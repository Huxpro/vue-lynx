# Ralph Demo Coverage Round - Vant-Lynx

You are adding missing demos to match Vant's official documentation.

## Key Files

- `prd.json` - Your task list
- `progress.txt` - Log your work

## Demo Page Structure

Each demo page uses this pattern:

```vue
<script setup>
import DemoPage from '../components/DemoPage/index.vue';
import ComponentName from '../components/ComponentName/index.vue';
</script>

<template>
  <DemoPage title="Component Name">
    <view :style="{ padding: 16 }">
      <!-- Section Header -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <!-- Demo -->
      <ComponentName prop="value" />
      
      <!-- Another Section -->
      <text :style="{ ... }">Another Demo</text>
      <ComponentName other-prop="value" />
    </view>
  </DemoPage>
</template>
```

## Reference

- Check Vant docs: https://vant-ui.github.io/vant/#/en-US/{component}
- Look at existing demo pages like button.vue for style reference
- Each section should have a text header and demo below

## Workflow

1. Open Vant docs for the component
2. List all demo sections shown
3. Compare with existing demo page
4. Add missing sections
5. pnpm build to verify
6. Update prd.json passes: true
7. Log progress
