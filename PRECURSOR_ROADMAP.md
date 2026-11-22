# FSFM Precursor Roadmap — Getting to One Working Version

> Created: 2026-11-21  
> Status: **active execution plan**  
> Relationship to other docs: `ROADMAP.md` is the strategic "what and why". This file is the near-term "what we literally do next, in what order, and how we know it worked". `WORK_LOG.md` tracks the currently active objective.  
> Do not overwrite `ROADMAP.md`.
>
> **ORDER CORRECTED 2026-11-22 by Jesse:** the building blocks and the architectural refurbishment come **before** Studio work. Studio sits on top of a house made of one material; it is not the tool used to paper over two different ones. TinaCMS is the **actual content backend** and Studio must call it. See §3.

---

## 0. Why this file exists

Jesse's seven-step list is correct in spirit but too compressed to execute safely. This file expands it with the steps that aren't obvious until you look at the actual repo: protecting unsaved work, choosing the canonical folder by evidence, building a test fixture, verifying the deploy chain, defining what "greenlight" actually means, and having a rollback.

**This is a precursor** because none of the strategic rebuilding (Roadmap Phases 3–8) should start until these foundations are settled.

---

## 1. Decisions already made — do not relitigate

| # | Decision | Evidence |
|---|---|---|
| D1 | **THE version is `v16-tinacms-prototype`** in `C:\Users\jesse\fsfm` | 156 commits ahead of `main`, 0 behind. Only checkout with `studio/`, `tina/`, `admin/`, `dist/`. |
| D2 | **`C:\Users\jesse\fsfm` is the canonical working directory** | It is the main repo (`.git` directory). `fsfm-main` and `fsfm-work` are linked worktrees (`.git` files pointing into `fsfm/.git/worktrees/`). |
| D3 | **TinaCMS is the actual content backend; Studio must call it** | Jesse chose the second option explicitly on 2026-11-22. This is a design requirement, not a preference. |
| D4 | **We do not rewrite or squash the 156 commits** | They were 105+26+25 small commits over 12–14 Nov, mostly content/test/polish. Ugly, harmless, and rewriting them is the risk. |
| D5 | **Archive, don't delete** | `archive/PROJECT_STATE.md` and `archive/PROJECT_LOG.md` created 2026-11-21. |
| D6 | **Jesse is the source of truth for goals; assistant is source of truth for mechanics** | Agreed 2026-11-21. |

---

## 2. The step nobody listed: protect the unsaved work

**Do this before anything else.** `C:\Users\jesse\fsfm` currently has uncommitted changes:

- modified: `content/v13/albums/the-early-bird.json`
- modified: `content/v13/homepage.json`
- modified: `content/v13/vista-pages/vistatest.json`
- untracked: `content/v13/albums/new-album.json`
- untracked: `content/v13/editorial-pages/new-editorial-page.json`
- untracked: `tina/tina-lock.json`

These are Jesse's work. They must be preserved deliberately, not swept up accidentally and not lost.

**Status: DONE 2026-11-22.** Created `rv26` from `v16-tinacms-prototype`; committed all six files as `245439b` "Preserve in-progress content and Studio work on rv26" (270 insertions, 12 deletions). Working tree clean; prototype branch untouched.

**Acceptance met:** every one of those six files is recoverable from git history.

---

## 3. The seven steps, expanded

> **Revised order (Jesse, 2026-11-22).** The original Step 4 (fix Studio) must **not** be done before the building-block architecture is real. The homepage and The Early Bird are two sturdy but different "mud huts"; the 18 blocks are concrete and rebar. We refurbish both huts into the same material first — homepage stops being a monolithic `index.html` rendering and becomes an assembly of shared blocks; the aurora becomes a configurable block rather than hardcoded canvas. **Only then** does Studio get built/fixed as the friendly frontend on top. Studio is the last layer, not the first.

**Corrected sequence:** Step 1 → Step 2 → **blocks/architecture (Roadmap Phases 3–5, including aurora)** → Studio as a real Tina client → local test → live test → greenlight.

### Step 1 — Unified directory

**Goal:** one place we work, which can eventually be committed to the repo.

**The non-obvious part:** it already exists. Don't copy 207 files into a new folder. Declare `C:\Users\jesse\fsfm` canonical and leave the worktrees alone as read-only reference.

**Actions**
1. Confirm the six unsaved files are protected (§2).
2. Declare `fsfm` canonical in `WORK_LOG.md`.
3. Create a clearly named working branch from `v16-tinacms-prototype` **DONE 2026-11-22: branch is `rv26`.**
4. Move the four planning docs (`ROADMAP.md`, `PRECURSOR_ROADMAP.md`, `WORK_LOG.md`, `archive/`) from `fsfm-main` into the canonical folder **as a separate, reviewable step** — not mixed with code changes.
5. Keep `fsfm-main` and `fsfm-work` untouched. They are evidence/reference, not trash.

**Acceptance:** a new session can be pointed at one path and do all work there.

**Risk:** accidentally treating the worktrees as disposable. They hold the Firefox evidence. Don't.

---

### Step 2 — Find THE version

**Status: answered.** See D1. No investigation needed beyond recording it.

**Acceptance:** D1 is written in the live docs and nobody asks this question again.

---

### Step 3 — The rebuilding / port

**Goal:** bring the chosen version into the unified line and start the real revitalisation.

**Important reframe:** we are not rebuilding from scratch. The 18 blocks, 4 templates, content pipeline and V16 Studio already exist. The work is *consolidation and promotion*, not reconstruction.

**Actions**
1. Branch from `v16-tinacms-prototype` (done in Step 1).
2. Verify the branch actually runs locally: Node version, `npm install`, build/preview scripts, tests.
3. Port the strategic foundations from `ROADMAP.md` in small, reviewable increments — starting with the aurora evidence/optimisation (Phases 1–2), because it is the only confirmed performance problem.
4. Keep every step reversible.

**Acceptance:** the canonical branch builds, tests pass, and it includes the V16 Studio work intact.

**Risk:** trying to do all of Roadmap Phases 3–8 at once. Don't. This step is about a safe starting line.

---

### Step 4 — Fix FSFM Studio

**Goal:** Studio becomes a reliable, friendly editor — not just an impressive prototype.

**What we already know about its current limits** (from the V16 docs):
- V16.1: the first version covered album content only; click-to-edit overlays, file uploads, Homepage/Vista/Editorial editors and a publish workflow were not included then.
- V16.3: **Save local** writes JSON to the local working tree. It does **not** commit, push, trigger Actions or change the live site.
- V16.5: the iframe preview loads the locally saved page through the shared renderer.
- V16.7: the Homepage cannot be deactivated, enforced in the API as well as the UI.
- V16.9: guided page-creation modal, enum dropdowns, real wallpaper catalogue, deeper Night Workshop polish.

**Actions**
1. Run Studio locally and inventory what actually works today versus what the docs claim.
2. Identify the concrete gaps that block "edit anything, publish safely" — especially the local-save → publish chain.
3. Fix in small increments, with a test for each.

**Acceptance:** the gaps are written down as a prioritised list, and the top blockers have fixes.

**Note:** "fix Studio" is currently vague. Part of this step is turning it into a specific list. I have not yet read the Studio source in detail — that comes when we start this step.

---

### Step 5 — Local testing (the real one)

**Goal:** prove the loop works before the public ever sees it.

**The non-obvious parts:** you need a disposable test page, and you need to verify *deployment* separately from *editing*.

**Actions**
1. Create a throwaway test page/album in Studio. Never use the real Early Bird record as the guinea pig.
2. Edit a block, save local, confirm the iframe preview updates.
3. Confirm the build pipeline sees the change: `npm run check:all` and `npm run predeploy-check`.
4. Check the publish configuration in `.fsfm-studio-deploy.json`:
   - target branch: `main`
   - publish roots: `content/v13`, `media`, `audio`, `lyrics`
   - workflow: `.github/workflows/deploy-pages.yml`
   - verification: `npm run check:all`, `npm run predeploy-check`
5. Confirm the UI is actually easy for Jesse — this is an acceptance test only you can do.

**Acceptance:** a complete local edit → save → build → preview loop, with a named test fixture, and Jesse says the UI feels manageable.

**Risk:** assuming "preview updated" means "deploy works". They are different systems. Test both.

---

### Step 6 — Commit and test LIVE

**Goal:** the same loop, on the real domain.

**Actions**
1. Agree the commit and push with Jesse first.
2. Push to the agreed branch, open/merge the PR deliberately.
3. Watch the GitHub Actions run complete; do not guess.
4. Verify the real subdomain serves the changed test fixture.
5. Confirm the three visual identities are intact on the live site.

**Acceptance:** the test change appeared live through the Studio → Git → Actions → subdomain chain, with no manual HTML editing.

**Risk / rollback:** before pushing, write down how to revert (revert commit or restore previous content file). Live testing without a rollback plan is not acceptable.

**Credential boundary:** `.fsfm-studio\auth.json` contains credentials. I will not open it. Live testing may need you to enter credentials yourself.

---

### Step 7 — Full greenlight

**Goal:** declare Studio the real editor, not a prototype.

**Greenlight requires ALL of these:**
- [ ] Jesse can change content through Studio without touching code
- [ ] The Git → Actions → subdomain chain has been observed working end to end
- [ ] A new page can be assembled from existing blocks
- [ ] Rollback has been tested or at least written down
- [ ] The three visual identities still look right on the live site
- [ ] The remaining Roadmap phases are re-prioritised with Jesse

**After greenlight:** onwards to Roadmap Phases 3–8 — shared visual foundations, single-source content definitions, deeper Studio UX, block portability, final QA.

---

## 4. Extra steps we need that weren't on the list

| Extra step | Why |
|---|---|
| **Safety net before step 1** | Six unsaved files in `fsfm` must not be lost or accidentally committed |
| **Rollback plan before step 6** | Live testing without a way back is reckless |
| **Disposable test fixture** | Never experiment on real content |
| **Separate verification of deploy from edit** | Preview working does not imply publishing works |
| **Port the aurora evidence** | The only confirmed performance problem should not be forgotten during consolidation |
| **Decision log** | This file's §1 stops us re-asking settled questions |
| **Doc relocation** | Planning docs must end up in the canonical folder, as its own reviewable change |
| **Working branch** | Keeps the 156-commit prototype intact while we work |

---

## 5. Decisions from Jesse — all answered

1. ~~Safety net for the six unsaved files~~ **DONE** — committed as `245439b` on `rv26`.
2. ~~Branch name~~ **DONE: `rv26`**.
3. ~~Move the docs into `fsfm`~~ **DONE**.
4. **Tina's role** — **DONE: Tina is the actual content backend; Studio must call it.**
5. **Order** — **DONE: blocks/architecture first, Studio last.**

Nothing is blocked on decisions now. The next real work is architectural, not Studio work. 🎛️
