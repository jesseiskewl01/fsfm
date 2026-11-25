# FSFM Studio V16.3: local save and live publishing

## The two save paths

**Save local** writes the edited record into the local repository working tree and refreshes the private preview. It does not commit, push, trigger GitHub Actions, or change the live website.

**Save & deploy live** first saves any unsaved editor changes, then asks for an explicit confirmation. The publisher creates a temporary Git worktree from the latest remote `main`, copies only files that FSFM Studio has saved, runs the same production checks used by the deployment workflow, creates one commit, and pushes that commit to `main`. The existing `deploy-pages.yml` workflow then validates, builds, and deploys the production site. The Studio only reports that publication has been handed to GitHub; the Actions run is the authority on whether the deployment succeeded.

## Safety boundaries

- The publisher never commits from the Studio development worktree. Your current branch, other edits, TinaCMS lock files, and unrelated untracked files are left alone.
- Only saved files under `content/v13/`, `media/`, `audio/`, and `lyrics/` enter the publishing queue.
- The queue is stored outside the repository in `%USERPROFILE%\.fsfm-studio\pending-deploy.json`, beside the Studio authentication data.
- Each queued file is recorded with a SHA-256 hash. Publishing stops if a file changes after its Studio save, and asks you to save it again.
- The temporary production worktree is based on the latest `origin/main`; if `main` advances before the push, Git rejects the non-fast-forward push. The publisher never force-pushes or resets a branch.
- The production worktree must pass `npm run check:all` and `npm run predeploy-check` before a commit is created.
- No GitHub token is stored in browser code or in the Studio profile. Publishing uses the Git credentials already configured for Git on this computer.
- A failed check, missing Git identity, missing credentials, branch protection rejection, or network error leaves the local files and publishing queue in place. No deployment is claimed as successful until GitHub Actions reports it.

## Production release gate

This V16 branch includes `.fsfm-studio-deploy.json`. The live-publishing control remains unavailable until that protocol marker and the verified GitHub Pages deployment workflow are present on remote `main`. This prevents a V16 Studio running from a development branch from trying to publish V16 content into an older production build.

The current branch is still under development. Do not expect the live-publishing button to unlock until the V16 release has been merged into `main`.

## Git requirements

The local project must have `origin` set to `https://github.com/jesseiskewl01/fsfm` (or the equivalent SSH URL), and Git must be able to fetch and push using the existing credential manager. Git also needs `user.name` and `user.email` configured to create the publication commit.

To inspect the result after pressing **Save & deploy live**, open the repository's **Actions** page. A successful push starts the existing Pages deployment workflow; a failed validation prevents deployment.
