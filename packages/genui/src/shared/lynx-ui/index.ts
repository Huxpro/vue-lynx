// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementations of the `@lynx-js/lynx-ui` primitives the
// genui catalogs depend on. The upstream package is ReactLynx-only; these
// shims match its DOM shape and `ui-*` state classes so the packaged CSS
// applies unchanged. Internal — not part of the public genui API.
export { UiButton, useUiButtonContext } from './button.js';
export { Radio, RadioGroupRoot, RadioIndicator } from './radio.js';
export { Checkbox, CheckboxIndicator } from './checkbox.js';
export { Input, TextArea } from './input.js';
export {
  DialogBackdrop,
  DialogContent,
  DialogRoot,
  DialogView,
} from './dialog.js';
export {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from './slider.js';
