# Post-V16 roadmap — ranked follow-up list **[Jesse + OpenCode, 2026-11-25]**

This is a new append-only roadmap compiled from the 19-point priority ranking after the V16 deployment. It does **not** replace `ROADMAP.md` or `PRECURSOR_ROADMAP.md`; those older documents stay untouched. As always, conversation says **parts**, code says `components`.

## Status legend

- **Confirmed** — Jesse checked it and it is fine.
- **Done locally** — implemented and committed on `rv26`, not pushed or deployed.
- **Rehearsed** — tested safely without changing live state.
- **Decision needed** — no implementation until Jesse chooses the product/security direction.
- **Deferred** — intentionally postponed; not a current blocker.
- **Inconsequential** — no practical need; ignore unless something visibly breaks.

## The ranked 19

1. **Deploy the three local fixes after visual sign-off — Confirmed, awaiting unlock.** Lyric glow, static Early Bird sky, and the homepage gadget reveal fix are committed locally as `3acbe1b`. Jesse confirmed items 1–3 look fine. Live deployment still requires a fresh explicit unlock; nothing has been pushed or published.

2. **Firefox private-mode feel on Early Bird — Confirmed.** Jesse said this looks fine after the static-sky work. If lag ever returns, that becomes the next real performance target.

3. **Live-domain playback/LRC/wallpaper spot-check — Confirmed.** Jesse said these look fine. No further action needed now.

4. **`WORK_LOG` merge ordering — Done locally.** `origin/main` was merged into `rv26`; the conflict was resolved so milestone 35 comes before milestone 36. Commit: `fe0c6f7 Merge main into rv26 with ordered deploy log`. No push, force-push, or history rewrite.

5. **Rollback drill — Rehearsed, not executed.** The pre-V16 tree `43066f6` is still reachable and contains root-level `index.html` and `the-early-bird.html`. In the clean `main` worktree at `7d64244`, the reverse of the V16 merge applied cleanly with `WORK_LOG.md` excluded, so a normal `git revert -m 1 e5ef5f0` is a viable no-force rollback. No live rollback was performed. Full runbook is below.

6. **Studio phone access — Decision needed.** The public site is responsive; Studio's UI is responsive down to phone widths, but the server is deliberately loopback-only and only accepts loopback origins. Phone editing needs an explicit private-network/VPN/TLS decision, host binding and origin changes, `Secure` cookies over HTTPS, and touch QA. Local autosave, explicit Save, stale-revision protection, and the publish gate should stay unchanged.

7. **Studio-initiated “Save & deploy live” — Deferred.** UI exists, but the real deploy was done through a normal merge/push. The workflow works; this is a workflow convenience, not a blocker.

8. **Undo/recovery in Studio — Deferred.** Only Discard/Reload exist. Local autosave and stale-revision protection reduce the risk, but true undo is still missing.

9. **Studio as a literal Tina client / one-source-of-truth semantics — Deferred/ambiguous.** The adapter seam works with Tina schema/DB, but Studio still writes through `/__fsfm/api` and Tina admin remains a sibling editor. No visible break today.

10. **Click-to-edit overlays / live preview of unsaved edits — Deferred.** Explicitly postponed in the older plans. Nice future editor polish, not needed for the live site.

11. **Parts-parity matrix and per-parts docs — Low.** Would help future maintenance and portability, but has zero live-site impact.

12. **Homepage ambient canvas still running at 30 FPS — Low.** Only revisit if the homepage ever feels heavy. The Early Bird lag source was handled separately.

13. **Greenlight checkbox, “new album in an afternoon” acceptance, three-identity sign-off — Low.** Mostly ceremony now that the deploy chain works. Do only if closing the old roadmap formally matters.

14. **Stale roadmap/handover docs — Low but tidy.** `ROADMAP.md` still says deploy is locked, `START_HERE.md` points at an old head/phase, some V16 docs describe the old Studio scope, and Tina still defaults to the prototype branch. Confusing for future sessions, not site-breaking. Per the append-only rule, correct by adding dated notes rather than rewriting old entries.

15. **V15 widget final sign-off / artist-embed final approval — Inconsequential.** Jesse iterated on these many times and the built markup is correct. Ignore unless something visibly looks wrong.

16. **Firefox recordings contradiction in archived docs — Inconsequential.** Stale archive text versus roadmap numbers. No code impact.

17. **Splitting the one-file Studio into multiple files — Inconsequential.** Deliberately deferred. It works; file size is not currently a problem.

18. **Tina Cloud / remote / multi-user / official admin decision — Inconsequential right now.** Only relevant if collaboration or hosted editing becomes a real goal.

19. **Rejected visual experiments — Do not do.** Sunrise Cathedral, smokey nebula, shooting streaks, and dark Spotify corner patches are not TODOs. Do not resurrect them.

## Schema.org note

Already present — no code change was made and the protected homepage hash was not touched.

The generated `dist/index.html` and `dist/albums/the-early-bird/index.html` both contain JSON-LD (`<script type="application/ld+json">`) generated from `src/render/page.mjs` and covered by `test/structured-data.test.mjs`. The graph includes:

- `WebSite` — `Fake Space Fog Machine`, canonical `https://fsfm.port82.net/`
- `MusicGroup` — the artist, with Spotify/TikTok/Bandcamp/Instagram/X/YouTube `sameAs` links
- `BreadcrumbList` — canonical breadcrumbs
- `WebPage` — the current page
- On the album page, `MusicAlbum` plus `MusicRecording` entries for all tracks

There is no `Person` node, so schema.org says nothing about Jesse personally; it describes the artist and release.

## Rollback runbook — rehearsed, not executed

**Safe target:** `e5ef5f0` was the V16 merge into `main`. Its first parent is the pre-merge `main`; the older root-level tree is also reachable as `43066f6`.

**Preferred rollback:** on `main`, create a normal revert commit, push normally, and let the existing Pages workflow rebuild/deploy. Do not use force-push, history rewrite, branch deletion, or file deletion.

```powershell
git revert -m 1 e5ef5f0
# Keep the WORK_LOG deployment history entry; resolve only if Git asks.
git push origin main
```

**Dry run actually performed:**

```powershell
cmd /c "git diff --binary e5ef5f0~1 e5ef5f0 | git apply --check --reverse --exclude=WORK_LOG.md"
```

Result: exit `0` in the clean `main` worktree at `7d64244`. This proves the V16 site changes can be reversed cleanly while preserving the deployment log. It did **not** change files and did **not** roll back live.

**Also verified:**

- `43066f6:index.html` and `43066f6:the-early-bird.html` still exist.
- `e5ef5f0~1` resolves to `43066f6`.
- `website-development` exists locally at `43066f6`, but `git ls-remote --heads origin website-development` returned nothing. Do not rely on switching Pages to that branch unless it is first pushed with explicit authorization.

**After any real rollback:** verify the protected homepage hash, homepage, album route, menu, player, LRC files, wallpaper, and JSON-LD on both live identities. To restore V16 later, revert the revert or re-merge `rv26` normally — never force-push.

## Tomorrow: the big leagues

Start with items **6 → 7 → 8 → 9 → 10**, in that order. Item 6 is a decision gate; item 7 is the first real product upgrade; items 8–10 are editor quality-of-life once the workflow direction is settled.
