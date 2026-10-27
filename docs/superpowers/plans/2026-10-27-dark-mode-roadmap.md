# Dark mode: roadmap of plans

**Spec:** `docs/superpowers/specs/2026-10-26-dark-mode-design.md`

The spec spans five repos that ship in a fixed order. Every later plan consumes the exact exports of `design-tokens` 0.8.0 (`Roles`, `sharedHomeTokens(scheme)` …), so each plan is written once its inputs exist, and the owner reviews it before execution.

| # | Plan | Repos | Needs before writing | Status |
|---|---|---|---|---|
| 1 | Role table and per-scheme tokens | design-tokens | — | **Done 2026-10-27**: #10 merged, 0.8.0 published (`2026-10-27-dark-mode-plan-1-design-tokens.md`) |
| 2 | Dashboard dark mode | dashboard | Plan 1 merged and 0.8.0 published | **Built 2026-10-27** on dashboard `feat/dark-mode`; final review, then PR (`2026-10-27-dark-mode-plan-2-dashboard.md`) |
| 3 | rn-ui theme and migration | rn-ui | Plan 1 merged | **Written** (`2026-10-27-dark-mode-plan-3-rn-ui.md`) |
| 4 | Parent and Staff apps | mobile, teacher | Plan 3 published (rn-ui 0.4.0) | |

**Order:** 1 → (2 ∥ 3) → 4. Plans 2 and 3 touch different repos and run in parallel. Plan 4 changes both apps in one piece of work, with the same names in each.

**Rules for every plan**
- Work in a worktree off the default branch: `master` for the dashboard, `main` for the others. Never touch another session's checkout.
- Use Conventional Commits. Commits and PRs are authored by Fady Shawky, with no AI attribution.
- `mobile` and `teacher` merge into the then-current preview branch. Preview → main is the owner's step.
- Store builds wait until the current submission is approved. OTAs for binaries built before dark mode are cut from a branch that does not contain it.
- Every PR has a `## Verification` section with the literal commands run and their results.
- Jest runs at `npx jest -w 2`, one run at a time.
- Push and open PRs as `upriseEdu-tech`. The machine's active GitHub identity may be another org's, so use a per-command token (`gh auth token --user upriseEdu-tech`); never switch the global identity.
