# Example Benchmark Navigation Design

## Goal

Classify Elk as a Vue Lynx benchmark beside the other production-scale ports,
and keep AI-facing design context owned by the example it describes.

## Website Navigation

- Keep the existing Benchmark order: TodoMVC, 7GUIs, HackerNews, AI Chat.
- Add Elk immediately after AI Chat in both English and Chinese sidebars.
- Remove the now-empty Showcase sidebar section.
- Keep the Elk card in the home-page “Try it for yourself” area because that
  area is an interactive entry point rather than the sidebar classification.

## Design Context Ownership

- Move Elk's root `.impeccable.md` to `examples/elk/.impeccable.md`.
- Move AI Chat's root `.impeccable.md` from current `main` to
  `examples/ai-chat/.impeccable.md` while integrating `main` into PR #196.
- Leave no example-specific `.impeccable.md` at the repository root.
- Preserve each file's contents; only its ownership and location change.

## Integration Strategy

Merge current `origin/main` into the PR #196 branch instead of rebasing its
published history. Resolve the add/add root `.impeccable.md` conflict by placing
both versions in their owning example directories. Preserve AI Chat and its
website entry from `main`, then place Elk after it.

## Verification

- Add a source-level regression check for both localized sidebar orders and the
  absence of a Showcase section.
- Assert that each example owns its `.impeccable.md` and the root file is gone.
- Build the website and Elk native bundle.
- Push the merge and navigation changes to PR #196, then verify Vercel Preview
  and the deployed native bundle.
