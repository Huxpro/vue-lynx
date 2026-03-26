# vue-lynx

Vue 3 custom renderer for building [Lynx](https://lynxjs.org) apps.

> [!WARNING]
> **Pre-Alpha** — Expect bugs and enjoy! 

[![Pre-Alpha](https://img.shields.io/badge/status-pre--alpha-orange)](https://vue.lynxjs.org)
[![Website](https://img.shields.io/badge/docs-vue.lynxjs.org-blue)](https://vue.lynxjs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)

## Documentation

Visit **[vue.lynxjs.org](https://vue.lynxjs.org)** for full documentation, including:

- [Introduction](https://vue.lynxjs.org/guide/introduction)
- [Quick Start](https://vue.lynxjs.org/guide/quick-start)

## Examples

See the [`examples/`](examples/) directory. All examples can be run with:

```bash
cd examples/<name>
pnpm install
pnpm dev
```

#### Tutorials

- [`gallery`](examples/gallery) — Photo gallery ([tutorial](https://vue.lynxjs.org/guide/tutorial-gallery))
- [`swiper`](examples/swiper) — Swiper component ([tutorial](https://vue.lynxjs.org/guide/tutorial-swiper))

#### Vue Features

- [`hello-world`](examples/hello-world) — Minimal starter
- [`basic`](examples/basic) — Core features (events, refs, reactivity)
- [`reactivity`](examples/reactivity) — `reactive()`, `toRefs()`, and composables
- [`option-api`](examples/option-api) — Options API
- [`v-model`](examples/v-model) — `v-model` binding
- [`slots`](examples/slots) — Slots and scoped slots
- [`provide-inject`](examples/provide-inject) — `provide()` / `inject()`
- [`suspense`](examples/suspense) — Suspense and async components
- [`transition`](examples/transition) — `<Transition>` and `<TransitionGroup>`
- [`css-features`](examples/css-features) — CSS selectors and features
- [`main-thread`](examples/main-thread) — Main thread script
- [`networking`](examples/networking) — Network requests and data fetching

#### Ecosystem

- [`vue-router`](examples/vue-router) — Vue Router integration
- [`pinia`](examples/pinia) — Pinia state management
- [`tailwindcss`](examples/tailwindcss) — Tailwind CSS styling

#### Benchmarks

- [`todomvc`](examples/todomvc) — TodoMVC
- [`7guis`](examples/7guis) — 7GUIs benchmark tasks
- [`hackernews-tailwind`](examples/hackernews-tailwind) — HackerNews

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

## License

[Apache-2.0](LICENSE)
