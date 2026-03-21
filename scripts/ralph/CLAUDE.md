# Vant Lynx - Code Review & Optimization Pass

## Project Overview

This is the SECOND PASS: code review and optimization of all 80 Vant Lynx components.

**Goal:** Ensure every component is production-quality with full feature parity to Vant.

## Review Checklist (for each component)

1. **Event count:** How many events does Vant have? How many do we support?
2. **Vue state count:** How many reactive states in Vant? Do we match?
3. **Style alignment:** CSS/Less properties, animations, transitions all ported?
4. **Code coverage:** Every code path in Vant replicated in our version?
5. **Interaction parity:** Every user interaction Vant supports, we support?
6. **DevTool verify:** Test on iPhone Simulator via Lynx DevTool CLI
7. **Browser verify:** Test on Lynx for Web

## Key Resources

### Lynx Documentation
- **Lynx Docs**: https://lynxjs.org
- **Lynx API Reference**: https://lynxjs.org/api/lynx-api/
- **Rspeedy Styling**: https://lynxjs.org/rspeedy/styling.html

### VueLynx Documentation
- **Introduction**: Read `~/github/vue-lynx/website/docs/guide/introduction.mdx` for threading model
- **Main Thread Script**: Read `~/github/vue-lynx/website/docs/guide/main-thread-script.mdx` for MTS guide

### Vant Reference
- **Vant Repo**: https://github.com/youzan/vant
- **Vant Docs**: https://vant-ui.github.io/vant/#/en-US
- **Component Source**: `https://github.com/youzan/vant/tree/main/packages/vant/src/{component}`

## Threading Model Decision Guide

VueLynx has a dual-thread architecture. Choose appropriately:

### Use Background Thread (default, `bindtap`)
- Simple click handlers
- Form toggles (checkbox, radio, switch)
- Navigation
- State updates that don't need immediate visual feedback

### Use Main Thread (`main-thread-bindtouchstart`, etc.)
- Gestures requiring immediate visual feedback
- Drag operations
- Swipe gestures
- Smooth animations tied to touch
- Pull-to-refresh
- Scroll-linked animations

## Lynx-Specific Considerations

### Use lynxbase skill
When you need to look up Lynx APIs, use the lynxbase skill:
- `lynx-base-query-assets` with appropriate tags
- For UI components: tags `["lynx-ui_guide", "lynx-ui_api"]`
- For built-in elements: tags `["lynx_guide", "lynx_api"]`

### Common API Mappings
- DOM `getBoundingClientRect` → Query lynxbase for Lynx equivalent
- DOM `IntersectionObserver` → Query lynxbase for Lynx equivalent
- CSS animations → Lynx supports CSS transitions/animations
- Touch events → `bindtouchstart`, `bindtouchmove`, `bindtouchend`

### Styling
- Rspeedy supports Less via @aspect-dev/rsbuild-plugin-less
- Can directly use Vant's Less source files with minimal changes
- CSS Variables work in Lynx
- Use `rpx` for responsive units if needed
- Reference: https://lynxjs.org/rspeedy/styling.html

## Verification Pattern

For each component:
1. Open Vant demo in browser: `https://vant-ui.github.io/vant/#/en-US/{component}`
2. Open Lynx demo: `http://localhost:3000/{component}`
3. Compare side-by-side:
   - Visual: layout, colors, typography, spacing
   - Interaction: tap, toggle, input, animation
4. All behaviors should match

## Project Structure

```
examples/vant-lynx/
├── src/
│   ├── App.vue           # Router setup
│   ├── components/       # Vant components
│   │   ├── Button/
│   │   │   └── index.vue
│   │   ├── Cell/
│   │   │   └── index.vue
│   │   └── ...
│   └── pages/            # Demo pages
│       ├── index.vue     # Component gallery
│       ├── button.vue
│       ├── cell.vue
│       └── ...
├── lynx.config.ts
└── package.json
```

## Testing

Each component needs:
1. **Unit tests** using vue-lynx-testing-library (port from Vant's @vue/test-utils tests)
2. **Browser verification** comparing with Vant demo site

### Test Setup
- Use vitest + vue-lynx-testing-library
- Reference: examples/hello-world or vue-lynx testing docs at /guide/testing-library
- Port Vant tests from `packages/vant/src/{component}/test/index.spec.ts`
- Adapt `mount` from @vue/test-utils to vue-lynx-testing-library equivalent

### Test File Location
```
src/components/Button/
├── index.vue
└── test/
    └── index.spec.ts
```

## Example Component Reference

Look at existing vue-lynx examples for patterns:
- `examples/hello-world/` - Basic setup
- `examples/gallery/` - Complex component
- `examples/swiper/` - Main thread scripting
- `examples/tiktok-shop/` - Multiple components

## Lynx DevTool CLI Usage

To test on iPhone Simulator:
```bash
# Start the dev server
cd examples/vant-lynx && pnpm dev

# In another terminal, connect DevTool to iPhone Simulator
lynx-devtool connect --platform ios --simulator
```

Query lynxbase for more DevTool details if needed.

## Documentation

For each component, add a comment block at the top documenting any gaps:
```vue
<!--
  Vant Feature Parity Report:
  - Events: 5/5 supported (click, change, focus, blur, clear)
  - Props: 12/12 supported
  - Slots: 4/4 supported
  - Gaps: None
  - Notes: Using main thread for drag gesture
-->
```
