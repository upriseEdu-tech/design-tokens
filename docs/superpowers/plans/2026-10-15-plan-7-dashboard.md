# Plan 7: Dashboard: one icon family, one feedback system Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the admin dashboard onto the shared rulebook:
- every icon is Solar Linear, resolved through the registry and bundled offline;
- every toast, error and confirmation comes from the en/ar catalogue through one `notify`;
- load failures show the list's own error state.

**Architecture:**
- **`design-tokens` 0.7.1:** the ESM build loads in plain Node, which the dashboard's `node --test` suites need, and the catalogue gains the dashboard's own items and actions.
- **Pure helpers:** in the dashboard, `src/utils/feedback.js` turns an AxiosError into catalogue text. These helpers are unit-tested.
- **`useNotify`** is the only way screens toast. The axios interceptor reports session end and suspension once, and marks the error so nothing reports it twice.
- **Icons:** a codemod moves every icon string to Solar Linear. A generated collection is registered with `addCollection`, so nothing loads from `api.iconify.design` at runtime.
- **Guards:** two guard scripts keep both rules. The feedback guard has a pending list that the three sweep PRs shrink to zero.

**Tech Stack:** React 18, Vite, MUI 5, notistack 3, SWR, i18next (keys are the English sentences), `@iconify/react` 4, `node --test` (`.test.mjs` next to the module), `@upriseedu-tech/design-tokens`.

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md`:
- §5 (feedback table) and §5.2 (dashboard)
- §6 (icons) and §6.2 (dashboard changes)
- §8.1 and §8.2 (dashboard smoothness)
- §10 (guards)

The baseline is `docs/audits/2026-10-smoothness-baseline.md` §3.

## Global Constraints

- **Icons:** Solar Linear only, as `solar:<glyph>-linear`.
  - Concepts, actions, statuses and feedback come from `IconConcepts`, `IconActions`, `IconStatuses` and `IconFeedback` via `iconifyName(glyph)`. No other icon family, except country and language flags (`flagpack:*`, `circle-flags:*`), which are content.
  - One glyph, one meaning. Action and status glyphs are reserved (spec §6.1).
- **Feedback:**
  - Text comes from `FeedbackMessages`. The server's `message` is never shown.
  - Failed write: one error toast. Failed load: the list's error state, never a toast.
  - Success: one toast with `success.*`.
  - Destructive actions use `ConfirmDialog` with the catalogue's confirm wording. No `window.confirm`.
  - Instant toggles stay silent (spec §5).
- **i18n:** every new UI string goes through `t()`, with en and ar. `npm run check:i18n` passes.
- **No hardcoded API URL or config.** Grep every diff for `localhost` and `HOST_API` before each commit (dashboard rule; a localhost `HOST_API` once broke every production login).
- **Merge as `upriseEdu-tech`,** so Vercel deploys: `GH_TOKEN="$(gh auth token --user upriseEdu-tech)" gh pr merge …`. Never switch the active `gh` account. The owner merges.
- **Work in worktrees** off `origin/master` (dashboard) and `origin/main` (design-tokens). Never touch another session's checkout.
- **Commits:** Conventional Commits, authored by Fady Shawky, with no AI attribution. PRs have a `## Verification` section with literal commands and results.
- **Publishing `design-tokens` 0.7.1** to GitHub Packages needs the owner's explicit yes. The token is `UPRISE_NPM_TOKEN`; non-interactive shells load it from `~/.zshrc`. Never print it.

## Review Focus

1. **A failed request that never got a response** (network down, CORS, timeout). It must read as `error.offline`, not "Couldn't save … Try again" and not the AxiosError's English "Network Error". Pinned in Task 2.
2. **A refresh refused while three requests were queued behind it.** The user sees exactly one "Your session ended" toast, not four. Pinned in Task 4 (the `reported` flag) and Task 2 (`alreadyReported`).
3. **Arabic UI with an item the catalogue lacks.** The toast must be a whole Arabic sentence, never a template with a hole and never English. Pinned in Task 2 (`unknown` item falls back to `error.unknown`).
4. **An icon string built at runtime** (`` `solar:${name}-bold-duotone` ``, `` `circle-flags:${code}` ``). The guard must reject a built Solar name and accept a flag. Pinned in Task 5.
5. **A list whose load fails after it had data** (SWR `keepPreviousData`). It must keep showing the rows. The error state is only for a list with nothing to show. Pinned in Task 4 (`RebrandListView`).

---

### Task 1: `design-tokens` 0.7.1: the ESM build loads in Node, and the dashboard's words

**Files** (repo `design-tokens`, worktree `../.worktrees/design-tokens-0.7.1`, branch `fix/esm-node-and-dashboard-items`):
- Modify: `src/index.ts`, `src/home.ts`, `src/mobilePlatform.ts`, `src/navigationShell.ts`. Add a `.js` extension to every relative import and export.
- Create: `scripts/mark-esm.js`
- Modify: `package.json`. `build` runs `mark-esm.js`; `test` also runs `.test.mjs`; `version` becomes `0.7.1`.
- Create: `test/esm-import.test.mjs`
- Modify: `src/feedback.ts`. Add items, actions and success kinds, in en and ar.

**Interfaces:**
- Produces:
  - `import { … } from '@upriseedu-tech/design-tokens'` works under plain Node ESM.
  - New catalogue keys:
    - `items`: `appVersion`, `qrCode`, `role`, `policy`, `specialDay`, `payment`, `apiKey`, `booking`
    - `actions`: `generate`, `restore`, `assign`
    - `success`: `generated`, `restored`

- [ ] **Step 1: Set up the worktree**

```bash
cd /Users/fadyshawky/Dev/uprise/design-tokens
git fetch origin
git worktree add -b fix/esm-node-and-dashboard-items ../.worktrees/design-tokens-0.7.1 origin/main
cd ../.worktrees/design-tokens-0.7.1
npm ci
```

- [ ] **Step 2: Write the failing tests**

Create `test/esm-import.test.mjs`:

```js
// The package's "import" entry must load in plain Node, not only in bundlers:
// the dashboard's node --test suites import it (Plan 7). tsc copies import
// specifiers verbatim, so './colors' (no extension) loaded in Vite and Metro
// but threw ERR_MODULE_NOT_FOUND in Node (0.7.0).
import test from 'node:test';
import assert from 'node:assert/strict';

test('the ESM build loads in plain Node', async () => {
  const esm = await import('../dist/esm/index.js');
  assert.equal(typeof esm.feedbackForError, 'function');
  assert.equal(esm.IconConcepts.pickup, 'car');
});

test('the dashboard items, actions and success kinds exist in both languages', async () => {
  const { FeedbackMessages, feedbackForSuccess } = await import('../dist/esm/index.js');
  for (const locale of ['en', 'ar']) {
    const m = FeedbackMessages[locale];
    for (const item of ['appVersion', 'qrCode', 'role', 'policy', 'specialDay', 'payment', 'apiKey', 'booking']) {
      assert.ok(m.items[item], `${locale}.items.${item}`);
    }
    for (const action of ['generate', 'restore', 'assign']) assert.ok(m.actions[action], `${locale}.actions.${action}`);
  }
  assert.equal(feedbackForSuccess('en', 'restored', 'role'), 'Role restored.');
  assert.equal(feedbackForSuccess('ar', 'generated', 'payment'), 'تم توليد الدفعة.');
});
```

In `package.json`, make `test` read:

```json
"test": "npm run build && node --test 'test/*.test.js' 'test/*.test.mjs'"
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npm test`
Expected: `the ESM build loads in plain Node` fails with `ERR_MODULE_NOT_FOUND … dist/esm/colors`. The 21 existing tests pass.

- [ ] **Step 4: Fix the ESM build**

Add `.js` to each relative specifier. TypeScript resolves `./colors.js` to `colors.ts`:
- `src/home.ts`: `from './colors.js'`
- `src/mobilePlatform.ts`: `from './colors.js'`
- `src/navigationShell.ts`: `from './colors.js'`
- `src/index.ts`, every `from './…'`:
  - `./colors.js`, `./home.js`, `./navigationShell.js`, `./mobilePlatform.js`
  - `./icons.js` (twice)
  - `./feedback.js` (twice)

Create `scripts/mark-esm.js`:

```js
// dist/esm holds ES modules but the package is CommonJS by default, so Node
// would parse them by guesswork (and warn). This marker makes them ESM.
const fs = require('fs');
fs.writeFileSync('dist/esm/package.json', '{"type":"module"}\n');
```

In `package.json`, set:

```json
"build": "rm -rf dist && tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json && node scripts/mark-esm.js"
```

- [ ] **Step 5: Add the dashboard's words**

In `src/feedback.ts`:
- **`en` → `success`:** add `generated: '{{Item}} generated.',` and `restored: '{{Item}} restored.',`
- **`en` → `actions`:** add `generate: 'generate',` `restore: 'restore',` `assign: 'assign',`
- **`en` → `items`:** add:

```ts
    appVersion: 'app version',
    qrCode: 'QR code',
    role: 'role',
    policy: 'policy',
    specialDay: 'special day',
    payment: 'payment',
    apiKey: 'API key',
    booking: 'booking',
```

- **`ar` → `success`:** add `generated: 'تم توليد {{item}}.',` and `restored: 'تمت استعادة {{item}}.',`
- **`ar` → `actions`:** add `generate: 'توليد',` `restore: 'استعادة',` `assign: 'تعيين',`
- **`ar` → `items`:** add:

```ts
    appVersion: 'إصدار التطبيق',
    qrCode: 'رمز QR',
    role: 'الدور',
    policy: 'السياسة',
    specialDay: 'اليوم الخاص',
    payment: 'الدفعة',
    apiKey: 'مفتاح API',
    booking: 'الحجز',
```

Set `"version": "0.7.1"` in `package.json`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: 23 tests pass, 0 fail. The parity tests in `feedback.test.js` already require both languages to carry the same keys, and Arabic script in every `ar` value.

Then check that the CommonJS build still resolves the `.js` specifiers:

```bash
node -e "console.log(require('./dist/cjs').IconConcepts.home)"
```

Expected: `home-smile`.

- [ ] **Step 7: Commit, push, PR**

```bash
git add src scripts/mark-esm.js package.json package-lock.json test/esm-import.test.mjs
git commit -m "fix: load the ESM build in plain Node, and add the dashboard's items (0.7.1)"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/design-tokens.git HEAD:refs/heads/fix/esm-node-and-dashboard-items
```

Open the PR against `main` with `## Verification` (the `npm test` count and the CJS check). After the owner approves, merge it with a merge commit. Then publish from a clean checkout of `origin/main`:
1. `npm ci && npm test`
2. `npm pack --dry-run` shows `version: 0.7.1` and only `dist` and `bin`.
3. `npm publish --userconfig <temp npmrc with //npm.pkg.github.com/:_authToken=${UPRISE_NPM_TOKEN}>`, with the token loaded from `~/.zshrc` and never printed.

Expected: `+ @upriseedu-tech/design-tokens@0.7.1`.

---

### Task 2: The dashboard's feedback helpers

**Files** (repo `dashboard`, worktree `../.worktrees/dashboard-feedback`, branch `feat/dashboard-feedback-icons`):
- Modify: `package.json`. Set `@upriseedu-tech/design-tokens` to `^0.7.1` and add `"test": "node --test 'src/**/*.test.mjs'"`.
- Create: `src/utils/feedback.js`
- Create: `src/utils/feedback.test.mjs`

**Interfaces:**
- Consumes: Task 1's 0.7.1.
- Produces (all pure, ESM):
  - `feedbackLocale(language) → 'en'|'ar'`
  - `errorFields(err) → { code: string|null, status: number|null }`. An AxiosError with no response gives status `0`.
  - `errorText(language, err, action, item) → string`
  - `successText(language, kind, item) → string`
  - `feedbackText(language, path, vars?) → string`. `path` is dotted, for example `'error.sessionEnded'`.
  - `confirmDeleteText(language, item) → { title, body, confirm, cancel }`
  - `alreadyReported(err) → boolean`. True when the axios interceptor already reported the failure (`err.reported`).

- [ ] **Step 1: Set up the worktree**

```bash
cd /Users/fadyshawky/Dev/uprise/dashboard
git fetch origin
git worktree add -b feat/dashboard-feedback-icons ../.worktrees/dashboard-feedback origin/master
cd ../.worktrees/dashboard-feedback
npm install @upriseedu-tech/design-tokens@^0.7.1
```

`.npmrc` reads `${UPRISE_NPM_TOKEN}`. If the install returns 401, load it for this command only: `eval "$(grep '^export UPRISE_NPM_TOKEN=' ~/.zshrc)"`. Never print it.

- [ ] **Step 2: Write the failing test**

Create `src/utils/feedback.test.mjs`:

```js
// Run: node --test src/utils/feedback.test.mjs
//
// The dashboard showed raw backend text in ~57% of error toasts and English
// fallbacks in 46% of success toasts (2026-10-15 audit). These helpers are the
// only path from a failed request to the words on screen.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FeedbackMessages } from '@upriseedu-tech/design-tokens';

import {
  errorText,
  successText,
  errorFields,
  feedbackText,
  alreadyReported,
  feedbackLocale,
  confirmDeleteText,
} from './feedback.js';

const en = FeedbackMessages.en;
const axiosError = (status, data) => ({ isAxiosError: true, response: { status, data } });

test('a known code wins, and the server message is never shown', () => {
  const err = axiosError(400, { code: 'NOT_ENOUGH_VACATION_DAYS', message: 'Not enough Vacations' });
  assert.equal(errorText('en', err, 'send', 'vacationRequest'), en.errors.NOT_ENOUGH_VACATION_DAYS);
  assert.ok(!errorText('en', err, 'send', 'vacationRequest').includes('Vacations'));
});

test('no response at all reads as offline, not "Network Error"', () => {
  const err = { isAxiosError: true, message: 'Network Error', request: {} };
  assert.deepEqual(errorFields(err), { code: null, status: 0 });
  assert.equal(errorText('en', err, 'save', 'album'), en.error.offline);
});

test('a thrown non-axios error reads as the action sentence', () => {
  assert.equal(errorText('en', new Error('boom'), 'delete', 'album'), "Couldn't delete the album. Try again.");
  assert.equal(errorText('en', 'oops', 'delete', 'album'), "Couldn't delete the album. Try again.");
});

test('Arabic, and an item the catalogue lacks still gives a whole sentence', () => {
  assert.equal(errorText('ar', axiosError(400, {}), 'delete', 'album'), 'تعذّر حذف الألبوم. حاول مرة أخرى.');
  assert.equal(errorText('ar-EG', axiosError(400, {}), 'delete', 'widget'), FeedbackMessages.ar.error.unknown);
  assert.equal(feedbackLocale('ar-EG'), 'ar');
  assert.equal(feedbackLocale(undefined), 'en');
});

test('success, plain text and the delete confirmation', () => {
  assert.equal(successText('en', 'deleted', 'invoice'), 'Invoice deleted.');
  assert.equal(feedbackText('en', 'error.sessionEnded'), en.error.sessionEnded);
  assert.equal(feedbackText('en', 'no.such.key'), '');
  assert.deepEqual(confirmDeleteText('en', 'event'), {
    title: 'Delete the event?',
    body: en.confirm.deleteBody,
    confirm: en.confirm.deleteConfirm,
    cancel: en.confirm.cancel,
  });
});

test('an error the interceptor already reported is not reported again', () => {
  assert.equal(alreadyReported({ reported: true }), true);
  assert.equal(alreadyReported(axiosError(500, {})), false);
  assert.equal(alreadyReported(undefined), false);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test src/utils/feedback.test.mjs`
Expected: FAIL. `Cannot find module …/src/utils/feedback.js`.

- [ ] **Step 4: Write the helpers**

Create `src/utils/feedback.js`:

```js
import {
  fillFeedback,
  FeedbackMessages,
  feedbackForError,
  feedbackForSuccess,
} from '@upriseedu-tech/design-tokens';

// ----------------------------------------------------------------------

// The catalogue's locale for i18next's language ('ar', 'ar-EG', 'en-US', or
// nothing yet during boot).
export function feedbackLocale(language) {
  return String(language || '').startsWith('ar') ? 'ar' : 'en';
}

// What the catalogue needs from a failure. src/utils/axios.js rejects the
// AxiosError itself, so the body is on err.response.data; an axios error with
// no response at all (network, CORS, timeout) is status 0, which reads as
// offline. Anything else thrown has neither.
export function errorFields(err) {
  const response = err?.response;
  if (!response) return { code: null, status: err?.isAxiosError ? 0 : null };
  const code = typeof response.data?.code === 'string' ? response.data.code : null;
  return { code, status: typeof response.status === 'number' ? response.status : null };
}

export function errorText(language, err, action, item) {
  return feedbackForError(feedbackLocale(language), errorFields(err), action, item);
}

export function successText(language, kind, item) {
  return feedbackForSuccess(feedbackLocale(language), kind, item);
}

// A catalogue string by dotted path, filled; '' for a path that doesn't exist.
export function feedbackText(language, path, vars = {}) {
  const node = String(path)
    .split('.')
    .reduce(
      (at, key) => (at && Object.prototype.hasOwnProperty.call(at, key) ? at[key] : undefined),
      FeedbackMessages[feedbackLocale(language)]
    );
  return typeof node === 'string' ? fillFeedback(node, vars) : '';
}

export function confirmDeleteText(language, item) {
  const m = FeedbackMessages[feedbackLocale(language)];
  const name = Object.prototype.hasOwnProperty.call(m.items, item) ? m.items[item] : '';
  return {
    title: fillFeedback(m.confirm.deleteTitle, { item: name }),
    body: m.confirm.deleteBody,
    confirm: m.confirm.deleteConfirm,
    cancel: m.confirm.cancel,
  };
}

// src/utils/axios.js marks the failures it has already shown (session ended,
// nursery suspended) so a caller's notify.error stays quiet: one report each.
export function alreadyReported(err) {
  return Boolean(err?.reported);
}
```

In `package.json` `scripts`, add `"test": "node --test 'src/**/*.test.mjs'",`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: every suite passes: `feedback.test.mjs` (6) plus the existing `swr-keys`, `chunk-reload` and `chunk-reload.edge` suites. `date.test.mjs` uses plain asserts and also runs clean.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/utils/feedback.js src/utils/feedback.test.mjs
git commit -m "feat(feedback): turn a failed request into catalogue text, never the server's"
```

---

### Task 3: `useNotify`, `ConfirmDeleteDialog`, and the snackbar's glyphs

**Files:**
- Create: `src/hooks/use-notify.js`
- Create: `src/components/custom-dialog/confirm-delete-dialog.jsx`
- Modify: `src/components/custom-dialog/index.js`. Export `ConfirmDeleteDialog`.
- Modify: `src/components/custom-dialog/confirm-dialog.jsx`. Translate the button labels and add `submitLabel` / `submitColor`.
- Modify: `src/components/snackbar/snackbar-provider.jsx`. Use the registry glyphs.
- Modify: `src/locales/langs/en.json`, `src/locales/langs/ar.json`. Add the `"Submit"` key if it's missing.

**Interfaces:**
- Consumes: Task 2's helpers.
- Produces:
  - `useNotify() → { success(kind, item), error(err, action, item), info(text) }`
  - `<ConfirmDeleteDialog open item onClose onConfirm loading? />`
  - `<ConfirmDialog … submitLabel? submitColor? />`. Today's props are unchanged.

- [ ] **Step 1: Write the hook**

Create `src/hooks/use-notify.js`:

```js
import { useMemo } from 'react';
import { useSnackbar } from 'notistack';

import { useTranslate } from 'src/locales';
import { errorText, successText, alreadyReported } from 'src/utils/feedback';

// ----------------------------------------------------------------------

/**
 * The only way a screen shows a toast (spec 2026-10-15 §5.2):
 *   notify.success('deleted', 'invoice')
 *   notify.error(err, 'delete', 'invoice')
 *   notify.info(t('Copied to the clipboard'))
 * A failed load is the list's error state, never a toast. An error the axios
 * interceptor already reported (session ended, nursery suspended) is skipped.
 */
export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();
  const { i18n } = useTranslate();
  const language = i18n.resolvedLanguage || i18n.language;

  return useMemo(
    () => ({
      success: (kind, item) =>
        enqueueSnackbar(successText(language, kind, item), { variant: 'success' }),
      error: (err, action, item) => {
        if (alreadyReported(err)) return;
        enqueueSnackbar(errorText(language, err, action, item), { variant: 'error' });
      },
      info: (text) => enqueueSnackbar(text, { variant: 'info' }),
    }),
    [enqueueSnackbar, language]
  );
}
```

- [ ] **Step 2: Write `ConfirmDeleteDialog`, and translate `ConfirmDialog`'s buttons**

Create `src/components/custom-dialog/confirm-delete-dialog.jsx`:

```jsx
import PropTypes from 'prop-types';

import LoadingButton from '@mui/lab/LoadingButton';

import { useTranslate } from 'src/locales';
import { confirmDeleteText } from 'src/utils/feedback';

import ConfirmDialog from './confirm-dialog';

// ----------------------------------------------------------------------

// Every delete asks the same question in both languages (spec 2026-10-15 §5,
// decision D3): "Delete the <item>?" / "This can't be undone." / Delete.
export default function ConfirmDeleteDialog({ open, item, onClose, onConfirm, loading = false }) {
  const { i18n } = useTranslate();
  const text = confirmDeleteText(i18n.resolvedLanguage || i18n.language, item);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={text.title}
      content={text.body}
      cancelLabel={text.cancel}
      hideSubmit
      action={
        <LoadingButton variant="contained" color="error" loading={loading} onClick={onConfirm}>
          {text.confirm}
        </LoadingButton>
      }
    />
  );
}

ConfirmDeleteDialog.propTypes = {
  item: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
```

In `src/components/custom-dialog/index.js`, add `export { default as ConfirmDeleteDialog } from './confirm-delete-dialog';`.

In `src/components/custom-dialog/confirm-dialog.jsx`:
- Add `submitLabel`, `submitColor = 'inherit'` and `cancelLabel` to the destructured props.
- Read `const { t } = useTranslate();`, imported from `src/locales`.
- Replace the button bodies `Submit` and `Cancel` with `{submitLabel || t('Submit')}` and `{cancelLabel || t('Cancel')}`.
- Use `color={submitColor}` on the submit button.
- Add the three to `propTypes`: `submitLabel: PropTypes.string, submitColor: PropTypes.string, cancelLabel: PropTypes.string`.

Make sure `"Submit"` and `"Cancel"` exist in `src/locales/langs/en.json` and `ar.json`:

```bash
grep -c '"Submit":\|"Cancel":' src/locales/langs/en.json src/locales/langs/ar.json
```

Add any missing key: in en, `"Submit": "Submit"`; in ar, `"Submit": "إرسال"` and `"Cancel": "إلغاء"`.

- [ ] **Step 3: Point the snackbar at the registry**

In `src/components/snackbar/snackbar-provider.jsx`:
- Import `{ IconActions, IconFeedback, iconifyName }` from `@upriseedu-tech/design-tokens`.
- Replace the four `iconVariant` icons:
  - info → `iconifyName(IconFeedback.info)`
  - success → `iconifyName(IconFeedback.success)`
  - warning → `iconifyName(IconFeedback.info)` (the catalogue has no warning tone; the sweeps turn warnings into info or error)
  - error → `iconifyName(IconFeedback.error)`
- The close action's icon becomes `iconifyName(IconActions.close)`.

- [ ] **Step 4: Check it builds and lints**

```bash
npm run lint
npm run build
npm test
```

Expected: lint passes (it includes `check:tokens`), the Vite build succeeds, and the tests pass. If lint flags the new files, fix them; the rules are the repo's.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-notify.js src/components/custom-dialog src/components/snackbar/snackbar-provider.jsx src/locales/langs/en.json src/locales/langs/ar.json
git commit -m "feat(feedback): one notify for every toast and one delete confirmation"
```

---

### Task 4: The API layer reports once, lists show their own error, and an offline banner

**Files:**
- Modify: `src/utils/axios.js`. Mark and report suspension and a refused refresh.
- Modify: `src/auth/context/jwt/auth-provider.jsx`. Catalogue text for suspension, session end and login.
- Modify: `src/sections/auth/jwt/jwt-login-view.jsx`. One report on login failure: the inline alert.
- Modify: `src/components/templates/RebrandListView.jsx`. The error state uses catalogue text and shows rows it already has.
- Create: `src/components/offline-banner/offline-banner.jsx`, `src/components/offline-banner/index.js`
- Modify: `src/app.jsx`. Mount `OfflineBanner`.

**Interfaces:**
- Consumes: Task 2 (`errorText`, `feedbackText`) and Task 3.
- Produces:
  - A rejected error from `src/utils/axios.js` has `reported: true` when the interceptor already showed it.
  - `handleNurserySuspendedCallback(error)` now receives the error, not a message.
  - `handleLogoutCallback({ sessionEnded: true })` is called on a refused refresh.

- [ ] **Step 1: Mark what the interceptor reports**

In `src/utils/axios.js`, replace the suspension branch:

```js
    if (error.response?.data?.code === 'NURSERY_SUSPENDED') {
      const errorMessage = error.response?.data?.message || 'Please Contact Your Nursery';
      if (handleNurserySuspendedCallback) {
        handleNurserySuspendedCallback(errorMessage);
      }
      return Promise.reject(error);
    }
```

with:

```js
    if (error.response?.data?.code === 'NURSERY_SUSPENDED') {
      // Reported here, once; the caller's notify.error sees `reported` and stays quiet.
      error.reported = true;
      if (handleNurserySuspendedCallback) {
        handleNurserySuspendedCallback(error);
      }
      return Promise.reject(error);
    }
```

In the refresh failure path, replace:

```js
        if (isRefreshRefusedByServer(refreshError)) {
          setSession(null);
          handleLogoutCallback?.();
        }
```

with:

```js
        if (isRefreshRefusedByServer(refreshError)) {
          setSession(null);
          // One "your session ended" for the whole queue: every request waiting
          // on this refresh rejects with this same object.
          refreshError.reported = true;
          handleLogoutCallback?.({ sessionEnded: true });
        }
```

- [ ] **Step 2: Catalogue text in the auth provider, and one report on login**

In `src/auth/context/jwt/auth-provider.jsx`:
- Add `import i18n from 'src/locales/i18n';` and `import { errorText, feedbackText } from 'src/utils/feedback';`.
- In `login`, replace `notify('Unauthorized role', { variant: 'error' }); throw new Error('Unauthorized role');` with `throw new Error(feedbackText(i18n.language, 'error.permission'));`.
- In `login`'s `catch`, replace:

```js
        const message = error.response?.data?.message || 'Authentication failed';
        notify(message, { variant: 'error' });
        throw new Error(message);
```

with:

```js
        // The login form shows this inline, once; no toast as well.
        if (!error.isAxiosError) throw error;
        throw new Error(errorText(i18n.language, error, 'submit', 'password'));
```

  This `if (!error.isAxiosError)` rethrows a non-HTTP error unchanged, such as the `Error` the role check above just threw. An axios failure with no response (network, timeout) goes through `errorText`, which reads it as `error.offline` rather than axios's English "Network Error".

- Make `logout` take an options object. Change `const logout = useCallback(async () => {` to `const logout = useCallback(async (options) => {`. As the first line of its body, add:

```js
    if (options?.sessionEnded) {
      notify(feedbackText(i18n.language, 'error.sessionEnded'), { variant: 'error' });
    }
```

  The UI also calls `logout` as an onClick handler, so `options` can be a click event. `options?.sessionEnded` is then undefined, and nothing is shown.

- In `handleNurserySuspended`, rename the parameter `message` to `error` and replace `notify(message, { variant: 'error' });` with `notify(errorText(i18n.language, error, 'load', 'nursery'), { variant: 'error' });`.

In `src/sections/auth/jwt/jwt-login-view.jsx`, nothing else changes: it already shows the thrown message in its inline `Alert`, which is now the catalogue sentence.

- [ ] **Step 3: The list's error state**

In `src/components/templates/RebrandListView.jsx`, in the error branch (the `RebrandEmptyState` with `title="We couldn't load this list"`):
- Render it only when there's an error **and** the list is empty (`isEmpty`). With rows on screen, a failed revalidation keeps the rows (SWR `keepPreviousData`).
- Replace the hardcoded strings:
  - Title: `t("Couldn't load this list")`
  - Subtitle: `feedbackText(i18n.resolvedLanguage || i18n.language, 'error.loadFailed')`, from `src/utils/feedback`
  - Button label: `t('Try again')`
- Never render `error.message`.
- Read `t`/`i18n` via `useTranslate()`.

Add `"Couldn't load this list"` and `"Try again"` to `en.json` and `ar.json`, if missing:
- `"Couldn't load this list"` → «تعذّر تحميل هذه القائمة»
- `"Try again"` → «حاول مرة أخرى»

- [ ] **Step 4: The offline banner**

Create `src/components/offline-banner/offline-banner.jsx`:

```jsx
import { useSyncExternalStore } from 'react';
import { IconFeedback, iconifyName } from '@upriseedu-tech/design-tokens';

import Alert from '@mui/material/Alert';

import { useTranslate } from 'src/locales';
import { feedbackText } from 'src/utils/feedback';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

function subscribe(onChange) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

// The browser's own signal. Writes made while offline still get their own
// error.offline toast from notify.error (status 0); this says why first.
export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const { i18n } = useTranslate();
  if (online) return null;
  return (
    <Alert
      severity="warning"
      icon={<Iconify icon={iconifyName(IconFeedback.offline)} />}
      sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar + 1, borderRadius: 0 }}
    >
      {feedbackText(i18n.resolvedLanguage || i18n.language, 'error.offline')}
    </Alert>
  );
}
```

Create `src/components/offline-banner/index.js` with `export { default } from './offline-banner';`.

In `src/app.jsx`, import `OfflineBanner` from `src/components/offline-banner` and render `<OfflineBanner />` directly inside `<SnackbarProvider>`, before `<AuthProvider>`.

- [ ] **Step 5: Verify in the browser**

Start the dev server through the preview tool (`.claude/launch.json` entry for the dashboard; create it if missing, with `npm run dev:host`), and sign in with a local test account against a local backend. Then:
1. Run `window.dispatchEvent(new Event('offline'))` with `navigator.onLine` stubbed via `Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true })`. The banner shows "You're offline. Check your connection and try again." Switch the language to Arabic: the Arabic sentence shows. Restore with `online`.
2. Log in with a wrong password. One inline alert reads "The email or password is incorrect." (backend#140's `INVALID_CREDENTIALS`), and no toast appears.
3. Open a list, stop the local backend, and reload. The list shows the "Couldn't load this list" state with Try again, not the AxiosError text.

Take a screenshot of each for the PR.

- [ ] **Step 6: Lint, build, test, commit**

```bash
npm run lint && npm run build && npm test && npm run check:i18n
git add src/utils/axios.js src/auth/context/jwt/auth-provider.jsx src/components/templates/RebrandListView.jsx src/components/offline-banner src/app.jsx src/locales/langs/en.json src/locales/langs/ar.json
git commit -m "feat(feedback): report session end and suspension once, and say when the browser is offline"
```

Expected: all four pass, then the commit lands.

---

### Task 5: Solar Linear everywhere, bundled, and the nav from the registry

**Files:**
- Modify: `package.json`. Add devDependency `@iconify-json/solar` `1.2.12` (exact). Add scripts `icons:build` and `check:icons`, and append `&& npm run check:icons` to `lint`.
- Create: `scripts/codemod-solar-linear.mjs`
- Create: `scripts/build-solar-icons.mjs` → writes `src/components/iconify/solar-linear.json` (committed)
- Create: `scripts/check-icons.mjs`
- Modify: `src/components/iconify/index.js`. Register the collection.
- Modify: `src/layouts/app/config-navigation.jsx`. `NAV_ICONS` → registry.
- Modify: the three `calendar-toolbar.jsx` files under `src/sections/{events,food,orientation}/…/components/calendar-toolbar/`. View options become labels without icons.
- Delete: `src/components/icons-rebrand/` (`icon-map.js`, `RebrandNavIcon.jsx`, `RebrandIcon.jsx`) and `src/utils/icons.js`. None has an importer.

**Interfaces:**
- Consumes: `IconConcepts`, `IconActions`, `IconStatuses`, `IconFeedback`, `iconifyName` from 0.7.1.
- Produces:
  - Every icon string in `src` is `solar:<glyph>-linear` (or a flag), and present in the bundled collection.
  - `npm run check:icons` enforces both.

- [ ] **Step 1: Write the guard (the failing check)**

Create `scripts/check-icons.mjs`:

```js
#!/usr/bin/env node
// Every icon the dashboard draws is Solar Linear, from the bundled collection
// (spec 2026-10-15 §6). The 2026-10-15 audit counted 9 families and three
// Solar weights (bold-duotone 503, bold 235, linear 34), all fetched from
// api.iconify.design at runtime. Country and language flags are content and
// allowed. Exit 1 on any other icon string.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = JSON.parse(fs.readFileSync(path.join(root, 'src/components/iconify/solar-linear.json'), 'utf8'));
const FLAGS = /^(flagpack|circle-flags):/;

const files = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(name)) files.push(p);
  }
};
walk(path.join(root, 'src'));

const problems = [];
for (const file of files) {
  const rel = path.relative(root, file);
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/['"`]([a-z0-9-]+):([a-z0-9-]+)(\$\{)?/g)) {
      const [, prefix, name, templated] = m;
      const icon = `${prefix}:${name}`;
      if (['http', 'https', 'mailto', 'tel', 'data', 'blob'].includes(prefix)) continue;
      if (FLAGS.test(icon)) continue;
      if (prefix !== 'solar') {
        if (/^[a-z]+(-[a-z]+)*$/.test(prefix) && /-/.test(name)) problems.push(`${rel}:${i + 1}  ${icon} (not Solar)`);
        continue;
      }
      if (templated) problems.push(`${rel}:${i + 1}  solar:${name}\${…} (build the name with iconifyName)`);
      else if (!name.endsWith('-linear')) problems.push(`${rel}:${i + 1}  ${icon} (not Linear)`);
      else if (!bundle.icons[name.replace(/^solar:/, '')]) problems.push(`${rel}:${i + 1}  ${icon} (not in the bundle: npm run icons:build)`);
    }
    if (/`solar:\$\{/.test(line)) problems.push(`${rel}:${i + 1}  a Solar name built at runtime`);
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} icon(s) outside the registry's Solar Linear set`);
  process.exit(1);
}
console.log(`icons OK: ${Object.keys(bundle.icons).length} Solar Linear glyphs bundled`);
```

Add to `package.json` `scripts`:

```json
"icons:build": "node scripts/build-solar-icons.mjs",
"check:icons": "node scripts/check-icons.mjs",
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run check:icons`
Expected: a crash on the missing `solar-linear.json` (`ENOENT`). After Step 3 writes an empty bundle, it fails with over 700 problems: `(not Linear)`, `(not Solar)`, and the templated sites in `rhf-autocomplete.jsx` (flags, allowed) and `RebrandIcon.jsx`.

- [ ] **Step 3: The collection builder**

Create `scripts/build-solar-icons.mjs`:

```js
#!/usr/bin/env node
// Writes src/components/iconify/solar-linear.json: every Solar Linear glyph
// the source names, plus every glyph in the design-tokens registry (so a
// registry change is drawable without a code search). Committed: the build
// must not need @iconify-json/solar or the network.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { IconActions, IconConcepts, IconFeedback, IconStatuses, solarLinearName } from '@upriseedu-tech/design-tokens';

const require = createRequire(import.meta.url);
const solar = require('@iconify-json/solar/icons.json');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const names = new Set(
  [IconConcepts, IconActions, IconStatuses, IconFeedback].flatMap((m) => Object.values(m).map(solarLinearName))
);
const walk = (dir) =>
  fs.readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return fs.statSync(p).isDirectory() ? walk(p) : /\.(js|jsx)$/.test(n) ? [p] : [];
  });
for (const file of walk(path.join(root, 'src'))) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/solar:([a-z0-9-]+-linear)/g)) names.add(m[1]);
}

const missing = [...names].filter((n) => !solar.icons[n]);
if (missing.length) {
  console.error(`Not in Solar ${solar.info?.version ?? ''}:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
const icons = Object.fromEntries([...names].sort().map((n) => [n, solar.icons[n]]));
fs.writeFileSync(
  path.join(root, 'src/components/iconify/solar-linear.json'),
  `${JSON.stringify({ prefix: 'solar', width: solar.width ?? 24, height: solar.height ?? 24, icons })}\n`
);
console.log(`wrote ${names.size} glyphs`);
```

Install the source set: `npm install --save-dev --save-exact @iconify-json/solar@1.2.12`.

Register it. Replace `src/components/iconify/index.js` with:

```js
import { addCollection } from '@iconify/react';

import solarLinear from './solar-linear.json';

// Every Solar Linear glyph the dashboard draws, bundled by
// scripts/build-solar-icons.mjs. Without it each icon was fetched from
// api.iconify.design on first paint: icons popped in, and every page depended
// on a third-party API.
addCollection(solarLinear);

export { default } from './iconify';
```

- [ ] **Step 4: The codemod**

Create `scripts/codemod-solar-linear.mjs`:

```js
#!/usr/bin/env node
// One-off: every icon string in src to Solar Linear (spec 2026-10-15 §6.2).
// Solar weights become -linear where Solar has it; the other families map
// through the table below, chosen by meaning from the registry. Reports what
// it couldn't map and exits 1, so nothing is changed silently.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const solar = require('@iconify-json/solar/icons.json');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Non-Solar icons, by meaning (registry key in the comment).
const MAP = {
  'mdi:calendar-star': 'solar:confetti-linear', // concepts.events
  'mdi:message-text': 'solar:chat-round-dots-linear', // concepts.chat
  'mdi:cash': 'solar:bill-list-linear', // concepts.invoices
  'mdi:bell': 'solar:bell-linear', // concepts.notifications
  'gravity-ui:plus': 'solar:add-linear', // actions.add
  'mingcute:add-line': 'solar:add-linear',
  'eva:plus-fill': 'solar:add-linear',
  'eva:copy-fill': 'solar:copy-linear', // actions.copy
  'eva:arrow-ios-back-fill': 'solar:alt-arrow-left-linear', // actions.back
  'eva:arrow-ios-forward-fill': 'solar:alt-arrow-right-linear', // actions.forward
  'eva:arrow-ios-downward-fill': 'solar:alt-arrow-down-linear', // actions.expand
  'eva:checkmark-fill': 'solar:check-circle-linear', // feedback.success ("copied")
  'ic:edit': 'solar:pen-new-square-linear', // actions.edit
  'ic:round-filter-list': 'solar:filter-linear', // actions.filter
  'mingcute:more-1-fill': 'solar:menu-dots-linear', // actions.more
  // DataGrid density control: compact / standard / comfortable.
  'material-symbols:table-rows-narrow-rounded': 'solar:table-rows-split-linear',
  'mingcute:rows-4-fill': 'solar:list-linear',
  'mingcute:rows-2-fill': 'solar:paragraph-spacing-linear',
};
const WEIGHT = /(['"`])solar:([a-z0-9-]+?)-(bold-duotone|line-duotone|bold|outline|broken)\1/g;
const OTHER = /(['"`])((?:mdi|eva|ic|gravity-ui|mingcute|material-symbols|fluent):[a-z0-9-]+)\1/g;

const walk = (dir) =>
  fs.readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return fs.statSync(p).isDirectory() ? walk(p) : /\.(js|jsx)$/.test(n) ? [p] : [];
  });

const unmapped = [];
let changed = 0;
for (const file of walk(path.join(root, 'src'))) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(WEIGHT, (all, q, name) => {
      if (solar.icons[`${name}-linear`]) return `${q}solar:${name}-linear${q}`;
      unmapped.push(`${path.relative(root, file)}  solar:${name} (no -linear)`);
      return all;
    })
    .replace(OTHER, (all, q, icon) => {
      if (MAP[icon]) return `${q}${MAP[icon]}${q}`;
      unmapped.push(`${path.relative(root, file)}  ${icon}`);
      return all;
    });
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}
console.log(`rewrote ${changed} files`);
if (unmapped.length) {
  console.error(`\nunmapped:\n  ${unmapped.join('\n  ')}`);
  process.exit(1);
}
```

Before running it, remove the four `fluent:`/`mingcute:` view icons by hand. In each of the three `calendar-toolbar.jsx` files:
- Delete the `icon:` property from every `VIEW_OPTIONS` entry.
- Delete `startIcon={<Iconify icon={selectedItem.icon} />}` from the view button.
- In the popover menu, delete the `<Iconify icon={viewOption.icon} />` line, so each view option shows only its label.

Month, week, day and agenda read clearly as words, and none of them is a registry concept.

Delete the dead icon maps:

```bash
git rm -r src/components/icons-rebrand src/utils/icons.js
```

Then run the codemod and the builder:

```bash
node scripts/codemod-solar-linear.mjs
npm run icons:build
```

Expected: `rewrote N files` with no unmapped list, then `wrote M glyphs`. If the codemod lists a `solar:<x>` with no `-linear`, open the file, pick the Linear glyph closest in meaning (check it exists: `node -e "console.log(!!require('@iconify-json/solar/icons.json').icons['<name>-linear'])"`), edit the line by hand, and record the choice for the PR.

- [ ] **Step 5: The nav from the registry**

In `src/layouts/app/config-navigation.jsx`, replace the `NAV_ICONS` object and the `icon` helper with:

```jsx
// One registry concept per nav item (spec 2026-10-15 §6): 37 items, 37 glyphs.
// The old map gave six items one folder and four items one lock.
const navIcon = (concept) => <Iconify icon={iconifyName(IconConcepts[concept])} width={22} />;
```

Add `import { IconConcepts, iconifyName } from '@upriseedu-tech/design-tokens';`. Then replace each item's `icon: icon('<key>')` by its title:

| Item title (`t('…')`) | `icon:` |
|---|---|
| Home | `navIcon('home')` |
| Students | `navIcon('students')` |
| Parents | `navIcon('parents')` |
| Staff | `navIcon('staff')` |
| Class Room | `navIcon('classes')` |
| Students Attendance | `navIcon('studentAttendance')` |
| Attendance | `navIcon('staffAttendance')` |
| Vacation | `navIcon('vacation')` |
| Pickup | `navIcon('pickup')` |
| Late Checkout | `navIcon('lateCheckout')` |
| Orientation | `navIcon('orientation')` |
| Events | `navIcon('events')` |
| Food Schedule | `navIcon('food')` |
| Daily Schedule | `navIcon('dailySchedule')` |
| Learning | `navIcon('learning')` |
| Progress Report | `navIcon('progressReports')` |
| Accident Reports | `navIcon('accidentReports')` |
| Uploads | `navIcon('gallery')` |
| Admin Chat | `navIcon('chat')` |
| Announcements | `navIcon('announcements')` |
| Reviews | `navIcon('reviews')` |
| Website messages | `navIcon('websiteMessages')` |
| Nurseries | `navIcon('nurseries')` |
| Branches | `navIcon('branches')` |
| Branch QR | `navIcon('branchQr')` |
| Super Admin Dashboard | `navIcon('dashboard')` |
| Login Analytics | `navIcon('analytics')` |
| Invoice | `navIcon('invoices')` |
| Quotation | `navIcon('quotations')` |
| Document Templates | `navIcon('documentTemplates')` |
| Request Logs | `navIcon('requestLogs')` |
| Deleted Data | `navIcon('deletedData')` |
| Nursery Policy | `navIcon('nurseryPolicy')` |
| Nursery Settings | `navIcon('nurserySettings')` |
| System Settings | `navIcon('systemSettings')` |
| App Versions | `navIcon('appVersions')` |
| Staff Roles | `navIcon('staffRoles')` |

Then confirm no item still calls the old helper, and that all 37 glyphs are distinct:

```bash
grep -c "icon('" src/layouts/app/config-navigation.jsx
grep -o "navIcon('[a-zA-Z]*')" src/layouts/app/config-navigation.jsx | sort | uniq -d
```

Expected: `0`, and no duplicates.

- [ ] **Step 6: Run the guards, build, and look**

```bash
npm run check:icons
npm run lint && npm run build && npm test
```

Expected: `icons OK: M Solar Linear glyphs bundled`, then lint, build and tests pass.

In the browser preview, with DevTools' Network tab filtered to `iconify`:
- reload the dashboard: no request to `api.iconify.design`;
- the side nav shows 37 distinct line glyphs;
- the snackbar, calendar toolbar and notifications popover draw.

Take before and after screenshots of the nav for the PR.

- [ ] **Step 7: Commit**

```bash
git add -A src scripts package.json package-lock.json
git diff --cached --stat | tail -3
git commit -m "feat(icons): Solar Linear from the registry, bundled, with one glyph per nav item"
```

---

### Task 6: The feedback guard, with the sweep's pending list

**Files:**
- Create: `scripts/check-feedback.mjs`
- Modify: `package.json`. Add script `check:feedback`, and append `&& npm run check:feedback` to `lint`.

**Interfaces:**
- Produces:
  - `npm run check:feedback` fails on a toast outside `useNotify`, on server text, and on `window.confirm`, in any folder not in `PENDING_SWEEP`.
  - Tasks 7–9 empty `PENDING_SWEEP`.

- [ ] **Step 1: Write the guard**

Create `scripts/check-feedback.mjs`:

```js
#!/usr/bin/env node
// One feedback system (spec 2026-10-15 §5.2, §10). Fails on:
//   - enqueueSnackbar / useSnackbar outside the notify hook and the providers
//   - the server's text on screen (response.data.message, data?.message)
//   - window.confirm
// PENDING_SWEEP lists the folders the sweep PRs (Plan 7 Tasks 7-9) haven't
// reached yet; each sweep deletes its lines, and the last leaves it empty.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const PENDING_SWEEP = [
  // Task 7: people and attendance
  'src/components/forms/',
  'src/sections/students/',
  'src/sections/parents/',
  'src/sections/staff/',
  'src/sections/classRoom/',
  'src/sections/attendance/',
  'src/sections/student-attendance/',
  'src/pages/student-attendance/',
  'src/sections/late-checkout/',
  'src/sections/account/',
  'src/hooks/use-rebrand-mutation.js',
  'src/utils/extract-error-message.js',
  // Task 8: operations and communication
  'src/sections/upload/',
  'src/sections/progressReport/',
  'src/sections/chat/',
  'src/sections/accident-reports/',
  'src/sections/orientation/',
  'src/sections/reviews/',
  'src/sections/contact-messages/',
  'src/components/fcm-bridge.jsx',
  // Task 9: organisation, settings and the Uprise team
  'src/sections/super-admin/',
  'src/sections/invoice/',
  'src/sections/nursery/',
  'src/sections/nursery-settings/',
  'src/sections/nursery-policy/',
  'src/sections/deleted-data/',
  'src/sections/app-versions/',
  'src/sections/staff-roles/',
  'src/sections/branch-qr/',
  'src/sections/branch/',
  'src/sections/system-settings/',
];
const ALLOWED = ['src/hooks/use-notify.js', 'src/components/snackbar/', 'src/auth/context/jwt/auth-provider.jsx'];

const RULES = [
  [/\benqueueSnackbar\s*\(|\buseSnackbar\b/, 'toast outside useNotify'],
  [/\bdata\??\.message\b/, "the server's message on screen"],
  [/\bwindow\.confirm\s*\(/, 'window.confirm (use ConfirmDialog)'],
];

const files = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(name) && !/\.test\.mjs$/.test(name)) files.push(p);
  }
};
walk(path.join(root, 'src'));

const problems = [];
for (const file of files) {
  const rel = path.relative(root, file);
  if (ALLOWED.some((a) => rel.startsWith(a)) || PENDING_SWEEP.some((p) => rel.startsWith(p))) continue;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;
    for (const [re, why] of RULES) if (re.test(line)) problems.push(`${rel}:${i + 1}  ${why}: ${line.trim()}`);
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} feedback violation(s); ${PENDING_SWEEP.length} folder(s) still pending`);
  process.exit(1);
}
console.log(`feedback OK; ${PENDING_SWEEP.length} folder(s) still pending the sweep`);
```

Add `"check:feedback": "node scripts/check-feedback.mjs",` to `package.json`, and append `&& npm run check:feedback` to `lint`.

- [ ] **Step 2: Run it, and fix what's outside the pending list**

Run: `npm run check:feedback`
Expected: it fails on the files no sweep folder covers. For example, `src/layouts/common/notifications-popover/index.jsx` and any `src/utils` or `src/api` file that reads `data?.message`.

Fix each by the conversion rules in Task 7, Step 2. One exception: an `src/api/*` helper that maps codes, such as `announcementErrorKey`, which reads `data.code`, not `message`, so it passes. Rerun until it prints `feedback OK; 31 folder(s) still pending the sweep`.

- [ ] **Step 3: Lint, build, commit, PR**

```bash
npm run lint && npm run build && npm test
git add scripts/check-feedback.mjs package.json src
git commit -m "chore(feedback): a guard for one feedback system, with the sweep's pending folders"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/dashboard.git HEAD:refs/heads/feat/dashboard-feedback-icons
```

Open the PR `feat: one feedback system and Solar Linear icons (foundations)` against `master`. Its `## Verification` section has:
- `npm test` counts;
- `check:icons`, `check:feedback` and `check:i18n` output;
- the Task 4 and Task 5 screenshots;
- the Network panel showing no `api.iconify.design` request.

Grep the diff for `localhost` and `HOST_API` before pushing: `git diff origin/master --stat && git diff origin/master | grep -n "localhost\|HOST_API"` must print nothing new. The owner merges it as `upriseEdu-tech`.

---

### Task 7: Sweep A: people and attendance

**Files:** every file under the Task 7 entries of `PENDING_SWEEP`.

**Interfaces:**
- Consumes:
  - `useNotify`, `ConfirmDeleteDialog`, `ConfirmDialog` (`submitLabel`/`submitColor`)
  - `RebrandListView` (`error`, `onRetry`)
  - the catalogue item keys (0.7.1)

Start from `origin/master` after the Task 6 PR has merged: `git worktree add -b feat/dashboard-sweep-people ../.worktrees/dashboard-sweep-people origin/master`, then link `node_modules`.

- [ ] **Step 1: Make the guard see this section (the failing check)**

Delete the 12 Task 7 lines from `PENDING_SWEEP` in `scripts/check-feedback.mjs`.

Run: `npm run check:feedback`
Expected: FAIL, listing this section's violations, about 120.

- [ ] **Step 2: Convert every listed line by these rules**

| Today | Becomes |
|---|---|
| `const { enqueueSnackbar } = useSnackbar();` | `const notify = useNotify();` from `src/hooks/use-notify` |
| `enqueueSnackbar(t('Create success!'))`, "Created successfully" | `notify.success('created', '<item>')` |
| `enqueueSnackbar(t('Update success!'))`, "Updated", "Saved" | `notify.success('updated', '<item>')` or `('saved', '<item>')` |
| `enqueueSnackbar(t('Delete success!'))` | `notify.success('deleted', '<item>')` |
| Any error toast, including `error.message`, `err?.response?.data?.message \|\| t('…')` and a literal | `notify.error(error, '<action>', '<item>')` |
| A warning about input ("Please select a class") | An inline field error: `setError('<field>', { message: t('…') })` in a react-hook-form form, or the form's Yup schema. Outside a form, `notify.info(t('…'))` |
| A plain info line | `notify.info(t('…'))` (add the key to en and ar) |
| A success toast on an instant toggle (switch, checkbox, select) | Removed: the control's new state is the feedback (spec §5) |
| `window.confirm(t('Delete this shift?'))` | A `ConfirmDeleteDialog` (`item="shift"`); for "Remove … from their shift?", `ConfirmDialog` with `submitLabel={t('Remove')}` and `submitColor="error"` |
| A delete with no confirmation | `ConfirmDeleteDialog` before it runs |
| A `ConfirmDialog` asking to delete | `ConfirmDeleteDialog` with the item key |
| `catch (e) { console.error(e) }` around a write (`scheduleForm.jsx:80`, `ExisitingForm.jsx:54`, `settingsForm.jsx:91`, `specialDayForm.jsx:90`) | Keep the `console.error` and add `notify.error(e, '<action>', '<item>')` |
| A list with `RebrandListView` that ignores its hook's `error` | Pass `error={error}` and `onRetry={() => mutate()}`. If the hook doesn't return `mutate`, add it to the hook's returned object from `useSWR`'s result |

**Choosing `<action>` and `<item>`.**
- `<action>` is one of: `save`, `create`, `update`, `delete`, `send`, `approve`, `reject`, `upload`, `submit`, `load`, `generate`, `restore`, `assign`.
- `<item>` is a key of `FeedbackMessages.en.items`. Pick the noun the user acted on, for example `staffMember` on the staff list and `student` on the student form.
- If no item fits, add it to the catalogue in a `design-tokens` patch (with Arabic) rather than using a near miss.

**Two specific sites:**
- In `src/components/forms/eventForm/eventForm.jsx`, the event delete (`handleDelete`, wired directly to the error button) gets a `ConfirmDeleteDialog` with `item="event"`.
- Delete `src/utils/extract-error-message.js` (its only caller, `studentForm.jsx`, now uses `notify.error`) and `src/hooks/use-rebrand-mutation.js`, which has no importer: `git grep -n "use-rebrand-mutation" src` prints nothing.

**Icons on these screens** (spec §6.1 rule 4):
- A detail page drops per-field label icons. Dates, times and IDs get no decorative icon.
- A list row doesn't repeat the section's nav glyph.
- A page header doesn't repeat its nav item's glyph.

**Pagination.** `src/sections/late-checkout/report-view.jsx` and `src/pages/student-attendance/date-range-summary-view.jsx` render unpaginated tables of rows that grow with the date range. Give them the `useTable` + `TablePaginationCustom` pattern from `src/sections/branch/branch-list-view/branch-list-view.jsx`, with 25 rows per page.

- [ ] **Step 3: Run the guards**

```bash
npm run check:feedback
npm run check:icons
npm run check:i18n
npm run lint && npm run build && npm test
```

Expected: `feedback OK; 19 folder(s) still pending the sweep`, `icons OK`, `i18n parity OK`, then lint, build and tests pass.

- [ ] **Step 4: Check it in the browser, in English and Arabic**

Sign in as an Owner and as a Branch_Admin on the local backend. On Students, Parents, Staff, Class Room, Attendance (records, settings, staff shifts), Students Attendance and Late Checkout:
- one save
- one delete: the confirmation shows, then the "… deleted." toast
- one failed write: stop the backend, or submit a duplicate; one error toast in the catalogue's words
- one failed load: the list's Try again state

Repeat once with the language set to Arabic. Take a screenshot of each toast and confirmation for the PR.

- [ ] **Step 5: Commit, push, PR**

```bash
git add -A src scripts
git commit -m "feat(feedback): people and attendance speak the catalogue, and deletes ask first"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/dashboard.git HEAD:refs/heads/feat/dashboard-sweep-people
```

The PR's `## Verification` section has:
- the four guard outputs
- the per-screen checklist above, ticked
- the English and Arabic screenshots

The owner merges it as `upriseEdu-tech`.

---

### Task 8: Sweep B: operations and communication

**Files:** every file under the Task 8 entries of `PENDING_SWEEP`.

**Interfaces:**
- Consumes: the same as Task 7.

Start from `origin/master` after the Task 7 PR merges: `git worktree add -b feat/dashboard-sweep-operations ../.worktrees/dashboard-sweep-operations origin/master`.

- [ ] **Step 1: Make the guard see this section (the failing check)**

Delete the 8 Task 8 lines from `PENDING_SWEEP`.

Run: `npm run check:feedback`
Expected: FAIL, listing this section's violations, about 65.

- [ ] **Step 2: Convert every listed line**

Apply Task 7 Step 2's conversion table. The rules again, for a reader starting here:
- Toasts go through `const notify = useNotify()`:
  - `notify.success('<kind>', '<item>')`, where `<kind>` is one of `saved`, `created`, `updated`, `deleted`, `sent`, `approved`, `rejected`, `uploaded`, `submitted`, `generated`, `restored`
  - `notify.error(err, '<action>', '<item>')`
  - `notify.info(t('…'))`
- Input warnings become inline field errors.
- Toggles stay silent.
- Deletes use `ConfirmDeleteDialog` with the item key.
- Write `catch` blocks that only `console.*` also call `notify.error`. Here that's `src/sections/upload/tag/tag.jsx:36`.
- Lists pass `error` and `onRetry`.

**Section-specific sites:**
- `src/sections/upload/album-list-view/album-list-view.jsx` passes `onRetry={() => window.location.reload()}`. Replace that with the album hook's `mutate`.
- Chat send failures are writes and get `notify.error(err, 'send', 'message')`.
- Accident report review is a write: approve and reject use `notify.success('approved' | 'rejected', 'accidentReport')`.
- Detail pages for accident reports, progress reports and orientation bookings drop per-field label icons, per rule 4.

- [ ] **Step 3: Run the guards**

```bash
npm run check:feedback && npm run check:icons && npm run check:i18n
npm run lint && npm run build && npm test
```

Expected: `feedback OK; 11 folder(s) still pending the sweep`, then the rest pass.

- [ ] **Step 4: Check it in the browser, in English and Arabic**

Run Task 7 Step 4's checklist on Uploads (albums, photos, tags), Progress Report, Admin Chat, Accident Reports, Orientation, Reviews and Website messages. On Admin Chat, a failed send shows one toast and leaves the typed text in the box.

- [ ] **Step 5: Commit, push, PR**

```bash
git add -A src scripts
git commit -m "feat(feedback): operations and communication speak the catalogue"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/dashboard.git HEAD:refs/heads/feat/dashboard-sweep-operations
```

Open the PR with Task 7 Step 5's Verification contents.

---

### Task 9: Sweep C: organisation, settings and the Uprise team, and the guard's list empties

**Files:**
- every file under the Task 9 entries of `PENDING_SWEEP`
- `scripts/check-feedback.mjs`

**Interfaces:**
- Consumes: the same as Task 7.
- Produces: `PENDING_SWEEP` is empty, so the rule holds for all of `src`.

Start from `origin/master` after the Task 8 PR merges: `git worktree add -b feat/dashboard-sweep-org ../.worktrees/dashboard-sweep-org origin/master`.

- [ ] **Step 1: Empty the pending list (the failing check)**

Replace the whole `PENDING_SWEEP` array in `scripts/check-feedback.mjs` with `const PENDING_SWEEP = [];`, and change the header comment's last line to: "The sweep is done: the rule holds for all of src."

Run: `npm run check:feedback`
Expected: FAIL, listing this section's violations, about 125.

- [ ] **Step 2: Convert every listed line**

Apply Task 7 Step 2's conversion table, with the rules as restated in Task 8 Step 2.

**Section-specific sites:**
- **Invoice generation** uses `notify.success('generated', 'invoice')`, and **payments** use `'payment'`.
- **Deleted data:** restore uses `notify.success('restored', '<item>')`, with the restored row's item key.
- **Staff roles and module access:** `src/sections/staff-roles/module-access-view.jsx:210` has `await mutate().catch(() => {})`. Keep the catch, but make the toggle that triggered it report through `notify.error(err, 'update', 'role')` when the write itself fails.
- **App versions, branch QR and system settings** use the items `appVersion`, `qrCode` and `settings`.
- **Announcements (super admin):** `announcement-table.jsx` already maps codes with `announcementErrorKey`. Replace that with `notify.error(error, '<action>', 'announcement')`. The catalogue covers the same codes (`NOT_PENDING`, `NO_RECIPIENTS`, `NOT_EDITABLE`, …). Delete `announcementErrorKey` and its `t()` keys if they become unused.
- **Pagination:** `src/sections/login-analytics/login-analytics-table.jsx` and `src/sections/super-admin/announcements/announcement-table.jsx` get Task 7's pagination pattern, with 25 rows per page.

- [ ] **Step 3: Run the guards, and measure**

```bash
npm run check:feedback && npm run check:icons && npm run check:i18n
npm run lint && npm run build && npm test
git grep -c "enqueueSnackbar(" -- src | grep -v "use-notify\|snackbar/\|auth-provider" | wc -l
```

Expected:
- `feedback OK; 0 folder(s) still pending the sweep`. The rest pass.
- The last line prints `0`, against 314 call sites on 2026-10-15.

Then run Lighthouse on the dashboard's Home, Students list and Invoice list. Use the preview build: `npm run build && npm run start`, signed in. Record Performance, LCP and CLS for the PR, next to the same pages measured on `origin/master` before Task 2. The spec's target is "nothing jumps": CLS under 0.1 on those three pages.

- [ ] **Step 4: Check it in the browser, in English and Arabic**

Run Task 7 Step 4's checklist as Super_Admin on the following:
- Nurseries, Branches and Branch QR
- Invoice: generate, record a payment, delete
- Quotation and Document Templates
- Deleted Data: restore
- Nursery Policy and Nursery Settings
- System Settings, App Versions and Staff Roles

- [ ] **Step 5: Commit, push, PR**

```bash
git add -A src scripts
git commit -m "feat(feedback): organisation and settings speak the catalogue; the guard covers all of src"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/dashboard.git HEAD:refs/heads/feat/dashboard-sweep-org
```

Open the PR with Task 7 Step 5's Verification contents, plus the Lighthouse before and after table and the `enqueueSnackbar` count, 314 → 0. The owner merges it as `upriseEdu-tech`; Vercel deploys.
