---
"create-vue-lynx": patch
---

Rewrite `workspace:*` dependency specs to real semver ranges at scaffold time. Previously, scaffolded apps outside the monorepo inherited `"vue-lynx": "workspace:*"` and failed `npm install` / `pnpm install` with `EUNSUPPORTEDPROTOCOL`. The build now snapshots resolved workspace versions into `dist/versions.json` (regenerated on `prepack`, so published tarballs are always in sync), and any `workspace:` spec that still slips through falls back to `latest`.
