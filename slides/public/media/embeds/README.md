# Embed media drop-ins

Drop the files below into this directory (exact names). Every slot renders a
labeled placeholder until its file exists — no HTML edits needed, just refresh.
Names are anchored to the slide numbers used while authoring.

| File | Where | Shape |
| ---- | ----- | ----- |
| `02-video-1.mp4` | over the React + Vue marks — first clip of the cascade | landscape, muted loop |
| `02-video-2.mp4` | second clip of the cascade | landscape, muted loop |
| `02-image.png` | the snapshot that completes the cascade | photo, ~960×1198 |
| `88-meme.png` | the "getting metaphysical" / 雪碧 roast intermission | ~1024×610 |
| `79-vibe-coding.png` | the Karpathy vibe-coding tweet over the ∞ divider | ONE full-height screenshot (~860×1024) — the slide crops top half, then pans to the bottom half |
| `103-photo-1.png` | Germany three-up, left snapshot | portrait-ish |
| `103-video-portrait.mp4` | Germany three-up, center | vertical (9:16), muted loop |
| `103-photo-2.png` | Germany three-up, right snapshot | portrait-ish |
| `103-video-wide.mp4` | the Pokémon clip, full width | landscape, muted loop |

The PWA-talk slide embeds `https://huangxuan.me/pwa-qcon2016/#/` live — no
file needed, but it wants venue network (its frame has an ↗ open-in-new-tab
fallback).

Video defaults: muted + looping + autoplay-on-arrival, reset (paused, rewound)
on every slide change. Add `unmuted` / `no-loop` / `controls` attributes or
`data-autoplay="false"` on the `<vl-media>` in `index.html` to change that
per embed.
