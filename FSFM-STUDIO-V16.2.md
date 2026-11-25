# FSFM Studio V16.2

## Local use

Run \`npm run dev:tina\` and open \`http://127.0.0.1:3000/studio/\`. On first launch, create a Studio password with at least 12 characters. Later visits use the login screen.

## Authentication and storage

- The custom Studio and every album-content API endpoint require an authenticated session.
- The login cookie is HttpOnly and SameSite=Strict. Sessions expire after eight hours and are held in memory, so restarting the local server signs the browser out.
- Five failed password attempts trigger a 15-minute login lockout.
- Passwords are hashed with Node's scrypt and a random per-installation salt. The raw password is never written to disk.
- Authentication data is stored outside the repository in the current Windows user's \`%USERPROFILE%\\.fsfm-studio\\auth.json\` directory.
- The server binds only to a loopback interface. Authentication POST requests also require the exact local Studio Origin.
- The test suite uses a temporary authentication directory and removes it after the smoke test. It never creates or changes the real user's password.

## Save safety

- Authenticated saves retain the SHA-256 revision check and reject stale content.
- Album slugs remain locked because they determine the content filename and page URL.
- Saves write local JSON only. They do not commit, push or deploy.
- The existing FSFM preview builder remains responsible for rendering pages.

## Boundaries

This password protects the custom local FSFM Studio and its API. TinaCMS and Pages CMS retain their own account-level authentication and permissions; this local Studio password does not replace those provider controls. GitHub access and production deployment remain governed by the connected GitHub account and repository settings.
