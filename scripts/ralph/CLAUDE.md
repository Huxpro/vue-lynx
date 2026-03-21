# Ralph Animation Round - Vant-Lynx

You are implementing animations for vant-lynx components.

## Key Files

- `prd.json` - Your task list, update `passes` field when done
- `progress.txt` - Log your work here

## Animation Options (Choose What Fits Best)

### Option 1: Vue's <Transition> Component (Recommended for simple enter/leave)

vue-lynx has full `<Transition>` support with CSS classes:

```vue
<Transition name="fade" :duration="300">
  <view v-if="show" class="overlay">...</view>
</Transition>
```

With CSS (via inline styles or style binding):
```typescript
// Enter
'.fade-enter-from': { opacity: 0 }
'.fade-enter-active': { transition: 'opacity 0.3s ease' }
'.fade-enter-to': { opacity: 1 }
// Leave
'.fade-leave-from': { opacity: 1 }
'.fade-leave-active': { transition: 'opacity 0.3s ease' }
'.fade-leave-to': { opacity: 0 }
```

### Option 2: CSS Transitions (via inline styles)

```vue
<view :style="{ 
  opacity: show ? 1 : 0,
  transform: show ? 'translateY(0)' : 'translateY(100%)',
  transition: 'all 0.3s ease'
}">
```

### Option 3: Main-thread element.animate() (For complex/programmatic)

```typescript
import { useMainThreadRef } from 'vue-lynx';

const elRef = useMainThreadRef<Element>();

function fadeIn(duration = 300) {
  'main-thread';
  elRef.current?.animate?.(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration, fill: 'forwards' }
  );
}
```

Note: element.animate() on web-core just landed (PR #2329), may need simulator testing.

### Option 4: CSS Variables

Lynx supports CSS variables too:
```vue
<view :style="{ '--duration': '0.3s', transition: 'opacity var(--duration)' }">
```

## Match Vant's Original Implementation

Look at how Vant implements animations and follow the same pattern. They typically use:
- `<Transition>` for overlay/popup enter/leave
- CSS transitions for simple state changes
- JS animations for complex gestures

## Testing

- `pnpm build` - Must pass for CI
- Test animations on Lynx Simulator or Web Explorer

## Workflow

1. Read prd.json for current story
2. Check how Vant does it originally
3. Implement using appropriate technique
4. Run pnpm build to verify
5. Update story passes: true in prd.json
6. Log progress to progress.txt
7. Move to next story
