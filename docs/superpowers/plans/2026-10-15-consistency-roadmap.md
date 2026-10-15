# Cross-app design consistency: roadmap of plans

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md`

The spec spans five repos and seven waves. A single plan can't be exact about the later waves, because they depend on the outputs of earlier ones:

- the glyphs the owner approves in Wave 0, and
- the smoothness audit's findings.

So the work is split into plans. Each one ships working, testable software on its own. Each plan is written once its inputs exist, and the owner reviews it before execution.

| # | Plan | Spec waves | Repos | Needs before writing | Status |
|---|---|---|---|---|---|
| 1 | Rulebook and error codes | 0, 1 (codes) | design-tokens, backend, artifact | — | **Done 2026-10-15**: backend#140 deployed, design-tokens 0.7.0 published |
| 2 | Backend performance | 1 (slow endpoints) | backend | — | **Written** (`2026-10-15-plan-2-backend-performance.md`) |
| 3 | RN foundations (both apps) | 2 | teacher, mobile | `design-tokens` 0.7.1 (Plan 7 Task 1) | **Written** (`2026-10-15-plan-3-rn-foundations.md`) |
| 4 | Staff app parity | 3 | teacher | Plan 3 merged | |
| 5 | Staff app screen sweeps (3 PRs) | 4 | teacher | Plan 4 merged; smoothness audit | |
| 6 | Parent app sweep | 4 | mobile | Plan 3 merged; smoothness audit | |
| 7 | Dashboard foundations and sweep | 2, 4 | design-tokens, dashboard | — | **Written** (`2026-10-15-plan-7-dashboard.md`); its Task 1 publishes 0.7.1, which Plan 3 needs |
| 8 | Design-system artifact and release | 5, 6 | artifact, all | Plans 2–7 merged | |

**Notes**

- **Runtime smoothness baselines for the RN apps** (Flashlight fps, React Profiler) are taken at the start of Plan 3. That's when fresh release builds exist. Plan 1 records the static audit and the backend endpoint baseline.
- **Glyph review.** Plan 1 publishes it as its own artifact, so the owner can approve it quickly. The registry is folded into the "Uprise Dashboard" design-system artifact in Plan 8 (spec §4.2).

- **Order after Plan 1.** Plan 7 Task 1 (`design-tokens` 0.7.1: an ESM build Node can load, plus the dashboard's items) comes first: Plan 3 depends on it. After that, Plans 2, 3 and 7 can run in parallel: they touch different repos.
- **Plan 3 deviates from spec §5.1 on purpose.** `ConfirmSheet` uses `react-native-actions-sheet`, which both apps already use for every sheet. `@gorhom/bottom-sheet` was never imported in `src`.
- **Plan 2 found the slowness isn't SQL.** On the snapshot, the SQL behind each slow endpoint runs in 0.2–10 ms. The time goes to:
  - unpaged notifications: up to 26,423 rows and 4 MB
  - the request log copying every body
  - a write on every authenticated request
  - a new storage client per upload
  - per-row loops in bulk schedule

**Rules for every plan**

- Work in a worktree off the default branch (`master` for backend and dashboard; `main` for the others). Never touch another session's checkout.
- Use Conventional Commits. Commits and PRs are authored by Fady Shawky, with no AI attribution.
- Versions stay frozen at Staff 6.0.2 and Parent 3.0.0. `design-tokens` moves 0.6.0 → 0.7.0.
- Every PR has a `## Verification` section that lists the literal commands run and their results.
- Merge dashboard PRs as `upriseEdu-tech`, so Vercel deploys them.
