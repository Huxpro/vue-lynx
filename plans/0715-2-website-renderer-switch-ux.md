# The site-wide VDOM/Vapor renderer switch — UX decisions

Date: 2026-07-15. Replaces the switch that arrived with PR #209 (see
`0715-1-pr209-review-and-protocol-cleanup.md` for why it was rebuilt).
The site itself is the Vapor demo: every design decision below serves
"flip one switch, watch the whole site actually change, and always know
what did and didn't".

## End state

- **State**: one `render-mode-store` — localStorage-persisted
  (`vue-lynx:go-mode`), SSR-safe (`getServerSnapshot` → `vdom`), with
  `?go-mode=` as a deep-link override that wins on load but never
  overwrites the visitor's stored preference. Every handle — nav switch,
  per-example badge, ModeTabs — drives this one store; a spec test
  enforces that no component creates a second store.
- **Form**: a single on/off switch (`role="switch"`), VDOM = off. The
  active mode name lives in the track's free space ("VDOM" right of the
  knob when off, "Vapor" left of it when on). In Vapor state the track,
  the per-example badge, and the active ModeTab fill with the homepage's
  moving brand gradient (same stops and 6s drift as the hero `.brand`
  text) — the magical state borrows the site's own design language.
  Motion is reserved for *live renderer state*: the 36 matrix badges
  freeze the gradient to a static tint, and `prefers-reduced-motion`
  degrades everything to a static blend.
- **Presence**: the control renders on every doc page (not the home
  page) and dims (`data-dormant`, still functional, hover restores) when
  the page has nothing to switch. Popping in and out per page read as
  broken; a dead-looking toggle on API pages read as decoration — dimmed
  and explained beats both.
- **Feedback**: everything that responded to a flip (example cards,
  ModeTabs) pulses once with a 650ms gradient ring; fallen-back examples
  stay still — the switch's reach is visible at the moment of use.
- **Explanations live behind one ⓘ primitive** (`InfoPopover`,
  outside-click/Escape dismissal, opens down from the nav or up from the
  card footer): the nav chip merges the coverage count with the ⓘ
  ("2/3 ⓘ") and its popover explains the number, the scope ("switches
  examples and code tabs site-wide; prose never changes"), and links to
  the guide; fallback badges read just "VDOM only" with the reason in
  the popover. Rationale: `title` tooltips don't exist on touch, and
  inline reasons made badges long; aria-labels keep the text available
  to assistive tech.
- **Sizing tokens**: nav track and footer badge are exactly equal —
  22px tall, 10px type, ≥10px text inset — and the badge's off state
  uses the same soft-gray material as the off track. A `pointer: coarse`
  rule that inflated only the badge to 26px on phones was the root cause
  of "they don't look equal" feedback; touch targets are widened, never
  heightened (the nav bar caps height).

## Key decision — the switch's semantic scope

We explicitly rejected forking prose content on the toggle (the
vuejs.org API-preference pattern), for three reasons: Vapor is
experimental and shouldn't gate the newcomer funnel; the genuinely
divergent content is tiny by design ("inside components nothing
changes"); and prose that silently varies on hidden state is a
documentation anti-pattern unless heavily signposted.

The switch's semantic is **renderer preference, not documentation
version**: it changes everything *runnable or compiled* — live examples
and `<ModeTabs>`/`<ModeTab>` code groups (two-way synced: the switch
drives the active tab, clicking a tab drives the global mode — one
preference, two handles) — and never the narrative. Quick Start stays
vdom-canonical with a pointer to the Vapor guide. If Vapor reaches
stable and the support matrix approaches 45/45, the ModeTabs + store
machinery is already the substrate for a vuejs.org-style upgrade.

## Supporting work in the same arc

- `prepare-examples` auto-builds missing `dist-vapor/` exactly like
  `dist/` — without this the switch is a silent no-op on fresh checkouts
  (Vercel included).
- `__example-harness` is excluded from search and llms.txt but keeps
  building (verify-web loads it). Gotcha: the array passed to rspress's
  `modifySearchIndexData` **is** the runtime page data — blank the
  entries' searchable fields; splicing them breaks that route's SSG.
- The guide's hand-written 45-row support matrix became
  `<VaporSupportMatrix>`, generated client-side from
  `vapor-support.json` (summary line, All/Vapor/VDOM-only filter,
  localized reasons, same badge styling) — it can no longer drift from
  the verification output.
- The two benchmark pages left the sidebar (linked from the guide's
  Performance section); the Vapor guide gained a live demo up top and
  links in place of inline API/perf tables; the "Vapor Mode" sidebar
  item wears the brand gradient (`context: 'vapor'` →
  `data-context`); "Experimental" is an rspress `<Badge>`.

## Follow-ups

- `<VaporSupportMatrix>` is client-rendered; inject at build time if the
  table should be in static HTML for crawlers.
- ModeTabs have no per-group deep link (the global `?go-mode=` covers the
  common case).
- The footer badge slots into go-web's `rightFooter` — a documented prop
  of `@lynx-js/go-web@0.2.1`; re-check on go-web upgrades.
