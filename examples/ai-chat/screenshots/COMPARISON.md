# Screenshot comparison — original vs Vue Lynx port

Both columns captured at 1280×800.

- **Original**: the live [chat-template.nuxt.dev](https://chat-template.nuxt.dev/) (real Nuxt app with real AI models), driven headlessly.
- **Lynx**: this example running on **Lynx for Web** (`rspeedy dev` → `/__web_preview`), backed by the example's mock server (deterministic streams).

| Surface | Original | Vue Lynx port |
|---|---|---|
| Home (light) | ![original home](original/home.png) | ![lynx home](lynx/home.png) |
| Weather tool chat | ![original weather](original/weather.png) | ![lynx weather](lynx/weather.png) |
| Chart prompt | ![original chart](original/chart.png) | ![lynx chart](lynx/chart.png) |
| Markdown + code | ![original code](original/code.png) | ![lynx code](lynx/code.png) |
| Home (dark) | ![original dark](original/dark.png) | ![lynx dark](lynx/dark.png) |
| Search palette | ![original search](original/search.png) | ![lynx search](lynx/search.png) |
| Web-search tool | ![original websearch](original/websearch.png) | ![lynx websearch](lynx/websearch.png) |
| Share modal | ![original share](original/share.png) | ![lynx share](lynx/share.png) |
| Model select | ![original model select](original/model-select.png) | ![lynx model select](lynx/model-select.png) |
| Collapsed sidebar | ![original collapsed](original/collapsed.png) | ![lynx collapsed](lynx/collapsed.png) |
| Mobile home (390×844) | ![original mobile home](original/mobile-home.png) | ![lynx mobile home](lynx/mobile-home.png) |
| Mobile sidebar drawer | ![original mobile drawer](original/mobile-drawer.png) | ![lynx mobile drawer](lynx/mobile-drawer.png) |
| Mobile weather chat | ![original mobile weather](original/mobile-weather.png) | ![lynx mobile weather](lynx/mobile-weather.png) |

## Reading the pairs

**Home (light/dark)** — sidebar structure (logo + wordmark, collapse toggle, New chat/Search with
active-route highlight, login footer), the greeting, prompt box (paperclip, model select,
rounded send button, placeholder text) and the quick-chat pills all line up. Detail differences:
the original loads the *Public Sans* webfont (Lynx renders the system sans), pill icon glyphs are
identical Iconify sources, and Lynx's panel corners/borders are marginally heavier.

**Weather chat** — user bubble right-aligned, "Thought for 1 second" collapsed reasoning row,
gradient weather card with current conditions + 5-day forecast, streamed markdown summary,
message actions (copy/vote/regenerate) and the sidebar title all match. The mock's seeded data
happened to generate the same 17° foggy Bordeaux as the live model run — coincidence, but a
handy one.

**Chart prompt** — the live model chose to ask clarifying questions instead of calling its chart
tool on this run (tool use is non-deterministic on the live demo), so the original screenshot
shows a text response; the port's deterministic mock always renders the chart card
(SVG polylines + legend + tap-tooltip, styled after the original's Unovis chart).

**Markdown + code** — ordered/unordered lists, bold, inline code chips and fenced code blocks
with syntax highlighting. The original highlights with Shiki grammars; the port uses a
lightweight regex tokenizer with github-ish token colors, so colors are similar but not
token-identical.

**Search palette** — the original's ⌘K modal vs the port's overlay: same input header, grouped
results. The original dims the page behind the modal with a translucent backdrop; translucent
overlay backgrounds don't composite on the Lynx web platform, so the port fades the underlying
content instead (see PORTING.md "Platform learnings" #4).

**Web-search tool** — collapsed "Searched the web" row with the query suffix, and source pills
(domain + external-link arrow). The original inlines the pills into the markdown via MDC
`:source-link` components; the port renders them as a row after the text (PRD F3.10 note).
Favicons come from Google's favicon service, which the sandboxed verification browser can't
reach — the pills degrade to text.

**Share modal** — same two-option visibility control ("Keep private" selected, "Shared"),
title/description and close affordance; the original dims with a translucent backdrop, the port
fades the content behind (platform note above).

**Model select** — USelectMenu dropdown vs action-sheet: same items, provider icons and
selected checkmark; a sheet replaces the anchored popover (no anchored portals on Lynx).

**Collapsed sidebar** — both collapse to an icon rail (logo hidden, icon-only nav, avatar/login
footer).

**Mobile (390×844)** — the original goes responsive through Tailwind's `lg:` breakpoint
(full-bleed panel, hamburger toggle, slide-over sidebar). Lynx has no viewport media queries, so
the port branches on `SystemInfo.pixelWidth / pixelRatio` at startup: same full-bleed panel,
hamburger in the navbar, slide-over drawer (with close button and content dim), stacked
quick-chat pills, and tighter paddings. The drawer state in the original screenshot shows an
empty history because the live demo session was fresh.