# Elk on Lynx — native viewpager variant

A fork of the [Elk example](../elk/) where the Explore
(Posts / Hashtags / News) and Notifications (All / Mentions) tabs are
backed by the **native viewpager element** instead of conditionally
rendered panes: tab panes swipe horizontally with a native snap
animation, keep their content and scroll position across swipes, and the
tab bar stays in sync in both directions (swiping fires the pager's
`change` event; tapping a tab drives the pager via the `selectTab` UI
method). See [`TabPager.vue`](./src/components/TabPager.vue).

Everything else — features, architecture, porting notes — is identical
to the original example; see its [README](../elk/README.md),
[PRD.md](../elk/PRD.md) and [PORTING.md](../elk/PORTING.md).

## Host requirements

The pager element is registered under different names per platform, and
`TabPager.vue` picks the right tag at runtime:

| Platform | Element | Status |
| --- | --- | --- |
| Lynx for Web | `<x-viewpager-ng>` (legacy XElement name) | works today |
| Native (OSS engine) | `<viewpager>` / `<viewpager-item>` | needs a host built from [lynx-family/lynx](https://github.com/lynx-family/lynx) develop after `c1d8d7920` (2026-04) — **not yet in any released LynxExplorer** (3.8.1 and earlier ship neither name) |

On a native host without the element, the tab area renders blank with
`LynxCreateUIException: viewpager ui not found` — prefer the original
[elk](../elk/) example there.

## Run

```bash
pnpm install
pnpm dev    # scan the QR code with LynxExplorer, or open the web preview
pnpm build  # dist/main.lynx.bundle + dist/main.web.bundle
```

The app talks to `https://<instance>` directly. Deep-link a route by
passing `globalProps: { initialPath: '/mas.to/tags/caturday' }` to the
LynxView (native) or `<lynx-view global-props=...>` (web).

### Web preview / screenshot harness

[`harness/`](./harness/) contains a minimal `@lynx-js/web-core` host page
plus Playwright capture scripts; `shot.mjs` additionally supports `swipe`
and intermediate-shot actions (manual CDP touch drags — headless
Chromium's `synthesizeScrollGesture` touch source is a no-op) used to
verify pager gestures on the web build.
