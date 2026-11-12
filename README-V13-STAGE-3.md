# FSFM Website V13 — Stage 3: Shared renderer and component library

Stage 3 implements the shared static HTML renderer, component renderers, global page shell, SEO metadata, wallpaper layer/runtime and an isolated preview build. It does **not** yet replace the active V12 `index.html` or `the-early-bird.html` output.

## Build the Stage 3 previews

```sh
npm run build:v13:stage3-preview
```

Then serve `preview-v13-stage3/` locally and open `index.html`. The two preview pages are:

- `__preview__/shared-components.html` — Vista-style shared components, including the real Homepage marquee, artist statement, Spotify embed configuration, social links and Bandsintown settings, plus sample generic blocks.
- `__preview__/album-components.html` — Album Amber header/statement/Spotify presentation. Its player is intentionally a placeholder until Stage 4.

The preview has `noindex, nofollow` metadata and must not be deployed as the public site. Missing images are expected because the source archive contains only `.gitkeep` placeholders in `media/images/`; the production repository's media folder still needs merging.

## What the renderer provides

- A shared page shell with global identity/header, navigation, footer, responsive styles and template classes.
- Static, crawlable HTML for rendered sections.
- SEO title/description, canonical, robots, Open Graph and Twitter metadata.
- Schema.org JSON-LD for generic pages, the Homepage's MusicGroup identity and Album MusicAlbum metadata.
- Safe HTML escaping, URL validation and a deliberately limited Markdown renderer that does not interpret raw HTML.
- Shared component renderers for site header, hero, marquee, artist statement, embed window, Bandsintown events, social links, featured release, rich text, image, gallery, quote, link/button, divider and spacer.
- Album header and Spotify embed presentation; the dedicated FSFM Media Player remains for Stage 4.
- Shared Vista-window, Vista-desktop, editorial and amber presentation variants.
- Consecutive section grouping into responsive grid, stack or column layouts.
- Wallpaper presets/custom image support, sequential or random cycling, manual next control, visibility pausing and reduced-motion safeguards.
- A static server-rendered initial wallpaper for progressive enhancement when JavaScript is unavailable.

## Commands

```sh
npm run validate:v13
npm run test:v13
npm run build:v13:stage3-preview
```

The original `npm run build` command remains the V12 builder until the later Homepage/Album migration stages are complete. Do not interpret its output as a V13 production build.

## Stage boundary

Stage 3 is a renderer foundation and component preview, not the finished public website. Stage 4 will migrate the Album layout and implement the real synchronised player. Stage 5 will migrate the unique Homepage desktop and gadgets. The active public HTML is intentionally unchanged through this stage.
