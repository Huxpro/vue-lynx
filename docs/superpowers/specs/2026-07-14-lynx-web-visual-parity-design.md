# Lynx for Web Visual Parity Design

## Goal

Make every supported example prove VDOM/Vapor visual parity in Lynx for Web,
and fix the Vapor static inline-style regression exposed by
`reactivity/main`.

## Visual verification

The existing example harness continues to run the same fixtures, actions, and
state assertions for both render modes. After a scenario reaches its final
checkpoint, it captures the `lynx-view` viewport at 390×844. For every entry
that supports Vapor, the harness compares the VDOM and Vapor PNGs from the
same run.

This is a pairwise comparison rather than a checked-in golden baseline. It
therefore detects mode drift without making browser upgrades or platform font
changes look like application regressions. Pixel comparison tolerates minor
per-pixel antialiasing differences, but fails when more than 0.1% of pixels
differ. A failure records the VDOM image, Vapor image, highlighted diff, pixel
count, and ratio under `artifacts/example-harness/visual/` and fails the
existing `examples:verify:web` command.

The harness waits for fonts and images and requires two consecutive captures
to be stable before using an image. If an entry remains animated, its scenario
may define narrowly scoped masks; supported entries are never silently exempt
from visual verification.

## Runtime correction

Vapor compiles static `:style` object literals into a template `style`
attribute. The DOM shim currently parses that attribute literally, producing
Lynx style objects such as `{ "margin-bottom": "12", padding: "16" }`.
VDOM instead normalizes the original object to camelCase keys and pixel-valued
strings. The two paths therefore emit different `SET_STYLE` payloads.

Static template style parsing will use the same Lynx normalization rules as
VDOM:

- kebab-case names become camelCase Lynx property names;
- numeric dimensional values receive `px` when auto-pixel conversion is
  enabled;
- dimensionless values and CSS custom properties remain unitless;
- existing explicit units and multi-value declarations remain unchanged.

The normalization lives in one focused runtime module shared by VDOM
`patchProp` and Vapor template parsing so the paths cannot drift again.

## Tests and acceptance

Unit tests cover equal PNGs, a deliberate layout difference, emitted diff
artifacts, static style parsing, camelCase conversion, pixel conversion, and
dimensionless values. The `reactivity/main` pair is the integration regression
test: it must fail before the runtime correction and pass afterward.

Completion requires:

1. the example-harness unit suite passes;
2. runtime/upstream style tests pass;
3. all Vapor example builds pass;
4. all 36 supported VDOM/Vapor Lynx-for-Web pairs pass functional and visual
   parity;
5. failure diagnostics remain available in JSON and PNG form.
