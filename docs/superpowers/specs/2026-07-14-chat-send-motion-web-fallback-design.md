# Chat Send Motion and Web Fallback Design

## Goal

Make a newly sent message feel visibly connected to the composer on Native, clear the Native composer reliably after submission, and keep new content visible on Web by following the bottom of the conversation.

## Platform behavior

- Native keeps the existing anchored-turn layout. A newly submitted user bubble launches upward with a measured translation based on the viewport, composer, keyboard, and bubble heights. The assistant reveal waits until the user launch is substantially complete.
- Web does not use the Native top-anchor spacer or `scrollIntoView`. Lynx Web does not dispatch `contentsizechanged`, and its Background Thread UI-method bridge does not move this scroll view reliably, so followed message mutations toggle the Web element's observed `scroll-top` attribute. This keeps the list at the bottom after a send and throughout streaming.
- Reduced-motion mode preserves the final layout and reduces all entrance animations to one millisecond.

## Input synchronization

`PromptBox` continues emitting `v-model` updates. After accepting a submission, `ChatPage` clears the Vue model and increments a reset key. A post-flush watcher owned by `PromptBox` observes that key and resets the Native built-in textarea through its `setValue` UI method. Keeping the Native reset inside the child avoids cross-component ref timing and preserves keyboard focus without remounting the textarea.

## Motion calculation

The launch distance is computed in a pure helper so it is testable. It approximates the distance between the bubble's anchored top position and the visible composer edge, clamps the result to a useful range, and returns zero for Web. `ChatPage` stores the measured bubble height and exposes the result as the `--user-message-launch-distance` custom property on the animated bubble. The transform follows a single monotonic ease-out path to the target; it deliberately has no overshoot or rebound.

## Verification

- Vitest covers platform strategy, launch-distance bounds, Native input reset wiring, and stronger staggered motion.
- Web verification uses a long conversation and proves the newly sent message becomes visible at the bottom.
- Native verification uses LynxExplorer on iPhone 17 with iOS 26. It first establishes an existing conversation, then sends a second message from the bottom-docked composer and proves both the launch and the empty Native textarea.
