# Screenshot comparisons — Elk on Lynx vs original Elk

Both columns are captured at 390×844 (mobile viewport) against the **same
live instance (mas.to)** minutes apart: the left column is this example
running on **Lynx for Web** (`dist/main.web.bundle` inside
`@lynx-js/web-core`'s `<lynx-view>`), the right column is the original
**elk.zone** in Chromium. Because both talk to a live timeline, the posts
shown differ — compare the anatomy, not the content.

Captured with the scripts in [`../harness/`](../harness/). See
[PORTING.md](../PORTING.md) for what was reused vs rebuilt.

| Surface | Elk on Lynx | Original Elk (elk.zone) |
| --- | --- | --- |
| Local timeline | ![lynx local](./lynx/01-local.png) | ![elk local](./elk/01-local.png) |
| Federated timeline | ![lynx federated](./lynx/02-federated.png) | ![elk federated](./elk/02-federated.png) |
| Explore — trending posts | ![lynx explore](./lynx/03-explore.png) | ![elk explore](./elk/03-explore.png) |
| Explore — trending hashtags | ![lynx tags](./lynx/03b-explore-tags.png) | ![elk tags](./elk/03b-explore-tags.png) |
| Search ("vuejs") | ![lynx search](./lynx/04-search.png) | ![elk search](./elk/04-search.png) |
| Settings | ![lynx settings](./lynx/05-settings.png) | ![elk settings](./elk/05-settings.png) |
| Thread / status detail | ![lynx thread](./lynx/06-thread.png) | ![elk thread](./elk/06-thread.png) |
| Account profile | ![lynx account](./lynx/07-account.png) | ![elk account](./elk/07-account.png) |
| Dark mode | ![lynx dark](./lynx/08-dark-local.png) | ![elk dark](./elk/08-dark-local.png) |

Lynx-only captures (no same-frame Elk counterpart):

| Surface | Elk on Lynx |
| --- | --- |
| Fullscreen media preview | ![lynx media preview](./lynx/09-media-preview.png) |
| Hashtag timeline | ![lynx tag](./lynx/10-tag.png) |
| Trending news (explore) | ![lynx news](./lynx/03c-explore-links.png) |
| Edit history + quote post | ![lynx edit history](./lynx/12-edit-history.png) |

## Known visual deltas (intentional or tracked)

- Elk shows a **Sign in** button in the guest header; the port keeps
  sign-in in Settings (token-based, no OAuth server — see PRD).
- Elk's action bar includes a **quote** button (Mastodon 4.5); quote posts
  are still a todo in the PRD.
- Elk renders unicode emoji as twemoji images; the port uses native color
  emoji glyphs (deliberate — see PRD "Content rendering").
- Elk's guest bottom nav has 4 items (…-menu last); the port promotes
  Search and Settings into the bar.
- Fonts differ slightly (Elk ships webfonts; Lynx uses system fonts).
