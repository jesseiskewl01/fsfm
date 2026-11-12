# V14 deployment

V14 builds the website into `dist/`. The production workflow runs the tests, validates the content, builds the site, audits the output, uploads the generated `dist/` directory, and deploys that artifact to GitHub Pages.

## One-time GitHub Pages setting

Before merging the V14 pull request:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, change **Deploy from a branch** to **GitHub Actions**.
4. Leave the configured custom domain (`fsfm.port82.net`) in place.

GitHub Pages must use **GitHub Actions** as its publishing source for the `actions/deploy-pages` workflow to publish the generated `dist/` directory. The existing branch-root publishing mode serves the old root-level HTML and does not run the V14 build.

## After the V14 merge

- The merge to `main` triggers `.github/workflows/deploy-pages.yml`.
- The workflow runs `npm run check:all`, then `npm run predeploy-check`.
- Only if both pass does it upload `dist/` and deploy it.
- Pages CMS commits to `main` trigger the same workflow, so editing content in Pages CMS continues to publish automatically.
- Generated output stays out of Git; `dist/` remains ignored.
- The build copies the custom-domain `CNAME` file and Google ownership-verification file into `dist/`.

## Before the first production deployment

- The temporary `vistatest` record is kept unpublished and hidden from navigation in the V14 branch.
- Confirm the custom domain remains configured in **Settings → Pages**.
- Check the successful deployment URL and test the homepage, album route, page menu, media player, audio, lyrics, and wallpaper after deployment.

## Rollback

If the first Actions deployment needs to be rolled back, the Pages publishing source can be switched back to **Deploy from a branch → main → /(root)**. That restores the previous root-level site while the V14 workflow and source changes remain in the repository. Re-enable GitHub Actions as the source before retrying V14 deployment.
