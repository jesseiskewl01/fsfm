# FSFM Studio V16.5: responsive preview workspaces

## Preview modes

Studio provides three real iframe viewport modes:

- Desktop: fills the available preview workspace.
- Tablet: 768 × 1024 CSS pixels inside a tablet frame.
- Mobile: 390 × 844 CSS pixels inside a phone frame.

The tablet and mobile frame borders are included outside the stated content viewport dimensions. The preview canvas scrolls horizontally and vertically when the selected device is larger than the available Studio panel, rather than shrinking the iframe and changing its responsive breakpoint.

Viewport controls have accessible labels and pressed state. The active viewport dimensions are announced in the preview header. Narrow layouts hide the dimension readout to preserve room for the device controls.

## Preview behaviour

The iframe continues to load the locally saved FSFM page through the shared production renderer. Switching viewport sizes does not save content, alter the publishing queue, or deploy anything. Unsaved content changes are not represented until the user chooses **Save local**.

Refresh reloads the current route while preserving the selected viewport. Open preview continues to open the route in a separate tab.

## Verification

Static tests verify all three viewport controls, accessible labels and pressed state, exact tablet/mobile viewport sizing, scrollable overflow, and the desktop fit-to-workspace behaviour. The full CI workflow still runs the complete project tests, TinaCMS audit, local Studio smoke test, production build and output audit.
