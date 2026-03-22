# Ralph Animation Fix Round - Vant-Lynx

## IMPORTANT CORRECTION

We made a mistake! Lynx DOES support:
- CSS `transition` property
- CSS `@keyframes` animation  
- CSS `transform`, `opacity`, etc.
- Vue `<Transition>` component

We should NOT have used `element.animate()`. This round fixes all components to use CSS transitions like the original Vant implementation.

## The Pattern to Follow

### Vant's Original Approach:
```vue
<Transition name="van-fade">
  <div v-show="show" class="van-overlay" />
</Transition>
```

With CSS (via inline styles in Lynx):
```typescript
// Transition enter/leave classes applied automatically by <Transition>
// We provide the styles via :style binding

const transitionStyle = computed(() => ({
  transition: `opacity ${props.duration}s ease`,
  // or for transforms:
  transition: `transform ${props.duration}s ease`,
}));
```

### Position-based Popup Transitions:
- `center`: scale(0.9) -> scale(1) + opacity (bounce effect)
- `top`: translateY(-100%) -> translateY(0)
- `bottom`: translateY(100%) -> translateY(0)  
- `left`: translateX(-100%) -> translateX(0)
- `right`: translateX(100%) -> translateX(0)

### Using Vue <Transition> events:
```vue
<Transition
  :name="transitionName"
  @after-enter="onOpened"
  @after-leave="onClosed"
>
  <div v-show="show" :style="transitionStyle">...</div>
</Transition>
```

## Key Changes

1. **Remove** all `useAnimate` imports
2. **Remove** all `runOnMainThread`, `main-thread-ref` usage
3. **Add** `<Transition>` wrapper with appropriate name
4. **Add** CSS transition styles via :style binding
5. **Use** `@after-enter`/`@after-leave` for opened/closed events

## Files to Delete

- `composables/useAnimate.ts` - no longer needed

## Workflow

1. Read prd.json for current story
2. Remove element.animate() code
3. Add <Transition> with CSS transitions
4. Test with pnpm build
5. Update prd.json passes: true
6. Log progress
