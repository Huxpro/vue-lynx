# Elk on Lynx — PRD & Feature Parity Checklist

Port of [Elk](https://github.com/elk-zone/elk) (a Mastodon web client built on Nuxt) to
**Vue Lynx** as a native-client example. Elk's framework-agnostic layers (masto.js API
client, content parser, domain logic, caching, theme) are **reused**; everything
DOM/Nuxt-specific (templates, routing glue, storage, virtual scrolling) is **rebuilt**
on Lynx primitives. See [PORTING.md](./PORTING.md) for the reuse-vs-rewrite rationale.

Status legend:

- ✅ ported — implemented in this example and verified on Lynx for Web
- 🚧 partial — implemented with reduced scope (noted)
- ⬜ todo — planned, not yet implemented
- ❌ not suitable — impossible or unsuitable for Lynx, with reason

## Architecture

```
Elk Shared (reused, ported to src/shared + src/composables)
├── masto.js API client        ✅ (masto ^7, REST; anonymous + token auth)
├── domain models              ✅ (mastodon.v1.* types from masto)
├── Pinia stores / module refs ✅ (module-scope refs, mirrors Elk auto-imports)
├── composables                ✅ (paginator, cache, account/status helpers, timeline filters)
├── content parser             ✅ (ultrahtml AST pipeline, near-verbatim)
├── formatting utilities       ✅ (handles, display names, time-ago, numbers)
└── theme palette              ✅ (Elk default theme CSS vars)

Elk Web = Nuxt + DOM components        → not forked
Elk Lynx = this example (examples/elk) → fresh Vue Lynx shell
├── Lynx templates (<view>/<text>/<image>/<list>)
├── vue-router (memory history) + custom nav shell
└── content renderer retargeted to Lynx elements
```

## Feature checklist

### Core infrastructure

- ✅ masto.js REST client (`createRestAPIClient`) — reused as-is
- ✅ Anonymous/guest browsing of any public instance (Elk's `publicServer` mode; default server `m.webtoo.ls` like Elk — mastodon.social requires auth for public timelines since 4.5)
- 🚧 Sign-in with access token (manual token entry; no OAuth redirect)
- ❌ OAuth web-redirect sign-in — requires Elk's Nitro server broker (`server/api/[server]/login.ts`) + browser `location.href` redirects; a Lynx app has neither a bundled server nor a browser redirect flow. Token-paste covers authenticated use.
- ❌ Multi-account switching with `window.location.reload()` — browser-only mechanism; single session per launch instead
- ✅ Status/account LRU cache (Elk `cache.ts`, ported without lru-cache dep)
- ❌ IndexedDB persistence (`idb-keyval`) — no IndexedDB in the Lynx JS runtime; in-memory session state instead
- ❌ Streaming timelines (WebSocket `createStreamingAPIClient`) — Lynx JS runtime has no WebSocket; guest mode does not stream in Elk either. Pull-to-refresh replaces live updates.
- ❌ PWA: install prompt, service worker, offline cache, web push, badge — browser platform features, N/A for a native client

### Navigation & shell

- ✅ vue-router with `createMemoryHistory` (Elk uses Nuxt file routing — rebuilt as explicit route table)
- ✅ Left/bottom navigation (Elk `NavSide`/`NavBottom` → Lynx bottom tab bar; native apps use bottom tabs)
- ✅ Back navigation on subpages (Elk relies on browser back)
- ✅ Page title header (Elk `NavTitle`/`MainContent` header)
- ❌ Nav footer (about/settings shortcuts) — desktop-sidebar surface; Elk mobile doesn't show it either
- ❌ Command palette (Cmd+K `command/`) & magic keys shortcuts overlay — keyboard-centric, no hardware keyboard assumption on touch devices
- ❌ `useHead` document titles/meta/OG tags — no document in Lynx

### Timelines

- ✅ Public/federated timeline (`v1.timelines.public`)
- ✅ Local timeline (`public.list({ local: true })`)
- 🚧 Home timeline (requires token; implemented, verified against API shape only)
- ✅ Infinite scroll via masto `Paginator` (Elk `usePaginator` core reused; DOM `useElementBounding` trigger → Lynx `<list>` `scrolltolower` event)
- ✅ Native virtualized scrolling (Elk uses `virtua` DOM virtual scroller → Lynx `<list>` native recycling)
- ✅ Timeline filtering/reordering (Elk `timeline.ts`: hide replies/boosts prefs, thread reorder — reused verbatim)
- 🚧 Refresh (header refresh button recreates the paginator; replaces Elk's streaming prepend. Native pull-to-refresh gesture not wired)
- 🚧 Bookmarks timeline (page + route built on the shared paginator; requires token to exercise)
- 🚧 Favourites timeline (page + route built on the shared paginator; requires token to exercise)
- ❌ Conversations/DM timeline — requires auth + streaming for liveness; low value in demo scope (API supported, could be added)
- ❌ Scheduled posts management — auth-only editor flow built on TipTap; out of scope with the editor

### Status card (the core UI)

- ✅ Account line: avatar, display name with custom emoji, handle, relative timestamp
- ✅ Content rendering via Elk's parser (see Content rendering)
- ✅ Boost (reblog) wrapper card with booster attribution
- ✅ Reply-context line ("replying to @…")
- ✅ Media attachments: images (aspect-ratio preserved, grid for multiples)
- 🚧 Video/gifv/audio attachments — static preview image + type badge; no inline `<video>`/`<audio>` element in Lynx web-elements set used here
- ✅ Content warning / spoiler fold (tap to expand)
- ✅ Sensitive media blur/tap-to-reveal
- 🚧 Polls (options, percentages, votes count, expiry; vote POST auth-gated) — logic ported from Elk, no live poll appeared in test timelines to exercise rendering
- ✅ Action bar: reply, boost, favourite, bookmark counts
- 🚧 Action mutations (fav/boost/bookmark POST) — implemented with optimistic updates (Elk `useStatusActions` logic), requires token; verified UI-only
- ✅ Preview cards for links (card image, title, description)
- ✅ Quote posts (Mastodon 4.5 `status.quote.quotedStatus` → nested card like Elk's StatusQuote; verified live)
- ❌ Emoji reactions row — glitch-soc/fedibird extension, not vanilla Mastodon API; no test instance to exercise
- ❌ Embedded iframe media players (YouTube/video embeds via `sanitizeEmbeddedIframe`) — no iframe/webview element in Lynx
- ❌ Status translation (browser `Translator` API / server LibreTranslate proxy) — browser/server-only APIs
- ✅ Edit history viewer (edited badge on thread page → `history.list()` versions; verified live)
- ✅ Tap status → thread page navigation

### Thread / status detail

- ✅ Status detail page with ancestors/descendants (`v1.statuses.$select(id).context.fetch`)
- ✅ Main status emphasized (larger text, full timestamp)
- ✅ Nested reply indentation / connection lines (simplified vs Elk's connector art)

### Account / profile

- ✅ Profile header: banner image, avatar, display name (emoji), handle, bio (rich content)
- ✅ Stats row: posts / following / followers counts
- ✅ Fields/metadata table (with verified-link highlight)
- ✅ Account posts tab (`v1.accounts.$select(id).statuses`)
- ✅ Posts / Posts+Replies / Media tabs
- ✅ Following / Followers lists (tappable stats on profile → paginated account list)
- 🚧 Follow/unfollow button (needs token; UI + optimistic logic ported)
- ❌ Account hover cards (`AccountHoverWrapper`, floating-vue) — hover doesn't exist on touch; tap navigates to profile instead
- 🚧 Bot/locked indicators next to display name (moved-account banner not ported)
- ❌ Profile editing (avatar crop via `vue-advanced-cropper`, `browser-fs-access` file pickers) — DOM file/canvas APIs unavailable

### Notifications (auth required)

- 🚧 Notifications timeline with type icons (follow/favourite/reblog/mention/poll/update) — implemented against API shape; requires token to exercise live
- ⬜ Grouped notifications (Elk's GroupedNotifications algorithm) — auth-only surface, not exercisable in this environment; ungrouped list ships instead
- 🚧 Notification filters (All / Mentions tabs via `types` param; auth-gated)
- ❌ Web Push notifications — browser Push API, N/A

### Search & explore

- ✅ Search page: accounts / hashtags / statuses (`v2.search`, debounced — Elk `useSearch` reused)
- ✅ Explore: trending posts (`v1.trends.statuses`)
- ✅ Explore: trending hashtags (`v1.trends.tags`) with usage sparkline numbers
- ✅ Explore: trending links (News tab: provider, title, description, thumbnail)
- ✅ Hashtag timeline page (`v1.timelines.tag`; verified incl. CJK tags + remote instance content)
- 🚧 Follow hashtag button (auth-gated; on tag page header)

### Publish / compose (auth required)

- 🚧 Compose box: plain-text editor, character counter (500 limit via Elk logic), visibility picker, reply target — native `<textarea>`; posts via `v1.statuses.create`
- ❌ TipTap rich-text editor (mention/hashtag/emoji autocomplete popups, code blocks) — TipTap is contenteditable/ProseMirror, hard DOM dependency
- ❌ Media upload with crop/resize — Elk resizes via `<canvas>`/`Image` and `browser-fs-access`; no file picker / canvas in Lynx demo scope (native file modules exist but are host-app specific)
- ❌ Polls composer — compose sub-feature built on the TipTap editor stack (see rich-text editor); plain-text compose ships without it
- ❌ Drafts persisted to localStorage — no localStorage; in-memory drafts only
- ❌ Threads composer (multi-post publish), scheduled posts — built atop the editor stack, out of demo scope

### Content rendering (the crown jewel — reused)

- ✅ Elk `content-parse.ts` pipeline reused near-verbatim: ultrahtml parse → sanitize (Mastodon allow-list) → transforms
- ✅ Custom emoji `:shortcode:` → inline `<image>` (Elk renders `<picture>`)
- 🚧 Unicode emoji → native glyph rendering (Elk swaps in twemoji SVG `<img>`; native font renders emoji already, twemoji images skipped deliberately)
- ✅ Mentions → tappable styled `<text>` linking to profile (Elk wraps in hover card — see Account)
- ✅ Hashtags → tappable styled `<text>` linking to tag timeline
- ✅ External links → tappable styled `<text>` (opens vie Lynx `openSchema`/no-op on web preview; ellipsis middle-truncation preserved)
- ✅ Inline markdown: `**bold**` / `*italic*` / `~~del~~` / `` `code` `` (Elk transform reused; styled `<text>` spans)
- ✅ Paragraphs, line breaks, blockquotes, lists (ul/ol/li), headings h1–h5 → `<view>`/`<text>` block mapping
- 🚧 Code blocks — monospace styled block (Elk uses Shiki syntax highlighting; Shiki's WASM/regex engines are too heavy for the Lynx JS runtime)
- ✅ Collapsed mention groups (`transformCollapseMentions` reused)
- ✅ HTML entity decoding (tiny-decode)
- ❌ `<bdi>`/`dir="auto"` bidi isolation — no bidi element in Lynx text; RTL text renders but without isolation
- ❌ `<ruby>` annotations — no ruby support in Lynx text

### Media

- ✅ Avatar images (rounded, `<image>` with placeholder bg)
- ✅ Attachment grid with aspect ratios
- 🚧 Fullscreen media preview modal (single image + alt text; Elk adds carousel/zoom)
- ❌ Blurhash progressive placeholders — Elk decodes blurhash to `<canvas>`; no canvas in Lynx. Solid placeholder color instead.

### Settings & preferences

- ✅ Settings page shell (interface prefs)
- ✅ Font size setting (Elk: CSS var `--font-size`)
- ✅ Dark/light theme toggle (Elk `vars.css` palettes as cascading Lynx CSS vars; verified vs Elk dark)
- ⬜ Theme color picker (Elk's 8 accent themes)
- ✅ Hide boosts / hide replies / hide alt indicator style prefs (drive `timeline.ts` filters)
- ❌ Language switcher UI + 42-locale i18n — deferred: vue-i18n works on Lynx but doubles demo scope; message catalog structure kept compatible (en-US strings inline)
- ❌ Profile/account settings, push notification settings — auth + browser features

### Accessibility & misc

- ❌ ARIA live regions / announcer (`aria/`) — DOM ARIA; Lynx exposes different a11y primitives (`accessibility-label`), applied on interactive elements where cheap
- ✅ Relative timestamps ("5m", "2d" — Elk `useTimeAgo` equivalent, no VueUse dep)
- ✅ Compact number formatting (1.2K, 3.4M — `Intl.NumberFormat` compact like Elk)
- ❌ Offline detection banner — browser `navigator.onLine`; N/A
- ❌ Sponsors/team pages, help preview, release notes — marketing surface, out of scope

## Verification

Every ✅ UI feature is verified on **Lynx for Web** (`dist/main.web.bundle` in
`@lynx-js/web-core` `<lynx-view>`), screenshotted with headless Chromium, and compared
side-by-side against the original Elk web UI (same underlying data where possible).
Comparisons live in [`screenshots/`](./screenshots/) with notes in PORTING.md.

## Loop log

- **Loop 1**: Repo research, Elk inventory (196 components / 55 pages / 50 composables mapped), PRD drafted, app scaffold builds for lynx+web targets.
- **Loop 2**: Shared layer + content renderer + full UI ported. Solved Lynx runtime landmines (hidden web globals → `source.define`, DOMParser-free entity decoding, no-URL sanitizer). Verified live on Lynx for Web against mas.to: timelines, explore, search, thread, account, settings.
- **Loop 3**: Screenshot comparison pipeline against the ORIGINAL elk.zone (transparent HTTPS relay so both apps run in the same sandbox against the same instance). Parity fixes from comparison: heart favourite icon (was star), stacked name/handle rows, vertical preview cards with wide images, Elk-style icon+primary headers, `Xmin` timestamps, full `@user@server` handles. Side-by-sides in screenshots/README.md.
- **Loop 4**: Dark mode (Elk palette, verified vs elk.zone dark), fullscreen media preview, quote-post nested cards, Following/Followers lists, Bookmarks/Favourites pages, hashtag timeline verified. PRD statuses trued up (pull-to-refresh ⬜, media modal 🚧).
- **Loop 5**: Deep links via Lynx globalProps (`initialPath`), explore News tab (trending links), timeline refresh button, follow-hashtag button, bot/locked badges. Verified News tab + deep-linked #caturday hashtag page.
- **Loop 6**: Edit-history viewer (verified on a live edited status — same capture also proves quote-post nested cards). Example README + preview image, app sources now typecheck clean (bundler-resolution tsconfig).
- **Loop 7**: Notification filter tabs (All/Mentions), final PRD true-up: every remaining ⬜/❌ now carries a reason. Confirmed the production build contains no verification-relay references.
- **Loop 8**: Website integration — `/guide/elk` showcase page (en+zh) with the `<Go>` embed (live Web preview tab + QR-code tab serving `main.lynx.bundle` to Lynx Go), sidebar "Showcase" section, home-page showcase card. Verified in the site dev server with live data and in the production `rspress build`.
