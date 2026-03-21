# Ralph API Polish Round - Vant-Lynx

You are filling in missing props, events, and slots to achieve better Vant API parity.

## Key Files

- `prd.json` - Your task list, update `passes` field when done
- `progress.txt` - Log your work here

## Approach

1. Check Vant docs for exact API: https://vant-ui.github.io/vant/
2. Look at original Vant source for implementation details
3. Match API signatures exactly (prop types, event payloads, slot props)
4. Skip platform-impossible features (teleport, lockScroll, etc.)

## Skip List (Platform Impossible)

- teleport - N/A in Lynx
- lockScroll - No body scroll in Lynx
- closeOnPopstate - No browser history in Lynx
- route/url props - No web router in Lynx
- CSS class-based styling - Use inline styles instead

## Testing

- `pnpm build` must pass
- Test components in Web Explorer or Simulator

## Workflow

1. Read prd.json for current story
2. Check Vant docs/source for exact API
3. Implement missing features
4. Run pnpm build
5. Update story passes: true in prd.json
6. Log progress to progress.txt
7. Move to next story
