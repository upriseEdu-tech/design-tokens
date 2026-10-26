# Plan 2: Dashboard dark mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The admin dashboard follows the browser's light/dark setting, has a System / Light / Dark switch in the header, and renders graphite dark from `@upriseedu-tech/design-tokens` 0.8.0, with no flash on load.

**Architecture:**
- `src/theme/scheme-colours.js` is a pure module. It holds the real light and dark value of every colour that `tokens.js` exports, built from 0.8.0's `Roles`, `sharedHomeTokens(scheme)` and `resolveColour`.
- `tokens.js` keeps every export name. Its colour values become `var(--uprise-…)` strings, so the ~430 `sx` call sites in 78 files don't change. A `GlobalStyles` writes both schemes' values, and `<html data-color-scheme>` picks one.
- Code that computes on colours (MUI `palette`, `alpha()`, shadows, ApexCharts) reads the real values from `scheme-colours.js`, never the variables.
- The preference is a new `colorScheme` setting, `'system'` by default. A tiny inline script in `index.html` applies it before the bundle loads.

**Tech Stack:** React 18, Vite, MUI 5.14, `node --test` (`npm test`), the `npm run lint` chain (eslint + `check:tokens`, `check:icons`, `check:feedback`, `check:i18n-keys`, `check:hardcoded-text`, `check:nested-scroll`).

**Spec:** `docs/superpowers/specs/2026-10-26-dark-mode-design.md` ("Dashboard" section). Roadmap: `docs/superpowers/plans/2026-10-27-dark-mode-roadmap.md`. Builds on Plan 1 (`design-tokens` 0.8.0: `Roles`, `sharedHomeTokens(scheme)`, `resolveColour`, `contrastRatio`).

## Global Constraints

- **Starts after** `@upriseedu-tech/design-tokens@0.8.0` is published (Plan 1 Task 4 Step 4). Bump `"@upriseedu-tech/design-tokens": "^0.8.0"`; the install needs `UPRISE_NPM_TOKEN` in the environment (`.npmrc` reads it). Never print it.
- Worktree `.worktrees/dash-dark-mode`, branch `feat/dark-mode` off `origin/master`. Conventional Commits, authored by Fady Shawky, no AI attribution. Merge as `upriseEdu-tech` so Vercel deploys.
- Every export name in `src/theme/tokens.js` stays. Non-colour values (radii, spacing, font sizes, motion, aspect) are untouched.
- **Light changes only where Plan 1 consolidated** (the 13 `SharedHomeTokens` / `NavigationShellTokens` values, which arrive through the package), plus the dashboard's own secondary text: `palette.text.secondary` moves from `#6F6B8A` (4.47:1 on the chip surface) to `Roles.light.textMuted` `#63607E`. `faintColor` stays `#9994B0` in light; it is a tertiary hint, outside the approved list.
- A dark value is a role from `Roles.dark`, or a `{ same }` accent. Never a new hex.
- **Nursery logos and in-app paper documents stay light in dark:** the welcome logo shell, the document-template editor's page, and the quotation/contract previews.
- **Strings:** en/ar through `t('…')`, where the key *is* the English sentence. `npm run lint`'s `check:i18n-keys` and `check:hardcoded-text` must pass.
- **Layout rules hold:** one page scroll (no nested scroll boxes), full width (`maxWidth={false}`).
- **Gates:** `npm test`, `npm run lint`, `npm run build`. Before every commit, grep the diff for `localhost` / `HOST_API`; a localhost API URL in prod once broke every login.

## Review Focus

1. **Existing visitors' stored settings.** The `settings` key in localStorage already holds `themeMode: 'light'` for most browsers (template defaults), and no one ever chose it. Reusing `themeMode` would trap them in light. The new `colorScheme` key ignores `themeMode`. Test in Task 4.
2. **A CSS variable reaching JS colour maths.** MUI's `alpha('var(--x)')` throws and blanks the screen it's on. A static test in Task 2 fails on `alpha|darken|lighten|emphasize|getContrastText` applied to a `Rebrand*` / `REBRAND_*` value anywhere in `src`.
3. **Paper documents in dark.** The template editor and contract previews draw white paper. Inherited dark-theme text would be light-on-white and unreadable. Task 5 wraps them in `ForceLightScheme`, and its test checks the wrapper sets both the attribute and a light MUI theme.
4. **First paint.** A hard reload in dark must not flash the light canvas. The same goes for the sign-in pages, which render before any user is known. The inline script handles it (Task 4); the browser pass checks it with cache disabled.
5. **The device flipping while a tab is open** (`System` + the OS switching at sunset). The `matchMedia` listener must re-render. The pure resolver is tested in Task 4; the browser pass toggles DevTools' "prefers-color-scheme".

---

## File structure

| Path | Responsibility |
|---|---|
| `src/theme/scheme-colours.js` (create) | `COLOUR_SOURCES`, `schemeColours(scheme)`: real values per scheme; `paletteColours(scheme)` for MUI |
| `src/theme/scheme-colours.test.mjs` (create) | light pins, dark-is-a-role, AA on paper/default |
| `src/theme/colour-variables.js` (create) | `cssVar(name)`, `colourVariablesCss()`: the `:root` / `[data-color-scheme]` CSS text |
| `src/theme/colour-variables.test.mjs` (create) | every variable defined in both schemes; no colour maths on tokens (static scan) |
| `src/theme/tokens.js` (modify) | colour values → `cssVar(...)`; numbers unchanged |
| `src/theme/palette.js`, `shadows.js`, `custom-shadows.js`, `overrides/components/drawer.js` (modify) | real per-mode values from `scheme-colours.js` |
| `src/theme/color-scheme.js` (create) | `readColorSchemePreference(settings)`, `resolveColorScheme(preference, systemPrefersDark)` |
| `src/theme/color-scheme.test.mjs` (create) | preference and resolution rules |
| `src/theme/use-resolved-color-scheme.js` (create) | hook: settings + `matchMedia` → `'light' \| 'dark'`, sets `<html data-color-scheme>` |
| `src/theme/index.jsx` (modify) | builds the theme from the resolved scheme; mounts the variables `GlobalStyles` |
| `src/theme/force-light-scheme.jsx` (create) | nested light MUI theme + `data-color-scheme="light"` |
| `src/components/theme-mode-popover/` (create) | header switch, modelled on `language-popover` |
| `src/layouts/app/header.jsx`, `src/app.jsx`, `index.html`, `src/global.css`, `src/locales/langs/{en,ar}.json` (modify) | mount, defaults, no-flash script, CSS variable, strings |
| `src/assets/illustrations/*` (delete 12 + index lines) | unused template art |
| files listed in Task 5 (modify) | literal sweep, charts, paper wrappers |

---

### Task 1: Per-scheme colour values

**Files:**
- Create: `src/theme/scheme-colours.js`, `src/theme/scheme-colours.test.mjs`
- Modify: `package.json`, `package-lock.json` (design-tokens `^0.8.0`)

**Interfaces:**
- Consumes: `Roles`, `sharedHomeTokens`, `resolveColour`, `contrastRatio`, `Colors`, all from `@upriseedu-tech/design-tokens` 0.8.0.
- Produces:
  - `COLOUR_SOURCES`: `{ tokens: {key: ColourSource}, palette: {key: ColourSource}, hues: {key: ColourSource}, surfaces: {name: ColourSource} }`
  - `schemeColours(scheme: 'light' | 'dark')`: the same shape with real values. `tokens` also carries every `sharedHomeTokens(scheme)` colour key.
  - `paletteColours(scheme)`: `{ text: {primary, secondary, disabled}, background: {default, paper, paperElevated, neutral}, divider, shadow }`

**Sources** (★ marks a light value that changes). The keys are today's `tokens.js` names:

| Group / key | Source |
|---|---|
| `tokens`: every `SharedHomeTokens` colour key | from `sharedHomeTokens(scheme)` (Plan 1) |
| `tokens.faintColor` | `{ light: '#9994B0', dark: 'textMuted' }` |
| `tokens.heroSurface`, `tokens.priorityPairSurface` | `surfaceFrosted` |
| `tokens.foodSurface`, `tokens.chatSurface` | `surface` |
| `tokens.foodHeaderSurface` | `{ light: '#F8F8FC', dark: 'surfaceRaised' }` |
| `tokens.foodBorder` / `tokens.foodSeparator` | `border` / `borderStrong` |
| `tokens.foodDateChipBg` / `tokens.foodDateChipText` | `{ light: '#F1F1F4', dark: 'surfaceSunken' }` / `{ light: '#2A2740', dark: 'text' }` |
| `tokens.chatIconBg` | `{ same: 'rgba(132,129,253,0.14)' }` |
| `tokens.chatIconTint` | `primaryText` |
| `tokens.welcomeLogoShellBg` / `tokens.welcomeLogoShellBorder` | `{ same: '#F4F4F7' }` / `{ same: 'rgba(132,129,253,0.18)' }`: a nursery logo keeps its light tile |
| `palette.<f>100` / `<f>10` / `<f>20` / `<f>Text` (6 families) | `<f>` / `<f>Tint` / `<f>TintStrong` / `<f>Text` |
| `palette.<f>50`, `palette.<f>5` | `{ light: Colors.<f>50 \| <f>5, dark: '<f>TintStrong' \| '<f>Tint' }` |
| `palette.green` / `red` / `neutralText` | `success` / `danger` / `textMuted` |
| `palette.greenText` ★ `#3A8238`→`#357733`, `palette.redText` ★ `#CE3C3E`→`#C63234` | `successText` / `dangerText` |
| `palette.black` / `palette.white` | `{ same: '#000000' }` / `{ same: '#FFFFFF' }` |
| `hues.people` / `billing` / `alerts` / `finance` / `students` / `caution` | `teal` / `primary` / `coral` / `orange` / `blue` / `yellow` |
| `surfaces.canvas` / `surface` / `sidebar` | `canvas` / `surface` / `surface` |
| `surfaces.surface2` | `{ light: '#FAF9FE', dark: 'surfaceRaised' }` |
| `surfaces.frosted` / `elevated` | `surfaceFrosted` / `surfaceElevatedAndroid` |

`paletteColours`: `text.primary` = `text`, `text.secondary` = `textMuted` (★ in light), `text.disabled` = `{ light: grey[500] '#8C8AA1', dark: 'borderStrong' }`. `background.default` / `paper` / `paperElevated` / `neutral` = `canvas` / `surface` / `surfaces.surface2` / `surfaceSunken`. `divider` = `border`; `shadow` = `shadow`.

- [ ] **Step 1: Capture today's light values, before anything changes**

Run: `node --input-type=module -e "import * as t from './src/theme/tokens.js'; import fs from 'node:fs'; fs.mkdirSync('src/theme/__fixtures__',{recursive:true}); fs.writeFileSync('src/theme/__fixtures__/tokens-light-before.json', JSON.stringify({RebrandTokens:t.RebrandTokens,RebrandPalette:t.RebrandPalette,RebrandHues:t.RebrandHues,REBRAND:Object.fromEntries(Object.entries(t).filter(([k])=>k.startsWith('REBRAND_')))},null,2)+'\n')"`
Expected: the file exists, and `RebrandTokens.subtitleColor` in it is `#6F6B8A` (0.7.2, before the bump).

- [ ] **Step 2: Bump the package**

Run: `npm install @upriseedu-tech/design-tokens@^0.8.0 --legacy-peer-deps`
Expected: `package.json` reads `^0.8.0`, and `node -e "import('@upriseedu-tech/design-tokens').then(m=>console.log(m.Roles.dark.canvas))"` prints `#121214`.

- [ ] **Step 3: Write the failing test `src/theme/scheme-colours.test.mjs`**

```js
// Run: node --test src/theme/scheme-colours.test.mjs
test('light tokens equal tokens.js today except the listed moves', …); // imports the 0.7.2-era literals table below as a fixture
test('every dark value is a Roles.dark value or a { same } accent', …);    // walk COLOUR_SOURCES
test('welcome logo shell is the same light tile in both schemes', () =>
  assert.equal(schemeColours('dark').tokens.welcomeLogoShellBg, '#F4F4F7'));
for (const scheme of ['light', 'dark']) {
  test(`${scheme}: text.primary and text.secondary reach 4.5:1 on background.default and paper`, …); // contrastRatio
}
test('light text.secondary is #63607E (consolidated), dark is #A1A1AA', …);
```

The light pins come from the Step 1 fixture. The allowed moves are the Plan 1 list (arriving through `SharedHomeTokens`) plus `palette.greenText` and `palette.redText`.

- [ ] **Step 4: Run it and confirm it fails**

Run: `node --test src/theme/scheme-colours.test.mjs`
Expected: FAIL, because `scheme-colours.js` does not exist.

- [ ] **Step 5: Implement `src/theme/scheme-colours.js`**

It is pure (it imports only the package) and uses explicit `.js` extensions, so `node --test` can load it.

- [ ] **Step 6: Run the test and the suite**

Run: `node --test src/theme/scheme-colours.test.mjs && npm test`
Expected: PASS. No light value outside the allowed moves changes.

- [ ] **Step 7: Commit**

`feat(theme): light and dark values for every dashboard colour token, from design-tokens 0.8.0`

---

### Task 2: Tokens become CSS variables

**Files:**
- Create: `src/theme/colour-variables.js`, `src/theme/colour-variables.test.mjs`
- Modify: `src/theme/tokens.js`, `src/theme/index.jsx` (mount), `src/global.css`

**Interfaces:**
- Consumes: `COLOUR_SOURCES`, `schemeColours` (Task 1).
- Produces:
  - `cssVar(group: string, key: string): string`, returning `var(--uprise-<group>-<kebab-key>)`
  - `colourVariablesCss(): string`, a stylesheet with `:root, [data-color-scheme="light"] { …light }` and `[data-color-scheme="dark"] { …dark; color-scheme: dark }`
  - `tokens.js`: every colour value in `RebrandTokens`, `RebrandPalette`, `RebrandHues` and the `REBRAND_*` constants is a `cssVar(...)` string. `REBRAND_PAPER_GRADIENT` and `REBRAND_PAGE_GRADIENT` are built from variables.

- [ ] **Step 1: Write the failing test `src/theme/colour-variables.test.mjs`**

```js
test('every colour export in tokens.js is a var(--uprise-…) string; numbers unchanged', …);
test('every variable tokens.js references is defined in both schemes of colourVariablesCss()', …);
test('dark block sets color-scheme: dark', …);
// Review Focus 2: a variable must never reach JS colour maths.
test('no alpha/darken/lighten/emphasize/getContrastText on a Rebrand*/REBRAND_ value anywhere in src', () => {
  const offenders = walk('src').filter(f => /\.(jsx?|mjs)$/.test(f))
    .flatMap(f => [...fs.readFileSync(f, 'utf8').matchAll(/(alpha|darken|lighten|emphasize|getContrastText)\(\s*(RebrandTokens|RebrandPalette|RebrandHues|REBRAND_)/g)].map(m => `${f}: ${m[0]}`));
  assert.deepEqual(offenders, []);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test src/theme/colour-variables.test.mjs`
Expected: FAIL. The module is missing, and the static scan lists the 4 known sites: `palette.js:103,104,107` and `overrides/components/drawer.js:10`.

- [ ] **Step 3: Implement it.**
  - `colour-variables.js` serialises `schemeColours('light' | 'dark')`.
  - `tokens.js` swaps its colour values for `cssVar` calls.
  - `index.jsx` renders `<GlobalStyles styles={colourVariablesCss()} />` inside the MUI provider.
  - `global.css` uses `var(--uprise-surfaces-canvas)` instead of `#f8f8fa`, and its header comment says why the mirror is gone.
  - The 4 colour-maths sites read real values (`schemeColours(theme.palette.mode)` or `theme.palette.*`). Task 3 rewrites `palette.js`, so here its three `action` lines just read `Colors.primary100`.

- [ ] **Step 4: Run tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: PASS. In `npm run dev`, light mode looks unchanged apart from the listed moves: open `/dashboard` and one list page and compare against the master build.

- [ ] **Step 5: Commit**

`feat(theme): dashboard colour tokens are CSS variables, so the 78 files reading them switch scheme without a change`

---

### Task 3: Palette and shadows per mode

**Files:**
- Modify: `src/theme/palette.js`, `src/theme/shadows.js`, `src/theme/custom-shadows.js`, `src/theme/overrides/components/drawer.js`, `src/theme/overrides/components/card.js`, `table.js`, `dialog.js`, `paper.js`, `textfield.js`, `breadcrumbs.js`
- Test: extend `src/theme/scheme-colours.test.mjs`

**Interfaces:**
- Consumes: `paletteColours(scheme)`, `schemeColours(scheme)`.
- Produces: `palette(mode)`. `mode` is `'light' | 'dark'` and both branches are designed. Brand ramps (`primary` … `error`) keep their light stops in both modes. In dark, `contrastText` stays `#FFFFFF` and `main` stays the same: these are fills, and the text-on-tint roles carry contrast. `background`, `text`, `divider` and `action.active` come from `paletteColours`. `grey` stays one ramp, because the template's components already pick stops by `palette.mode`.

- [ ] **Step 1: Add the failing test**

`palette.js` imports `@mui/material/styles`, which `node --test` can't load, so the test pins `paletteColours`, which `palette.js` must spread:

```js
test('palette.js builds text, background and divider from paletteColours', () => {
  const src = fs.readFileSync('src/theme/palette.js', 'utf8');
  assert.match(src, /paletteColours\(mode\)/);
  assert.doesNotMatch(src, /not designed in\s+\/\/\s*this rebrand pass/); // the template's dark branch is gone
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test src/theme/scheme-colours.test.mjs`
Expected: FAIL on the new test.

- [ ] **Step 3: Implement**

- `palette(mode)` spreads `paletteColours(mode)`. `action.hover`, `selected` and `focus` use `alpha(Colors.primary100, …)`.
- `shadows(mode)` and `customShadows(mode)` take the tint from `paletteColours(mode).shadow`. Their `mutedBorder` ring reads `schemeColours(mode).tokens.mutedBorder`.
- `drawer.js` computes `alpha(schemeColours(theme.palette.mode).tokens.cardShadowColor, 0.18)`.
- The other overrides read only `cssVar` strings in CSS positions: check each, and change nothing that already works.

- [ ] **Step 4: Run tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

`feat(theme): a designed dark palette and per-mode shadows, replacing the template's undesigned branch`

---

### Task 4: Preference, resolution, no flash, and the switch

**Files:**
- Create: `src/theme/color-scheme.js`, `src/theme/color-scheme.test.mjs`, `src/theme/use-resolved-color-scheme.js`, `src/components/theme-mode-popover/{index.js,theme-mode-popover.jsx}`
- Modify: `src/theme/index.jsx`, `src/app.jsx:33` (defaults), `index.html`, `src/layouts/app/header.jsx:59`, `src/locales/langs/en.json`, `src/locales/langs/ar.json`

**Interfaces:**
- Produces:
  - `readColorSchemePreference(settings: object | null): 'system' | 'light' | 'dark'`. Returns `settings.colorScheme` when it is one of the three; otherwise `'system'`. It **ignores `themeMode`** (Review Focus 1).
  - `resolveColorScheme(preference, systemPrefersDark: boolean): 'light' | 'dark'`
  - `useResolvedColorScheme(): 'light' | 'dark'`. It reads `useSettingsContext().colorScheme`, subscribes to `matchMedia('(prefers-color-scheme: dark)')` change events, and on every value sets `document.documentElement.dataset.colorScheme` and `style.colorScheme`.
  - `<ThemeModePopover />`: an icon button and a menu with System / Light / Dark that calls `settings.onUpdate('colorScheme', value)`.

- [ ] **Step 1: Write the failing test `src/theme/color-scheme.test.mjs`**

```js
test('no stored settings → system', () => assert.equal(readColorSchemePreference(null), 'system'));
test('a 0.7-era settings object with themeMode light → system', () =>
  assert.equal(readColorSchemePreference({ themeMode: 'light', themeDirection: 'rtl' }), 'system'));
test('a stored choice wins', () => assert.equal(readColorSchemePreference({ colorScheme: 'dark' }), 'dark'));
test('junk → system', () => assert.equal(readColorSchemePreference({ colorScheme: 'sepia' }), 'system'));
test('system follows the device both ways; light/dark ignore it', () => {
  assert.equal(resolveColorScheme('system', true), 'dark');
  assert.equal(resolveColorScheme('system', false), 'light');
  assert.equal(resolveColorScheme('light', true), 'light');
  assert.equal(resolveColorScheme('dark', false), 'dark');
});
test('index.html applies the same rule before the bundle loads', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /localStorage\.getItem\('settings'\)/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /<meta name="color-scheme" content="light dark"/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test src/theme/color-scheme.test.mjs`
Expected: FAIL, because the module is missing.

- [ ] **Step 3: Implement**

- **`app.jsx` defaults:** replace `themeMode: 'light'` with `colorScheme: 'system'`.
- **`ThemeProvider`:** builds `palette`, `shadows` and `customShadows` from `useResolvedColorScheme()`, not `settings.themeMode`.
- **`index.html`:** add `<meta name="color-scheme" content="light dark">`, plus `theme-color` `#F8F8FA` and `#121214` with `media` queries per scheme, replacing `#000000`.
- **`index.html` inline script:** an IIFE wrapped in try/catch, placed before the module script. It mirrors `readColorSchemePreference` + `resolveColorScheme` and sets `data-color-scheme` and `style.colorScheme` on `<html>`. Its comment names `color-scheme.js` as the rule it mirrors.
- **Popover:** modelled on `language-popover.jsx`: a 40px icon button and a 180px menu. The icons are `solar:sun-2-linear` / `solar:moon-linear` / `solar:monitor-linear` for Light / Dark / System, each a literal, like the app's other 146. `monitor-linear` is not in `src/components/iconify/solar-linear.json` yet: run `npm run icons:build` and commit the bundle change, or `check:icons` fails. The selected item is marked.
- **Header:** mount it in `layouts/app/header.jsx` before `<LanguagePopover />`.
- **Strings:** add `"Appearance"`, `"System"`, `"Light"` and `"Dark"` to `en.json` and `ar.json` (ar: `"المظهر"`, `"النظام"`, `"فاتح"`, `"داكن"`).

- [ ] **Step 4: Run tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: PASS, including `check:i18n-keys` and `check:icons`.

- [ ] **Step 5: Commit**

`feat(dashboard): follow the browser's light/dark setting, with a System/Light/Dark switch in the header and no flash on load`

---

### Task 5: Literal sweep, charts, paper documents

**Files:**
- Delete: `src/assets/illustrations/{seo,booking,check-in,check-out,motivation,sever-error,coming-soon,maintenance,page-not-found,order-complete,upgrade-storage}-illustration.jsx`, `avatar-shape.jsx`, `background-shape.jsx`, and their `index.js` lines. No file outside `src/assets/illustrations/` imports them (grep before deleting; keep any that turn out to be imported).
- Create: `src/theme/force-light-scheme.jsx`, plus a test in `src/theme/colour-variables.test.mjs`
- Modify:
  - The in-app files with literals: `components/message-notification-snackbar.jsx`, `components/rebrand/skeletons/RebrandSkeletons.jsx`, `components/rebrand/StatusPill.jsx`, `components/rebrand/RebrandHeatRow.jsx`, `components/loading-screen/loading-screen.jsx`, `components/table/table-skeleton.jsx`, `components/table/table-selected-action.jsx`, `components/templates/RebrandListView.jsx`, `components/animate/variants/background.js`, `layouts/app/nav-vertical.jsx`, `layouts/app/nav-search-stub.jsx`, `components/forms/learningForm/learningForm.jsx`, `pages/student-attendance/student-attendance-calendar-view.jsx`, `sections/food/food-list-view/food-calendar-view.jsx`, `sections/accident-reports/accident-report-photo-lightbox.jsx`, and the `sections/{nursery-owner,branch-admin,super-admin}/dashboard/*` files from the 2026-10-26 list.
  - Charts: `components/chart/chart.js`, `sections/login-analytics/login-analytics-chart.jsx`, `sections/super-admin/dashboard/dashboard-history-charts.jsx`.
  - Paper wrappers: `sections/super-admin/document-templates/document-template-editor.jsx` (the page canvas) and `sections/super-admin/quotation/quotation-details-page.jsx` (contract previews).
  - `src/assets/illustrations/upload-illustration.jsx` and `forbidden-illustration.jsx`: the two still in use. Their fills move to `theme.palette.*`.

**Interfaces:**
- Produces: `ForceLightScheme({ children })`. It renders `<div data-color-scheme="light">` around a nested `ThemeProvider` whose theme is built with `palette('light')`, `shadows('light')` and `customShadows('light')`.

- [ ] **Step 1: Write the failing test** (Review Focus 3)

```js
test('ForceLightScheme pins both the CSS variables and the MUI palette to light', () => {
  const src = fs.readFileSync('src/theme/force-light-scheme.jsx', 'utf8');
  assert.match(src, /data-color-scheme="light"/);
  assert.match(src, /palette\('light'\)/);
});
test('the template editor page and the contract previews are wrapped', () => {
  for (const f of ['src/sections/super-admin/document-templates/document-template-editor.jsx',
                   'src/sections/super-admin/quotation/quotation-details-page.jsx'])
    assert.match(fs.readFileSync(f, 'utf8'), /<ForceLightScheme>/, f);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test src/theme/colour-variables.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Delete the unused illustrations.
  - Replace each literal in the listed in-app files with a `RebrandTokens` / `RebrandPalette` / `RebrandHues` value or `theme.palette.*`, whichever names the job. The allow-listed literals stay: the activity-form colour picker, and print-only HTML/PDF strings (`invoice-pdf.jsx`, `quotation-details.jsx`'s print stylesheet, `paged-document.js`, `*-contract-template.jsx`, `document-ruler.jsx`), which print on paper.
  - Charts take `theme: { mode: theme.palette.mode }`, axis and grid colours from `theme.palette`, and `tooltip.theme` from the mode.
  - Wrap the two paper surfaces in `ForceLightScheme`.

- [ ] **Step 4: Run tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: PASS. `npx check-token-drift src --allow src/components/forms/activityForm/ --allow src/global.css --allow src/theme/palette.js` reports 0.

- [ ] **Step 5: Commit**

`feat(dashboard): dark-ready charts, screens and empty states; paper documents stay light; unused template art removed`

---

### Task 6: Browser verification and PR

- [ ] **Step 1: Run the dashboard against the local backend**

Use `preview_start` (add a `dashboard-dark` entry to `.claude/launch.json` if missing, `npm run dev` on its port). Sign in with the seed accounts for **Super_Admin, Admin, Owner and Branch_Admin**. Credentials come from the project's seed files only, and are never echoed.

- [ ] **Step 2: The pass, for each role, in EN and AR, in Light, Dark and System**

- `/dashboard` with its charts.
- One list (students), one details view, one form with a date picker.
- The data grid.
- Chat.
- Login analytics (Super_Admin).
- The document-template editor and a quotation preview (Super_Admin): paper stays white with dark text.
- The welcome logo tile.

- [ ] **Step 3: The five Review Focus checks, explicitly**

1. Seed localStorage with `{"themeMode":"light"}` while the OS is dark: the dashboard comes up dark.
2. No console error from `alpha` on any page visited.
3. Paper documents stay readable.
4. A hard reload with cache disabled in dark shows no light flash, on `/auth/jwt/login` as well.
5. Toggling DevTools' `prefers-color-scheme` with System selected switches live.

Take screenshots for the PR.

- [ ] **Step 4: Push and open the PR**

The PR has `## Verification` (the commands and pass counts, the role × language × scheme matrix, screenshots) and `## Risk & rollback`. Vercel deploys on merge; to roll back, revert the merge commit and redeploy. The light consolidation ships with it, so say so in the PR. Before pushing, grep the diff for `localhost` / `HOST_API`.
