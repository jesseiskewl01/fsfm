# FSFM Studio V16.6: visual design system and editor usability

## Visual system

Studio retains the FSFM dark-purple visual direction and now uses shared design tokens for base backgrounds, raised surfaces, borders, text, muted text, accents and shadows. The same surface and control language is applied to the sidebar, page list, editor panels, nested fields, block cards, device preview, dialogs and notifications.

Buttons and interactive surfaces have consistent hover, pressed and keyboard-focus states. Form controls use shared focus rings and border treatment. Reduced-motion preferences disable non-essential transitions and animation.

## Progressive disclosure

Top-level page sections remain visible. Deeply nested objects inside template data, homepage gadgets, player settings, wallpaper presets and block content now open as accordions. This keeps large records navigable without removing access to any settings.

Arrays retain add/remove controls and ordered movement; page blocks retain their own enabled, remove and movement actions. Required blocks remain protected.

## Layout and responsive behaviour

The three-column workspace retains a navigation sidebar, editing canvas and live local preview. At smaller widths the layout moves to stacked regions and keeps forms usable. The responsive device previews use the fixed CSS viewport dimensions described in V16.5.

## Accessibility

Buttons, navigation items, preview controls and compact list actions expose keyboard focus styling. Preview controls announce their selected state. Reduced-motion settings are respected. Nested object details use native summary/details controls, so they remain keyboard operable.

## Scope

This stage changes Studio's presentation and progressive disclosure, not the FSFM content schema, page renderer, local-save behaviour or deployment protocol. The editor continues to read and write the same JSON records and uses the same validation and revision protections.
