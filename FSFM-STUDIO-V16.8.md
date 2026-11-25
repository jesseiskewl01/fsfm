# FSFM Studio V16.8: Night Workshop

## Product direction

V16.8 is a full interface and usability refinement of the local FSFM Studio. It preserves the existing content model, renderers, authenticated local API, revision checks, local-save workflow, publishing queue and explicit live-deploy confirmation.

## Workspace and navigation

- Reworked the Studio visual language around a near-black plum foundation, deep violet surfaces and restrained luminous lavender accents.
- Increased typography, control sizes, spacing and surface contrast for easier scanning and editing.
- Added page search across page names and routes.
- Made page status and selection more legible, including a synchronised status for the currently open record.
- Changed building-block disclosure so the first block opens initially and the remaining blocks stay collapsed until needed.
- Added responsive layouts for full desktop, compact desktop/tablet, mobile and narrow phones.
- Preserved keyboard focus visibility and reduced-motion preferences.
- Restyled the protected sign-in and first-run password screens to match the same visual identity without changing authentication behaviour.

## Preview

The Desktop preview now uses a true 1440 × 900 CSS viewport (1442 × 902 outer iframe dimensions including its border). This exceeds the homepage Vista desktop gadget requirement of 1320 × 700, so the desktop-only gadgets render in the preview. The preview wrapper scrolls horizontally and vertically when the selected device is larger than the available pane.

Tablet remains a 768 × 1024 content viewport (784 × 1040 outer frame). Mobile remains a 390 × 844 content viewport (406 × 860 outer frame).

## Page availability

Page publication state now lives in `studio/page-state.mjs` and is shared by the UI and unit tests. An inactive page explicitly offers **Reactivate page**; an active page explicitly offers **Deactivate page**. The action is checked against the current record state before it is applied. A stale or mismatched action is rejected and the UI is refreshed instead of applying the inverse operation.

The homepage remains protected. Page availability edits remain local until the user saves locally and separately confirms a live deployment.

## Verification

- Unit tests exercise the inactive Vista activation/deactivation transition and homepage protection.
- Preview tests verify that desktop dimensions cross the real homepage gadget breakpoint, while tablet and mobile retain their established dimensions.
- Design-system tests cover the palette, responsive breakpoints, page search, keyboard focus and progressive disclosure.
- Existing content editor, authentication, Studio smoke, production build and output-audit checks remain in the CI pipeline.
