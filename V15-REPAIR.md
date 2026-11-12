# FSFM V15 repair

V15 is a focused repair release for desktop layout stability, window geometry, album navigation positioning, and rendering performance.

## Included repairs
- Remove universal scrollbar gutters and the hard left border on nested scrollbar tracks.
- Keep the album navigation fixed to the viewport by removing transforms from the page-shell entrance animation.
- Pre-render homepage ambient bubbles and reuse their sprites rather than rebuilding radial gradients on every animation frame.
- Cap homepage ambient redraws at 30 FPS while preserving movement speed.
- Reduce the album atmosphere canvas workload while retaining its layered amber look.
- Add regression tests for these repairs.
- Add a comment-only Pages CMS cache-refresh marker to `.pages.yml`. When this change reaches `main`, the push event should invalidate that branch's cached config without changing parsed settings.

## Visual confirmation still needed
The widget positions appear to have been saved in browser storage rather than represented by a distinct default arrangement in the repository. Do not replace existing saved positions until the intended desktop arrangement has been confirmed visually.

## Validation
Run the complete test suite, static checks, production build, and release audit. Desktop visual confirmation remains necessary before merging.
