# START HERE — FSFM

> Created 2026-11-22. This is the entry point for every session, human or assistant. Read this before touching anything.

---

## 1. Required reading, in order

1. `START_HERE.md` — this file (rules, analogy, locked decisions)
2. `ROADMAP.md` — the strategic "what and why"
3. `PRECURSOR_ROADMAP.md` — the near-term execution plan
4. `WORK_LOG.md` — Finished / Current / Next
5. `STUDIO_FIX_LIST.md` — Studio reconnaissance and fix priorities
6. `archive/PROJECT_STATE.md` and `archive/PROJECT_LOG.md` — **historical only**. Do not follow them as current guidance.

Canonical working directory: `C:\Users\jesse\fsfm`  
Working branch: `rv26`

---

## 2. Documentation protocol **[Jesse, 2026-11-22]**

- These documents are **append-only**. Nothing already written may be deleted or silently rewritten.
- Every new entry must be tagged:
  - **[Jesse]** — a goal, decision, correction or instruction from Jesse
  - **[OpenCode]** — an observation, finding or action by the assistant
  - **[Jesse + OpenCode]** — discussed and agreed together
- Corrections are added as **new dated entries**, not by editing old text.
- Every entry gets a date.
- Purpose: nothing gets lost, and it is always unmistakable whose call it was.

This protocol supersedes the earlier "maintenance rule" in `WORK_LOG.md`. From 2026-11-22 onward, append only.

---

## 3. The mud-hut analogy **[Jesse, 2026-11-22] — written down properly**

> Imagine the website as a little clearing in the woods.
>
> The homepage and The Early Bird are two incredibly sturdy mud huts. They have been lived in. They hold real history. They work — and nobody is suggesting they be knocked down.
>
> We have just discovered concrete and rebar. That is the pool of eighteen building blocks.
>
> It is not enough to build shiny new buildings out of concrete while the original huts stay mud. That would leave us with two different kinds of building and no way to move a room from one to the other.
>
> The whole point is to **refurbish both mud huts into the same material**. Then — and only then — any room from any building can be lifted out and dropped into another at the press of a button. The huts are not the enemy; they are the reason the material has to be good enough to carry real history.
>
> Studio is the front desk where you choose which rooms go where. It only makes sense once the buildings are made of the same stuff.

**What it means in practice:** the 18 shared blocks are the concrete. Homepage and Early Bird are still partly mud. We consolidate the architecture first; Studio is the final layer on top, not a substitute for it.

---

## 4. Locked decisions

| # | Decision | Source |
|---|---|---|
| D1 | THE version is `v16-tinacms-prototype` (156 commits ahead of `main`, 0 behind; only checkout with Studio/Tina/admin/dist) | [OpenCode] evidence, confirmed [Jesse] |
| D2 | Canonical folder is `C:\Users\jesse\fsfm` — it is the main repo; the other two are linked worktrees | [OpenCode] |
| D3 | **TinaCMS is the actual content backend. Studio must call it.** | [Jesse] 2026-11-22 |
| D4 | Do not rewrite or squash the 156 commits | [OpenCode] judgement |
| D5 | Archive, don't delete — `archive/` holds the old state/log | [Jesse + OpenCode] |
| D6 | **Jesse is the source of truth for goals; OpenCode is the source of truth for mechanics.** | [Jesse + OpenCode] |
| D7 | **Order: building blocks / architecture first, Studio last.** | [Jesse] 2026-11-22 |
| D8 | All planning docs live in the canonical folder and are append-only with attribution | [Jesse] 2026-11-22 |

---

## 5. Current state (2026-11-22)

- Branch `rv26`, head `245439b` — "Preserve in-progress content and Studio work on rv26"
- Six previously-unsaved files are committed and safe
- Prototype branch untouched
- Planning docs present in the folder, currently untracked on `rv26`
- Next real work: **Roadmap Phases 3–5** — the mud-hut refurbishment

---

## 6. Guardrails when Jesse is weary **[Jesse request, 2026-11-22]**

OpenCode may work autonomously, but must colour within these lines:

- ✅ Local commits on `rv26` are allowed (reversible)
- ❌ No `push`, no merge, no force-push, no history rewrite
- ❌ No touching `fsfm-main` or `fsfm-work`
- ❌ No deleting files
- ❌ No opening credentials (`%USERPROFILE%\.fsfm-studio\auth.json`)
- ❌ No live publishing
- ✅ Append to these docs with dated, attributed entries
- ✅ If anything is ambiguous or a goal-level call is needed — stop and ask

Permission to work while Jesse rests does **not** extend to irreversible actions. 🎛️

---

## 7. Private collaboration notes — pointer only **[Jesse + OpenCode, 2026-11-22]**

Jesse keeps a separate, private "how to work with me" file at:

`C:\Users\jesse\AppData\Local\OpenCode\ABOUT_JESSE.md`

It lives outside every git repo and outside OneDrive **on purpose** — this repository is public. Read it at session start alongside this file.

**No personal detail from that file is stored here, and none may ever be committed to this repository.** This section records the path only, so a future session knows where to look.
