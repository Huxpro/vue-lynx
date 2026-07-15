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
