# Plan 1: Role table and per-scheme tokens (design-tokens 0.8.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@upriseedu-tech/design-tokens` one light/dark role table and per-scheme versions of its screen-named tokens, so the dashboard (Plan 2) and rn-ui (Plan 3) can switch colours by scheme.

**Architecture:**
- A pure `contrast.ts` (WCAG ratio, alpha compositing).
- `roles.ts` holds `Roles = { light, dark }` with identical keys. The dark values are produced by a derivation script and pinned in source with their ratios.
- `home.ts`, `navigationShell.ts` and `mobilePlatform.ts` gain `sharedHomeTokens(scheme)`, `navigationShellTokens(scheme)`, `systemChrome(scheme)` and `launchScreenBackground(scheme)`, built from a source map in which each colour key names a role. The existing constant exports stay, equal to the light result.
- `node --test` guards contrast, key parity and the exact list of light values that change.

**Tech Stack:** TypeScript 5.9.3, `node --test`, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-dark-mode-design.md`. Roadmap: `docs/superpowers/plans/2026-10-27-dark-mode-roadmap.md`.

## Global Constraints

- Data only. No `react-native`, no `@mui`, no runtime dependency. Helpers are pure functions that import nothing outside `src/`.
- Source imports carry the `.js` extension (`from './roles.js'`), which the ESM build needs.
- Every existing export keeps its name and shape: `Colors`, `SharedHomeTokens`, `NavigationShellTokens`, `SystemChrome`, `LaunchScreen` and the rest. `Colors` values do not change.
- Light values change **only** where the Task 2 tables say so (the owner's light consolidation, 2026-10-26). Everything else in light is byte-identical to 0.7.2.
- A dark value is a role, or an accent marked `same`. A dark side never carries a new hex outside `roles.ts`.
- Every text role reaches ≥ 4.5:1 (AA) on the grounds listed in Task 1. Derived values aim for 4.71, the margin the light `*Text` tokens use. Ratios are written in comments beside the values.
- Conventional Commits, authored by Fady Shawky, with no AI attribution. Branch `feat/dark-mode-roles` in a worktree off `origin/main`.
- `npm test` (build + `node --test`) is the gate. Report the literal pass count.
- **Do not publish 0.8.0** until the owner has signed off the swatch sheet (Task 3) and said to publish.

## Review Focus

1. **A non-hex value reaching `contrastRatio`** (`rgba(…)`, `transparent`, a 3-digit hex). It must throw with the value in the message, never return a wrong number. Test in Task 1.
2. **A light value changing that isn't in the consolidation list.** A copy-paste slip in a source map would shift a screen's colour silently. Task 2 pins every light value against a 0.7.2 fixture.
3. **A key dropped from `SharedHomeTokens` / `NavigationShellTokens`** when they are rebuilt from source maps. Consumers read keys by name, so a missing key is `undefined` on screen. Task 2 compares key sets with the fixture.
4. **Non-colour values differing between schemes** (radii, opacities, paddings). Dark must change colours only. Task 2 test.
5. **ESM consumers** (the dashboard's Vite build). The new exports must load through `import`. Extend `test/esm-import.test.mjs` in Task 2.

---

## File structure

| Path | Responsibility |
|---|---|
| `src/contrast.ts` (create) | `contrastRatio`, `compositeOver`: pure WCAG maths |
| `src/roles.ts` (create) | `ColorScheme`, `LightRoles`, `DarkRoles`, `Roles`, `RoleName`, `BrandFamilies` |
| `src/colourSource.ts` (create) | `ColourSource` type and `resolveColour(source, scheme)` |
| `src/home.ts` (modify) | `SharedHomeColourSources`, `sharedHomeTokens(scheme)`; `SharedHomeTokens` = light |
| `src/navigationShell.ts` (modify) | `NavigationShellColourSources`, `navigationShellTokens(scheme)`; `NavigationShellTokens` = light |
| `src/mobilePlatform.ts` (modify) | `systemChrome(scheme)`, `launchScreenBackground(scheme)`; existing constants = light |
| `src/index.ts` (modify) | export the above |
| `scripts/derive-dark-roles.mjs` (create) | prints the derived dark tints and texts (and the two light status texts) with ratios |
| `scripts/render-swatch-sheet.mjs` (create) | renders the owner's swatch sheet (artifact page body) |
| `test/roles.test.js` (create) | contrast, parity and derivation pins |
| `test/scheme-tokens.test.js` (create) | light pins vs 0.7.2, key sets, dark-is-a-role, non-colour parity |
| `test/fixtures/tokens-0.7.2.json` (create) | `SharedHomeTokens`, `NavigationShellTokens`, `SystemChrome`, `LaunchScreen` as published in 0.7.2 |
| `test/esm-import.test.mjs` (modify) | new exports load via ESM |
| `CHANGELOG.md` (create), `README.md` (modify), `package.json` (modify) | 0.8.0 release notes, "what is in here", version |

---

### Task 1: Contrast maths and the role table

**Files:**
- Create: `src/contrast.ts`, `src/roles.ts`, `scripts/derive-dark-roles.mjs`, `test/roles.test.js`
- Modify: `src/index.ts`

**Interfaces:**
- Produces:
  - `contrastRatio(foreground: string, background: string): number`. Opaque `#RRGGBB` only; anything else throws `Error` naming the value.
  - `compositeOver(foreground: string, alpha: number, background: string): string`. Returns opaque uppercase `#RRGGBB`, channels rounded.
  - `type ColorScheme = 'light' | 'dark'`
  - `LightRoles` (`as const`), `type RoleName = keyof typeof LightRoles`, `DarkRoles: { readonly [K in RoleName]: string }`, `Roles: { light: typeof LightRoles; dark: typeof DarkRoles }`
  - `BrandFamilies = ['primary', 'teal', 'blue', 'coral', 'orange', 'yellow'] as const`

**Role values** (40 roles as built; the spec's "roughly 35". `textOnAccent` was dropped in the final review: white failed AA on seven of eight accents):

| Role | Light | Dark |
|---|---|---|
| `canvas` | `rebrandScreenCanvas` (`#F8F8FA`) | `#121214` |
| `surface` | `Colors.white` | `#1C1C1F` |
| `surfaceSunken` | `#F1F0F6` | `#2A2A30` |
| `surfaceRaised` | `Colors.white` | `#242428` |
| `surfaceElevatedAndroid` | `androidElevatedCardSurface` (`#F5F5F9`) | `#242428` |
| `surfaceFrosted` | `rgba(255,255,255,0.94)` | `rgba(36,36,40,0.94)` |
| `border` | `rgba(26,23,50,0.08)` | `rgba(255,255,255,0.07)` |
| `borderStrong` | `rgba(26,23,50,0.12)` | `rgba(255,255,255,0.12)` |
| `text` | `#1A1732` | `#F2F2F5` |
| `textMuted` | `Colors.neutralText` (`#63607E`) | `#A1A1AA` |
| `shadow` | `#17142A` | `#000000` |
| `photoScrim` | `transparent` | `rgba(0,0,0,0.12)` |
| `<family>` ×6 | `Colors.<family>100` | same |
| `<family>Tint` ×6 | `Colors.<family>10` | derived: `<family>` at 0.16 over dark `surface` |
| `<family>TintStrong` ×6 | `Colors.<family>20` | derived: `<family>` at 0.24 over dark `surface` |
| `<family>Text` ×6 | `Colors.<family>Text` | derived (algorithm below) |
| `success` | `Colors.green` | `Colors.green` |
| `successText` | derived: `#357733` | derived: `#4DAD4A` |
| `danger` | `Colors.red` | `Colors.red` |
| `dangerText` | derived: `#C63234` | derived: `#DD7778` |

`successText` and `dangerText` change in light. Today's `greenText` measures 4.47:1 on the canvas and `redText` 4.27:1 on the sunken surface, both under AA. The `Colors` enum keeps its old values; only the roles move.

- [ ] **Step 1: Write `scripts/derive-dark-roles.mjs`**

It reads `../dist/cjs` (the run is after `npm run build`) and prints one line per derived value with its ratios. The algorithm (this is what the step decides):

```js
// Walk HSL lightness from the base colour in 0.5% steps (up for dark, down
// for light) until the colour reaches 4.71:1 on EVERY ground; stop at 5%/95%.
// Grounds:
//   dark <family>Text:    [dark <family>TintStrong, dark surfaceSunken, dark surfaceRaised]
//   dark success/danger:  [dark surface, dark surfaceSunken, dark surfaceRaised]
//   light success/danger: [canvas, surface, surfaceSunken, surfaceElevatedAndroid] (light)
// Bases: Colors.<family>100, Colors.green, Colors.greenText (light), Colors.red.
// Tints: compositeOver(Colors.<family>100, 0.16 | 0.24, '#1C1C1F').
```

Expected output, which is pasted into `roles.ts` with each value's ratios in a comment:

| Family | Tint | TintStrong | Text |
|---|---|---|---|
| primary | `#2D2C43` | `#353454` | `#9D9AFD` |
| teal | `#1C3937` | `#1C4844` | `#1ED3B8` |
| blue | `#253643` | `#294355` | `#52BDFF` |
| coral | `#3E2529` | `#4F2A2E` | `#F57C82` |
| orange | `#3F312B` | `#513B31` | `#F79E69` |
| yellow | `#403B2D` | `#524B34` | `#FFDF75` |

The status texts are as in the role table. If the script prints a different value, the script is the source of truth: use its value, and say so in the PR.

- [ ] **Step 2: Write the failing tests in `test/roles.test.js`**

```js
const { Roles, LightRoles, DarkRoles, BrandFamilies, Colors, contrastRatio, compositeOver } = require('../dist/cjs');
const AA = 4.5;
const NEUTRAL_GROUNDS = ['canvas', 'surface', 'surfaceSunken', 'surfaceRaised', 'surfaceElevatedAndroid'];

test('light and dark have exactly the same role names', () =>
  assert.deepEqual(Object.keys(DarkRoles).sort(), Object.keys(LightRoles).sort()));
test('Roles.light / Roles.dark are the two tables', …);
test('contrastRatio: #FFFFFF on #000000 is 21, same colour is 1', …);
test('contrastRatio throws on rgba(), transparent and #FFF, naming the value', () => {
  for (const bad of ['rgba(0,0,0,0.1)', 'transparent', '#FFF'])
    assert.throws(() => contrastRatio(bad, '#FFFFFF'), new RegExp(bad.replace(/[()]/g, '\\$&')));
});
test('compositeOver: primary100 at 0.16 over #1C1C1F is #2D2C43', () =>
  assert.equal(compositeOver(Colors.primary100, 0.16, '#1C1C1F'), '#2D2C43'));

for (const scheme of ['light', 'dark']) {
  const r = Roles[scheme];
  test(`${scheme}: text and textMuted reach AA on every neutral ground`, …);      // NEUTRAL_GROUNDS
  test(`${scheme}: <family>Text reaches AA on its Tint, TintStrong and surface`, …); // BrandFamilies
  test(`${scheme}: successText and dangerText reach AA on canvas, surface, surfaceSunken, surfaceElevatedAndroid`, …);
}
test('light brand roles are the Colors values, unchanged', () => {
  for (const f of BrandFamilies) {
    assert.equal(LightRoles[f], Colors[`${f}100`]);
    assert.equal(LightRoles[`${f}Tint`], Colors[`${f}10`]);
    assert.equal(LightRoles[`${f}TintStrong`], Colors[`${f}20`]);
    assert.equal(LightRoles[`${f}Text`], Colors[`${f}Text`]);
  }
});
test('dark tints are the family composited over dark surface (0.16 / 0.24)', () => {
  for (const f of BrandFamilies) {
    assert.equal(DarkRoles[`${f}Tint`], compositeOver(Colors[`${f}100`], 0.16, DarkRoles.surface));
    assert.equal(DarkRoles[`${f}TintStrong`], compositeOver(Colors[`${f}100`], 0.24, DarkRoles.surface));
  }
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL. `Roles` and `contrastRatio` are undefined (`dist/cjs` has no such export).

- [ ] **Step 4: Implement `src/contrast.ts` and `src/roles.ts`, and export them from `src/index.ts`**

`contrastRatio` uses WCAG 2.x relative luminance (sRGB channel `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`). `roles.ts` builds its light side from `Colors`, `rebrandScreenCanvas` and `androidElevatedCardSurface`, and its dark side from the table above. Each text role carries its ratios in a comment, the same style as `colors.ts`.

- [ ] **Step 5: Run the derivation, then the tests**

Run: `npm run build && node scripts/derive-dark-roles.mjs`
Expected: the values in the tables above.

Run: `npm test`
Expected: PASS, including every existing suite.

- [ ] **Step 6: Commit**

```bash
git add src/contrast.ts src/roles.ts src/index.ts scripts/derive-dark-roles.mjs test/roles.test.js
git commit -m "feat(tokens): one light/dark role table, every text role at AA in both"
```

---

### Task 2: Per-scheme screen tokens

**Files:**
- Create: `src/colourSource.ts`, `test/scheme-tokens.test.js`, `test/fixtures/tokens-0.7.2.json`
- Modify: `src/home.ts`, `src/navigationShell.ts`, `src/mobilePlatform.ts`, `src/index.ts`, `test/esm-import.test.mjs`

**Interfaces:**
- Consumes: `Roles`, `RoleName` and `ColorScheme` from Task 1.
- Produces:
  - `type ColourSource = RoleName | { light: string; dark: RoleName } | { same: string }`
  - `resolveColour(source: ColourSource, scheme: ColorScheme): string`
  - `SharedHomeColourSources`, plus `sharedHomeTokens(scheme: ColorScheme)`. The return type is the same keys as today's `SharedHomeTokens`, colour values `string`, non-colour values unchanged.
  - `SharedHomeTokens = sharedHomeTokens('light')`
  - `NavigationShellColourSources` (nested `tabBar` / `header`), `navigationShellTokens(scheme)` and `NavigationShellTokens = navigationShellTokens('light')`
  - `systemChrome(scheme): { colorScheme: ColorScheme; statusBar: 'dark-content' | 'light-content' }`. Dark gives `'light-content'`. `SystemChrome = systemChrome('light')`.
  - `launchScreenBackground(scheme): string`, which is `Roles[scheme].canvas`. `LaunchScreen.background` is unchanged.

**`SharedHomeColourSources`.** `→ role` means the value is that role in both schemes. ★ marks a light value that changes (consolidation).

| Key | Source |
|---|---|
| `screenBackground` | `canvas` |
| `screenAmbientGlowTop` / `Bottom` | `{ light: '#E6E6EA' / '#EBEBEF', dark: 'surfaceSunken' }` |
| `priorityPairBorder`, `priorityPairIconShellBorder`, `cardBorderColor` | `{ same: <today's rgba> }` |
| `priorityPairIconShellBg` ★ `#F0EFF5`→ | `surfaceSunken` |
| `calmGhostSurface` ★ `#EEEFF2`→ | `surfaceSunken` |
| `mutedBorder`, `welcomeBrandBorder` | `border` |
| `cardShadowColor` | `shadow` |
| `titleColor` | `text` |
| `foodEmptyTitle` ★ `#3D3958`→ | `text` |
| `subtitleColor` ★ `#6F6B8A`, `foodEmptySubtitle` ★ `#8A869E`, `foodFlatMealEyebrow` ★ `#6B6788`, `chatMetaText` ★ `#57527A` → | `textMuted` |
| `playfulTint`, `foodEmptyIconBg` ★ `rgba(132,129,253,0.10)`, `chatMetaBg` ★ same rgba → | `primaryTint` |
| `playfulTintStrong` | `primaryTintStrong` |
| `playfulAccent` | `primary` |
| `playfulAccentText`, `foodEmptyIconTint` | `primaryText` |
| `welcomeBrandSurface` ★ `rgba(255,255,255,0.96)`→ | `surfaceFrosted` |
| `welcomeNurseryText` | `{ light: '#5E58A6', dark: 'primaryText' }` |

**`NavigationShellColourSources`.**

| Key | Source |
|---|---|
| `tabBar.activeColor`, `header.iconTint` | `primary` |
| `tabBar.inactiveColor` ★ `#929292`→ | `textMuted` |
| `tabBar.iosBackground` | `{ light: 'rgba(255,255,255,0.72)', dark: 'surfaceFrosted' }` |
| `tabBar.androidBackground`, `header.backButtonBgAndroid`, `header.pillBackgroundAndroid` | `surfaceElevatedAndroid` |
| `tabBar.shadowColor` ★ `#000000`→, `header.pillShadowColor` ★ `#1A1732`→ | `shadow` |
| `tabBar.borderColor`, `tabBar.activePill`, `tabBar.activePillBorder`, `header.backButtonBorder`, `header.pillBorderColor` | `{ same: <today's rgba> }` |
| `header.iosBackground`, `header.androidBackground`, `header.borderColor` | `{ same: 'transparent' }` |
| `header.titleColor` | `text` |
| `header.backButtonBgIOS` | `{ light: 'rgba(255,255,255,0.90)', dark: 'surfaceFrosted' }` |
| `header.pillBackgroundIOS` | `surfaceFrosted` |

- [ ] **Step 1: Capture the 0.7.2 fixture before touching `src`**

Run: `npm run build && node -e "const t=require('./dist/cjs');require('fs').writeFileSync('test/fixtures/tokens-0.7.2.json', JSON.stringify({SharedHomeTokens:t.SharedHomeTokens,NavigationShellTokens:t.NavigationShellTokens,SystemChrome:t.SystemChrome,LaunchScreen:t.LaunchScreen},null,2)+'\n')"`
Expected: the file exists, and `SharedHomeTokens.titleColor` in it is `#1A1732`.

- [ ] **Step 2: Write the failing tests in `test/scheme-tokens.test.js`**

```js
const OLD = require('./fixtures/tokens-0.7.2.json');
// The consolidation, and nothing else, may change light (owner, 2026-10-26).
const CONSOLIDATED = {
  'SharedHomeTokens.priorityPairIconShellBg': '#F1F0F6', 'SharedHomeTokens.calmGhostSurface': '#F1F0F6',
  'SharedHomeTokens.foodEmptyTitle': '#1A1732',
  'SharedHomeTokens.subtitleColor': '#63607E', 'SharedHomeTokens.foodEmptySubtitle': '#63607E',
  'SharedHomeTokens.foodFlatMealEyebrow': '#63607E', 'SharedHomeTokens.chatMetaText': '#63607E',
  'SharedHomeTokens.foodEmptyIconBg': '#F3F2FF', 'SharedHomeTokens.chatMetaBg': '#F3F2FF',
  'SharedHomeTokens.welcomeBrandSurface': 'rgba(255,255,255,0.94)',
  'NavigationShellTokens.tabBar.inactiveColor': '#63607E',
  'NavigationShellTokens.tabBar.shadowColor': '#17142A', 'NavigationShellTokens.header.pillShadowColor': '#17142A',
};
test('light: every value equals 0.7.2 unless it is in CONSOLIDATED, which it then equals', …); // walk leaves
test('key sets are exactly 0.7.2\'s (nothing dropped, nothing added)', …);
test('SharedHomeTokens deep-equals sharedHomeTokens("light"); same for NavigationShellTokens / SystemChrome', …);
test('dark: every colour key resolves to a Roles.dark value, or to its { same } value', …); // walk *ColourSources
test('non-colour values are identical in light and dark', …);
test('systemChrome("dark") is { colorScheme: "dark", statusBar: "light-content" }', …);
test('launchScreenBackground: light #F8F8FA, dark #121214', …);
```

Then add `Roles`, `sharedHomeTokens`, `navigationShellTokens`, `systemChrome`, `contrastRatio` to the names `test/esm-import.test.mjs` checks.

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL. `sharedHomeTokens is not a function`, plus the `CONSOLIDATED` mismatches.

- [ ] **Step 4: Implement `src/colourSource.ts` and the three modules**

Each module keeps its non-colour values in a plain object. The colour keys come from its `*ColourSources` map through `resolveColour`, merged in the same key order as today. The doc comments stay; the `SystemChrome` comment's "light-only" paragraph is replaced by the per-scheme rule.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS, including every existing suite.

- [ ] **Step 6: Commit**

```bash
git add src test
git commit -m "feat(tokens): per-scheme home, navigation-shell and system-chrome tokens, light consolidated once"
```

---

### Task 3: The owner's swatch sheet

**Files:**
- Create: `scripts/render-swatch-sheet.mjs`

**Interfaces:**
- Consumes: `Roles`, `contrastRatio`, the `*ColourSources` maps, and `test/fixtures/tokens-0.7.2.json`.

- [ ] **Step 1: Write the script**

It mirrors `scripts/render-icon-review.mjs`: it reads `../dist/cjs`, writes an Artifact page body to stdout (the file starts at `<title>`), and its header comment gives the run command. Sections:
1. One row per role: light swatch | dark swatch | name | for text roles, the ratio on each of its grounds in each scheme.
2. Graphite preview: parent Home and a dashboard table drawn from `Roles.dark`.
3. Before → after for every key in `CONSOLIDATED`, both swatches side by side, with old and new contrast on white.

- [ ] **Step 2: Render it**

Run: `npm run build && node scripts/render-swatch-sheet.mjs > /tmp/swatch-sheet.html` (or the session scratchpad)
Expected: one section per item above, 40 role rows, 13 before/after pairs.

- [ ] **Step 3: Publish it as a private Artifact and send the owner the link**

**Stop here until the owner signs off.** A requested colour change goes back to Task 1 or Task 2 (with the tests updated), and then the sheet is re-rendered.

- [ ] **Step 4: Commit**

```bash
git add scripts/render-swatch-sheet.mjs
git commit -m "chore(tokens): swatch sheet for the dark-mode sign-off"
```

---

### Task 4: Release 0.8.0

**Files:**
- Create: `CHANGELOG.md`
- Modify: `README.md` ("What is in here"), `package.json` (`version`)

- [ ] **Step 1: Write the docs**

`CHANGELOG.md` starts with `## [0.8.0] - <date>`:
- **Added:** the role table, the per-scheme functions, `contrastRatio` / `compositeOver`.
- **Changed (light):** every `CONSOLIDATED` entry as `key: old → new`, plus the `successText` / `dangerText` roles. Also say that `Colors` is unchanged.

The README's "In:" list gains `Roles` and the per-scheme functions, with one paragraph on the rule: dark values are roles, and light changed once, on purpose. Set `package.json` `"version": "0.8.0"`.

- [ ] **Step 2: Verify the package**

Run: `npm test && npm pack --dry-run`
Expected: tests PASS, and the pack lists `dist/cjs/roles.js`, `dist/esm/roles.js` and `dist/cjs/contrast.d.ts`.

- [ ] **Step 3: Commit, push and open the PR**

```bash
git add CHANGELOG.md README.md package.json
git commit -m "chore(release): 0.8.0, the dark-mode role table"
```

The PR has `## Verification` (the `npm test` pass count, the derive-script output, the swatch-sheet link with the owner's sign-off) and `## Risk & rollback`. Consumers pin exact versions, so nothing moves until an app bumps; to roll back, revert and publish 0.8.1.

- [ ] **Step 4: Publish, only after the PR merges and the owner says publish**

Run: `npm publish` (needs `write:packages` on `upriseEdu-tech`)
Expected: `+ @upriseedu-tech/design-tokens@0.8.0`. Then mark Plan 1 done in the roadmap, so Plans 2 and 3 can be written.
