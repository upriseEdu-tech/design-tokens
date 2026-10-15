# Cross-app design consistency: roadmap of plans

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md`

The spec spans five repos and seven waves. A single plan can't be exact about the later waves, because they depend on the outputs of earlier ones:

- the glyphs the owner approves in Wave 0, and
- the smoothness audit's findings.

So the work is split into plans. Each one ships working, testable software on its own. Each plan is written once its inputs exist, and the owner reviews it before execution.

| # | Plan | Spec waves | Repos | Needs before writing | Status |
|---|---|---|---|---|---|
| 1 | Rulebook and error codes | 0, 1 (codes) | design-tokens, backend, artifact | — | **Written** (`2026-10-15-plan-1-rulebook-and-error-codes.md`) |
| 2 | Backend performance | 1 (slow endpoints) | backend | EXPLAIN profiles of the endpoints in Plan 1 Task 7's baseline | Next |
| 3 | RN foundations (both apps) | 2 | teacher, mobile | `design-tokens` 0.7.0 published; glyphs approved | After Plan 1 |
| 4 | Staff app parity | 3 | teacher | Plan 3 merged | |
| 5 | Staff app screen sweeps (3 PRs) | 4 | teacher | Plan 4 merged; smoothness audit | |
| 6 | Parent app sweep | 4 | mobile | Plan 3 merged; smoothness audit | |
| 7 | Dashboard foundations and sweep | 2, 4 | dashboard | `design-tokens` 0.7.0; glyphs approved | Can run in parallel with 3–6 |
| 8 | Design-system artifact and release | 5, 6 | artifact, all | Plans 2–7 merged | |

**Notes**

- **Runtime smoothness baselines for the RN apps** (Flashlight fps, React Profiler) are taken at the start of Plan 3. That's when fresh release builds exist. Plan 1 records the static audit and the backend endpoint baseline.
- **Glyph review.** Plan 1 publishes it as its own artifact, so the owner can approve it quickly. The registry is folded into the "Uprise Dashboard" design-system artifact in Plan 8 (spec §4.2).

**Rules for every plan**

- Work in a worktree off the default branch (`master` for backend and dashboard; `main` for the others). Never touch another session's checkout.
- Use Conventional Commits. Commits and PRs are authored by Fady Shawky, with no AI attribution.
- Versions stay frozen at Staff 6.0.2 and Parent 3.0.0. `design-tokens` moves 0.6.0 → 0.7.0.
- Every PR has a `## Verification` section that lists the literal commands run and their results.
- Merge dashboard PRs as `upriseEdu-tech`, so Vercel deploys them.
