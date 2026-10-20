# AnimaX Example

Plays a Lottie composition on `<animax-view>`, the AnimaX player that ships with Lynx, and drives it with `useAnimaX`.

## What it shows

- `<animax-view>` with `json`, `loop`, `autoplay` and `objectfit`, typed through `vue-lynx/types`
- `@ready`, `@update` and `@repeat` events (`update` fires only for frames subscribed with `subscribeUpdateEvents`)
- `useAnimaX(ref)`: `play`, `pause`, `resume`, `stop`, `seek`, `playSegment`, `isAnimating`, `getDuration`, `getCurrentFrame`

## Where the element comes from

- iOS and Android: the AnimaX xelement in Lynx (`LynxUIAnimaX`, `UIAnimaX`), registered under `animax-view`.
- Web: the host page imports `@lynx-js/web-core/animax`, which registers the `animax-view` custom element from `@lynx-js/animax`. Video layers also need `@lynx-js/animax-video`.

Without one of those the tag renders nothing; the rest of the page still works.
