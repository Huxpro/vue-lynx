# Deck framework

The **reusable slide engine** — content-agnostic, no Vue-Lynx specifics. Ported
in spirit from [hux.pro](https://hux.pro)'s `systems/` so the two decks can
converge on one framework and this deck can be embedded into hux.pro later. Not
published as a package yet; this folder is the boundary.

## What's in here (framework)

| Module          | Responsibility |
| --------------- | -------------- |
| `stage.js`      | Fixed 16:9 stage — scales the `.frame` design canvas to fit any viewport. `getScale()` feeds magic-move. |
| `magic-move.js` | FLIP engine — morphs matching `data-flip` elements between adjacent slides. |
| `flags.js`      | Per-slide flag vocabulary (`data-bg` / `data-transition` / `data-chrome`) + parsing. The DevTool and palette read this. |
| `command.js`    | Command Palette (`⌘K` / `/`). Runs against the deck controller. |
| `devtool.js`    | Inspector panel (`d`) — global config + current-slide flags/metadata, live overrides. |
| `icons.js`      | Shared inline icon set. |
| `framework.css` | Styles for the palette + devtool (uses the deck's design tokens). |

Everything here is driven through **one contract**: the `deckApi` controller
object built in `../main.js` (next/prev/goto, flags, theme/lang, overview,
blackout, speaker, stageScale, …) plus a `deck:change` DOM event. Swap the
controller and content and the framework is reusable elsewhere.

## The FLIP contract (magic-move.js)

A `data-flip` element **keeps its own layout while morphing** — the engine
must never change how the element is positioned or replace its transform:

- **Positioning**: the `.is-flipping` class must NOT set `position` (only a
  positioned box is needed, for z-index). The engine promotes *static*
  elements to `relative` via inline style and restores them at cleanup.
  Forcing `relative` from CSS yanks absolutely-positioned elements (logos,
  diagram blocks, thread lanes) into flow mid-morph: they tween from a wrong
  origin, then snap into place when the morph ends.
- **Transforms**: the FLIP delta is **composed with** the element's own
  computed transform (e.g. a `translate(-50%,-50%)` centering) and released
  back to it — never overwritten, which would shift the element by half its
  size for the duration of the morph.

Both rules are guarded by `slides/tests/morph-invariant.mjs`
(`pnpm test:morph`): it walks every adjacent slide pair sharing `data-flip`
ids, asserts each element's mid-morph rect stays inside the corridor spanned
by its source/target rects, and that it lands exactly where a fresh load of
the target slide puts it. Run it whenever you touch `magic-move.js`, the
`.is-flipping` styles, or add a new positioned flip-element type.

## What's *not* in here (deck content — lives in `src/`)

- `index.html` — the slides themselves
- `styles.css` — design tokens, typography, and per-slide-type layouts (the Vue
  Lynx design language)
- `main.js` — the **deck app entry**: builds the `deckApi` controller, owns the
  navigation state machine + boot, and wires framework → content
- `i18n.js`, `arch.js`, `meteors.js`, `speaker.*` — deck-specific content
  (translations, the layers-&-seams diagram, the beam background, speaker view)

## Known seam

`main.js` still hosts the navigation loop (slide state, hash, keyboard, speaker
sync). That's the next thing to lift into `framework/deck.js` (a `createDeck()`
factory returning the controller) for a fully clean split — deliberately left in
place so the working deck stays stable.
