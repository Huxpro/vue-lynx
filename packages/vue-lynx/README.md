# vue-lynx

Vue 3 custom renderer for building [Lynx](https://lynxjs.org) apps.

> [!WARNING]
> **Pre-Alpha** — Expect bugs and enjoy! 

[![Pre-Alpha](https://img.shields.io/badge/status-pre--alpha-orange)](https://vue.lynxjs.org)
[![Website](https://img.shields.io/badge/docs-vue.lynxjs.org-blue)](https://vue.lynxjs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)

## Documentation

Visit **[vue.lynxjs.org](https://vue.lynxjs.org)** for full documentation, including:

- [Introduction](https://vue.lynxjs.org/guide/introduction.html)
- [Quick Start](https://vue.lynxjs.org/guide/quick-start.html)
- [Gallery Tutorial](https://vue.lynxjs.org/tutorials/gallery.html)
- [Swiper Tutorial](https://vue.lynxjs.org/tutorials/swiper.html)

## IDE Setup

Install the [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension for VS Code, or the equivalent for your editor (Zed has built-in Vue support via its Vue extension).

Add the following to your `tsconfig.json` (or `jsconfig.json` for JS projects):

```json
{
  "compilerOptions": {
    "types": ["vue-lynx/types"]
  },
  "vueCompilerOptions": {
    "plugins": ["vue-lynx/types/volar-plugin"]
  }
}
```

This enables:
- Correct prop types and completions for all Lynx elements (`<view>`, `<text>`, `<image>`, etc.)
- IDE errors when using unsupported event modifiers (`.capture`, `.passive`)
- Type-checked `global-bind*`, `global-catch*`, and `main-thread-*` props

Projects created with `create-vue-lynx` have this pre-configured.

## Examples

See the [`examples/`](examples/) directory for complete working examples:

- [`hello-world`](examples/hello-world) — Minimal starter
- [`basic`](examples/basic) — Core features (events, refs, reactivity)
- [`reactivity`](examples/reactivity) — `reactive()`, `toRefs()`, and composables
- [`todomvc`](examples/todomvc) — TodoMVC with CSS Selectors
- [`option-api`](examples/option-api) — Options API style
- [`vue-router`](examples/vue-router) — Vue Router integration
- [`pinia`](examples/pinia) — Pinia state management
- [`suspense`](examples/suspense) — Suspense API
- [`tailwindcss`](examples/tailwindcss) — Tailwind CSS styling
- [`gallery`](examples/gallery) — Photo gallery
- [`swiper`](examples/swiper) — Swiper component
- [`7guis`](examples/7guis) — 7GUIs benchmark tasks

## Contributing

```bash
git clone https://github.com/Huxpro/vue-lynx.git
cd vue-lynx
pnpm install
pnpm build
```

### Scripts

| Command | Description |
| --- | --- |
| `pnpm build` | Build all packages (internal, runtime, main-thread, plugin) |
| `pnpm dev` | Watch mode for runtime, main-thread, and plugin |
| `pnpm test` | Run tests (testing-library) |
| `pnpm test:upstream` | Run upstream Vue compatibility tests |
| `pnpm test:dev-smoke` | Run dev smoke tests |
| `pnpm lint` | Lint with Biome |

### Run examples locally

```bash
cd examples/basic
pnpm install
pnpm dev
```

## License

[Apache-2.0](LICENSE)
