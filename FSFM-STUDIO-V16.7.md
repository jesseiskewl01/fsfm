# FSFM Studio V16.7: page activation and deactivation

## Page availability

Each Album, Vista Window and Editorial page has a dedicated **Page availability** panel with an explicit **Deactivate page** or **Reactivate page** action. Both actions require confirmation and update the page's `publishing.published` field.

The page list displays an `ACTIVE` or `INACTIVE` state. Inactive pages remain in the content repository and can be edited and reactivated; they are excluded from the production page build.

## Homepage protection

The Homepage does not show an activation control. The authenticated content API also rejects a save that attempts to set the Homepage `publishing.published` value to `false`, so the protection does not depend on the browser UI.

## Save and deployment behaviour

Activation changes mark the current record as dirty. **Save local** writes the updated JSON to the local repository and refreshes the preview. The public site does not change at this point.

After saving, the usual **Save & deploy live** action is required to publish the state change. Deactivating a page removes it from the next production build; reactivating a page includes it again. The Stage 2 publisher's saved-file queue, production validation, explicit confirmation and GitHub Actions deployment remain unchanged.

## Verification

The CI smoke test creates a temporary Editorial draft, verifies it starts inactive, activates it, deactivates it again, and checks that the local API refuses Homepage deactivation. The temporary test page is removed during smoke-test cleanup. Static tests cover the page controls, status labels, homepage UI/API protections and local-save path.
