# Plan 4: Parent and Staff apps (mobile + teacher) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the parent app and the Staff app follow the device's light/dark setting live, with a System / Light / Dark choice in Settings, and draw every screen in light or graphite dark from rn-ui's per-scheme theme.

**Architecture:**
- **Preference.** The persisted `app` slice holds `colorScheme: 'system' | 'light' | 'dark'` (default `'system'`), kept on sign-out like the language.
- **Resolution.** One hook resolves the preference against the device (`useColorScheme()`) and hands the override to native through `Appearance.setColorScheme`.
- **Flow.** The resolved scheme goes to `RnUiProvider colorScheme` and to the `NavigationContainer` theme.
- **Styles.** Every styled file moves to rn-ui's `createThemedStyles` / `useAppTheme`. JSX colour reads move to `t.roles` / `t.home`. Tone maps hold role names.
- **Native.** Native files stop pinning light, and the splash follows the device.
- **Same in both apps.** Both apps get the same names, and the shared files are byte-identical.

**Tech Stack:** React Native 0.87.1, React 19, TypeScript, Redux Toolkit + redux-persist, React Navigation 7 (native-stack, bottom tabs, drawer on the Staff tablet), Jest 30, `@upriseedu-tech/rn-ui` 0.4.0, `@upriseedu-tech/design-tokens` 0.8.1.

**Spec:** `docs/superpowers/specs/2026-10-26-dark-mode-design.md` (sections "Parent app (mobile) and Staff app (teacher)", "Verification", "Delivery"). Roadmap: `docs/superpowers/plans/2026-10-27-dark-mode-roadmap.md`. It builds on Plan 3 (rn-ui 0.4.0, upriseEdu-tech/rn-ui#1).

**State read for this plan:**
- mobile `origin/main` `164eeb6` and teacher `origin/main` `a1b27db`. These equal `preview/consistency-2026-10` (`895641a` / `16fd049`) plus merge commits.
- rn-ui `feat/dark-mode` `43c159a`.

## Global Constraints

- **Starts after** design-tokens 0.8.1 and rn-ui 0.4.0 (with Task 0 in it) are published.
- **Store builds wait** until the current submissions are approved. These are store builds (native files change), never OTA. From the merge on, OTAs for 3.1.x / 6.1.x binaries are cut from a branch without this work.
- **Worktrees:** `.worktrees/mobile-dark` and `.worktrees/teacher-dark`, each on branch `feat/dark-mode`, cut from the then-current `origin/preview/consistency-2026-10`.
  - PRs go into that preview branch. Preview → `main` is the owner's step, and nothing is pushed to `main`.
  - Push and open PRs as `upriseEdu-tech` with a per-command token (`gh auth token --user upriseEdu-tech`).
- **Commits:** Conventional Commits, authored by Fady Shawky, no AI attribution. The migration goes one screen area per commit per app, so each commit reverts alone.
- **Same names in both apps.** These files are byte-identical in `mobile` and `teacher` (diff them before each PR):
  - `src/core/theme/useResolvedColorScheme.ts`
  - `src/navigation/navigationTheme.ts`
  - `scripts/check-consistency.mjs` (apart from its existing `ALLOW` block)
  - `__tests__/themePolicy.test.ts`
  - `__tests__/helpers/darkContrast.ts`
- **Dark values** are rn-ui roles (`t.roles.*`), rn-ui home tokens (`t.home.*`), or a value that is the same in both schemes. Never a new hex: `check:consistency` keeps `colorLiteral` at 0.
- **Light changes** are limited to these:
  1. **The package adoption** (Task 1). Its moves are the ones rn-ui 0.4.0's CHANGELOG lists.
  2. **The consolidation of the apps' own text:**
     - `Colors.black` / `Colors.darkGray` as text → `t.roles.text` (`#1A1732`);
     - `Colors.gray` as text → `t.roles.textMuted` (`#63607E`).
  3. **Named exceptions**, each in its task's commit body:
     - the Staff `NavigationContainer` moves from React Navigation's `DefaultTheme` to the shared theme (Task 2);
     - two near-black chips move from `titleColor` to `mediaStage` (Task 5);
     - the Staff calendar's selected-day text moves to white (Task 6).

  Every other commit is light-identical. The Staff app's `__tests__/fixtures/phoneGolden.json` (`viewportLayouts.test.tsx`) proves it for Home, Students and the sheet: it is regenerated only in a commit whose light changes are on that list, with the diff in the commit body. The light screenshots in Task 11 cover the rest.
- **What stays light** (spec, Decisions):
  - server images (nursery logos, Staff activity icons on their circles);
  - generated PDFs;
  - server pages in WebViews (Learnings, Nursery Policy).
- **Intentionally dark screens stay dark in both schemes:**
  - the camera (`CameraScreen`);
  - the media viewers (`MEDIA_VIEWER_OPTIONS`, `ImageViewer`, the Learnings viewer modal);
  - the QR viewfinder.
- **i18n:** every new string goes into both `en` and `ar` (`check:i18n`). Wording matches the dashboard: Appearance / المظهر, Match device / حسب الجهاز, Light / فاتح, Dark / داكن.
- **Gates, per app:** `npm run typecheck && npx jest -w 2 && npm run check:i18n && npm run check:tokens && npm run check:consistency`, then `npm run lint` (advisory).
  - Jest runs at `-w 2`, one run at a time, after `pgrep -f "[j]est/bin|[j]est -w" >/dev/null && echo busy || echo free`.
- **Simulators:** at most two booted at once, shut down after use.

## Review Focus

1. **What draws above the providers on a dark device.**
   - **Root canvas and launch `LoadingComponent`:** they draw before redux rehydrates, so they follow the device, like the native splash.
   - **`ErrorBoundary` fallback:** it draws after the providers unmount, so it follows the resolved scheme through `Appearance.getColorScheme()`. No light flash, no unreadable crash screen.
   - **Test:** Task 2.
2. **Preference against device.**
   - An override wins over the device.
   - `'system'` follows a live device flip.
   - `Appearance.setColorScheme` gets `'auto'` for `'system'`.
   - **Test:** Task 2.
3. **The preference survives.** It survives sign-out (`KEPT_ON_LOGOUT`) and an app update whose persisted `app` blob predates the key, which must rehydrate to `'system'`. **Test:** Task 2.
4. **Server-drawn content keeps a light ground in dark.**
   - **Staff activity icon circles:** opaque, light pastel. **Test:** Task 5.
   - **The activity pill text:** chosen against the server fill, not the card. **Test:** Task 6.
   - **Nursery Policy HTML:** stays light. **Test:** Task 7.
5. **Third-party UI that reads its colours once.**
   - **Problem:** `react-native-calendars` caches its `theme`, and the DateTimePicker `themeVariant` is hard-coded light. A live flip must restyle them.
   - **Tests:**
     - Task 6: the calendar remounts per scheme, and the pickers' `themeVariant` comes from `t.scheme`.
     - Task 5: string-built colours (`${token}29`) only use tokens that are 6-digit hex in both schemes.

---

## File structure

**New (byte-identical in both apps):**

| Path | Responsibility |
|---|---|
| `src/core/theme/useResolvedColorScheme.ts` | the preference against `useColorScheme()`; `Appearance.setColorScheme` |
| `src/navigation/navigationTheme.ts` | `navigationTheme(t: AppTheme): Theme` for `NavigationContainer` |
| `__tests__/themePolicy.test.ts` | static-read rules the consistency regex can't express |
| `__tests__/helpers/darkContrast.ts` | `expectReadableInDark(tree)`: every text ≥ 4.5:1 on its nearest opaque ground (port of rn-ui's `darkRender.test.tsx` walk) |

**Modified (both apps, same edits):**

| Path | Change |
|---|---|
| `src/core/store/app/{appState,appSlice}.ts` | `colorScheme` preference, `setColorSchemePreference` |
| `App.tsx` | resolved scheme → `RnUiProvider`; root canvas and launch `LoadingComponent` follow the device |
| `src/common/components/ErrorBoundary.tsx` | fallback styles from `themeFor(Appearance.getColorScheme() ?? 'light')` |
| `src/navigation/MainNavigation.tsx` | `theme={navigationTheme(t)}` |
| `scripts/check-consistency.mjs`, `scripts/consistency-baseline.json` | rule `staticThemeStyles`, no baseline |
| `scripts/rn-ui-exports.json` | re-vendored for 0.4.0 |
| `src/common/localization/translations/commonLocalization.ts` | 4 keys |
| `ios/*/Info.plist`, `ios/*/Images.xcassets/SplashBackground.colorset/Contents.json` | unpin light; dark splash ground |
| `android/app/src/main/res/values/styles.xml`, `values/bools.xml`, `values-night/{colors,bools}.xml` | DayNight; night splash ground and bar icons |
| `README.md`, `src/design-system/README.md`, `CHANGELOG.md` | "light-only" corrected; changelog |

**App-specific:**
- **Parent:** the Settings row in `src/screens/Settings/Settings.tsx`.
- **Staff:** the Settings row in `src/navigation/components/AccountActions.tsx`, which serves both the phone Settings screen and the tablet drawer.
- **Both:** the 74 styled files per app (inventory in Tasks 4–8).

---

### Task 0: Package prerequisites (design-tokens 0.8.1, rn-ui 0.4.0 before it publishes)

**Files:**
- design-tokens: `src/icons.ts` (`IconConcepts`), `CHANGELOG.md`, `package.json` 0.8.1.
- rn-ui `feat/dark-mode` (upriseEdu-tech/rn-ui#1):
  - `src/icons/solarGlyphs.ts` (regenerated);
  - `src/feedback/LoadingComponent.tsx`;
  - `package.json` (design-tokens peer `^0.8.1`, dev `0.8.1`);
  - `__tests__/`.

**Interfaces:**
- Produces:
  - `IconConcepts.appearance = 'moon'` (solar `moon-linear`, the glyph the dashboard's Dark option draws).
  - `LoadingComponent` prop `colorScheme?: ColorScheme`. It wins over the host's, so a launch view drawn above `RnUiProvider` can follow the device.

If rn-ui 0.4.0 has already been published, these ship as 0.4.1, and Task 1 pins 0.4.1.

- [ ] **Step 1: Failing tests.**
  - design-tokens: `IconConcepts.appearance` is `'moon'`, and `solarLinearName('moon')` is `'moon-linear'`.
  - rn-ui:
    - `resolveIcon({ concept: 'appearance' }).xml` is defined;
    - `LoadingComponent` rendered with no provider and `colorScheme="dark"` paints `Roles.dark.canvas`;
    - with no prop and no provider it stays light.
- [ ] **Step 2: Run and confirm they fail.**
  - design-tokens: `npm test`.
  - rn-ui: `npx jest -w 2 __tests__/darkTheme.test.tsx`.
  - Expected: FAIL (no concept, no prop).
- [ ] **Step 3: Implement.**
  - design-tokens: add the concept; `CHANGELOG [0.8.1]`; publish per its `RELEASING.md` on the owner's go.
  - rn-ui:
    - bump the dev and peer pins;
    - `npm run icons:build` (or `node scripts/generate-solar-glyphs.js`);
    - the `LoadingComponent` prop is `useAppTheme()`'s scheme unless `colorScheme` is given;
    - CHANGELOG `[0.4.0]` Added lines.
- [ ] **Step 4: Gates.**
  - design-tokens `npm test`.
  - rn-ui `npm run typecheck && npm run lint && npx jest -w 2 && npm run check:host-imports && npm run check:strings`.
  - Expected: all pass.
- [ ] **Step 5: Commit, and push to the open PRs.**
  - `feat(icons): an appearance concept for the Light / Dark setting` (design-tokens).
  - `feat(feedback): LoadingComponent takes the device's scheme when it draws above the provider` (rn-ui).

---

### Task 1: Adopt rn-ui 0.4.0 and design-tokens 0.8.1 in both apps

**Files:** `package.json`, `package-lock.json`, `scripts/rn-ui-exports.json`; tests that pin package names (parent `__tests__/designSystemReexports.test.ts`).

- [ ] **Step 1:** In each worktree, run `npm install @upriseedu-tech/rn-ui@0.4.0 @upriseedu-tech/design-tokens@0.8.1 --legacy-peer-deps` (exact pins, the same in both apps).
- [ ] **Step 2:** Re-vendor the export list. It gains `useAppTheme`, `createThemedStyles`, `themeFor`, `homeRebrandTokens`, `HomeRebrandColourSources`, `commonStylesFor` and `getRnUiColorScheme`:

  ```bash
  node <rn-ui>/scripts/export-names.mjs | npx prettier --parser json > scripts/rn-ui-exports.json
  ```

  Then run `npm run check:consistency`. Expected: PASS. No app defines those names today.
- [ ] **Step 3:** Run the gates. Expected: PASS, except tests that pin a light value the package moved:
  - `subtitleColor` `#6F6B8A` → `#63607E`;
  - `calmGhostSurface` → `#F1F0F6`;
  - `#000000` text → `#1A1732`;
  - red text → `#C63234`.

  Update those expectations to the role (`Roles.light.textMuted`, …), not to a new literal. The Staff `phoneGolden.json` is regenerated here (`PHONE_GOLDEN_OUT`); the commit body lists the diff, which holds only those values.
- [ ] **Step 4: Commit, per app.** `chore(deps): rn-ui 0.4.0 and design-tokens 0.8.1, with the packages' light consolidation`. The body lists the moved values from rn-ui's CHANGELOG.

---

### Task 2: The preference, its resolution and the root

**Files:**
- `src/core/store/app/{appState,appSlice}.ts`
- `src/core/theme/useResolvedColorScheme.ts` (new)
- `src/navigation/navigationTheme.ts` (new)
- `App.tsx`
- `src/navigation/MainNavigation.tsx`
- `src/common/components/ErrorBoundary.tsx`
- `__tests__/colorScheme.test.tsx` (new, same in both)
- the sign-out test that mirrors `KEPT_ON_LOGOUT` (parent `signOutClearsAccountData.test.ts`, and its Staff counterpart)

**Interfaces:**
- **Produces:**
  - `type ColorSchemePreference = 'system' | 'light' | 'dark'` and `AppInitialEntity.colorScheme?: ColorSchemePreference` (initial `'system'`).
  - Action `setColorSchemePreference(pref)`.
  - `useResolvedColorScheme(): ColorScheme`.
  - `navigationTheme(t: AppTheme): Theme`.
- **Consumes:** rn-ui `RnUiProvider colorScheme`, `useAppTheme`, `themeFor`, `LoadingComponent colorScheme` (Task 0).

**Rules:**
- `useResolvedColorScheme` reads the preference with the app's `useAppSelector`.
  - It returns `pref === 'system' ? (useColorScheme() ?? 'light') : pref`.
  - In an effect on `pref` it calls `Appearance.setColorScheme(pref === 'system' ? 'auto' : pref)`. RN 0.87 takes `'auto'` to follow the system again; `'unspecified'` is deprecated. That call makes native UI follow the override: alerts, date pickers, the keyboard, the iOS status bar and Android's night resources.
- **`App.tsx`:**
  - `PackageHost` passes `colorScheme={useResolvedColorScheme()}`.
  - `GestureHandlerRootView`'s ground and the launch `<LoadingComponent colorScheme={device} />` take `device = useColorScheme() ?? 'light'` and `themeFor(device).roles.canvas`. They draw before the store rehydrates, as the native splash does (spec: the splash follows the device only).
  - The parent's inner `View` (`App.tsx:123`) takes the resolved canvas.
- **`navigationTheme(t)`:**
  - `dark` = `t.scheme === 'dark'`;
  - `primary` and `notification` = `t.roles.primary`;
  - `background` = `t.home.screenBackground`;
  - `card` = `t.home.foodSurface`;
  - `text` = `t.home.titleColor`;
  - `border` = `t.home.mutedBorder`;
  - `fonts` = the parent's current `Fonts` mapping, moved here from `MainNavigation.tsx:126-150`.

  The parent's light values are unchanged. **Named light change:** the Staff app had no theme (React Navigation's `DefaultTheme`, background `rgb(242,242,242)`) and now gets these values. Screens paint their own ground, so only the transition ground changes, to `#F8F8FA`.
- **`ErrorBoundary`** is a class mounted above the providers. Its fallback builds its styles from `themeFor(Appearance.getColorScheme() ?? 'light')` through a module cache per scheme, and its raw `StatusBar` reads `theme.statusBar`.

- [ ] **Step 1: Write the failing tests** in `__tests__/colorScheme.test.tsx`:
  - `useResolvedColorScheme` (Review Focus 2):
    - `'system'` with `useColorScheme` mocked `'dark'` → `'dark'`, and it follows a change to `'light'`;
    - `'light'` with device `'dark'` → `'light'`;
    - `'system'` calls `Appearance.setColorScheme('auto')`, and `'dark'` calls it with `'dark'`.
  - The `app` reducer: `setColorSchemePreference('dark')` sets it, and the initial state is `'system'`.
  - Persist (Review Focus 3): rehydrating a saved `app` blob without `colorScheme` gives `'system'` through the store's reconciler. The sign-out test's expected kept keys include the preference.
  - Root (Review Focus 1):
    - `ErrorBoundary` with `Appearance.getColorScheme` mocked `'dark'` renders its fallback on `Roles.dark.canvas`, with `light-content`;
    - `navigationTheme(themeFor('dark'))` is `dark: true` with dark `background`, and `navigationTheme(themeFor('light'))` equals the parent's current light colours.
- [ ] **Step 2:** Run `npx jest -w 2 __tests__/colorScheme.test.tsx`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement the interfaces and rules above.
- [ ] **Step 4:** Run the gates. Expected: PASS. Then diff the two new shared files between the apps; expect them identical.
- [ ] **Step 5: Commit, per app.** `feat(theme): a System / Light / Dark preference, resolved against the device and handed to rn-ui and navigation`.

---

### Task 3: The gates that keep styles from going static again

**Files:**
- `scripts/check-consistency.mjs`
- `scripts/consistency-baseline.json`
- `__tests__/consistencyPackageRules.test.ts`
- `__tests__/themePolicy.test.ts` (new)
- `__tests__/helpers/darkContrast.ts` (new)

**Rules:**
- **`staticThemeStyles`** (in `RULES`, added to `NO_BASELINE`, spec "Gate"). It counts every `StyleSheet.create(` block, at any depth, that reads a colour.
  - What counts as a colour read: `Colors.` (except `transparent`), `HomeRebrandTokens.`, `CommonStyles.`, `NavigationShellTokens.`, `rebrandScreenCanvas`, `androidElevatedCardSurface`, or a colour literal.
  - `shadowColor:` lines are ignored.
  - Depth matters because Staff `LoginControls.tsx:100-125` nests `StyleSheet.create` inside module objects.
- **`themePolicy.test.ts`** (Jest, because it needs the token values; ported from rn-ui's `staticThemeStyles.test.ts` describe block). It fails on any of these in `src/` or `App.tsx`:
  - a `HomeRebrandTokens.<key>` read whose value differs between `homeRebrandTokens('light')` and `('dark')`;
  - any `CommonStyles.` or `NavigationShellTokens.` read;
  - a `Colors.<key>` read whose value is not the same in both schemes. Allowed:
    - `white`, `black`, `transparent`;
    - keys equal to a role that has the same value in light and dark (the accent `*100` family, `red`).
  - a `platformNativeColor` / `platformMixedColor` call given an Android name without the scheme.
- **`expectReadableInDark(tree)`**:
  - walks a rendered host tree;
  - for each text node with a hex colour, measures it against the nearest opaque `backgroundColor` above it (default `Roles.dark.canvas`);
  - fails below 4.5:1, listing the text and both colours.
- **Existing source-scanning tests that key on spelled token names** must keep checking something after `HomeRebrandTokens.x` becomes `t.home.x`. Teach each to match both spellings:
  - Staff `noWhiteTextOnPrimary100.test.ts`, `studentDetailsConformance.test.ts`, `phoneTabBarOverContent.test.tsx`, `platformColors.test.tsx`;
  - parent `platformColors.test.tsx`.

- [ ] **Step 1:** Add the rule's fixture cases to `consistencyPackageRules.test.ts`:
  - a static sheet with `HomeRebrandTokens.titleColor` counts 1;
  - one with only `shadowColor: Colors.black` counts 0;
  - a `createThemedStyles(t => …)` counts 0.

  Write `themePolicy.test.ts` and the helper. Run them. Expected:
  - the fixtures PASS;
  - `npm run check:consistency` FAILS, listing the 74 files;
  - `themePolicy` FAILS, listing the reads.
- [ ] **Step 2:** Leave these files uncommitted. They are committed with the last migration task (Task 8), where they first pass. Run them after each area task; the list shrinks each time.

---

### Tasks 4–8: Migrate the styled files, one screen area per commit per app

**Mapping** (by what the colour does, as in Plan 3):

| Today | Job | Becomes |
|---|---|---|
| `HomeRebrandTokens.x` | any | `t.home.x` |
| `CommonStyles.x` | any | `t.common.x` |
| `rebrandScreenCanvas` | ground | `t.roles.canvas` |
| `NavigationShellTokens.tabBar.x` | tab bar | `t.nav.tabBar.x` |
| `Colors.black`, `darkGray` | text | `t.roles.text` (consolidation) |
| `Colors.gray` (`gray_disabled` as text) | secondary text | `t.roles.textMuted` (consolidation) |
| `Colors.white` | surface | `t.roles.surface` (inside a sheet or modal: `t.roles.surfaceRaised`) |
| `Colors.white` | text or icon on an accent fill, dark glass or photo | unchanged, with a comment |
| `Colors.gray5`, `lightGray` | line, chip ground, disabled fill | `t.roles.border` / `borderStrong` / `surfaceSunken`, the closest light value; record any light difference in the commit body |
| `Colors.<f>100` | accent fill, border, dot | `t.roles.<f>` |
| `Colors.<f>10` / `<f>20` / `<f>Text` | tint / strong tint / text on a tint | `t.roles.<f>Tint` / `<f>TintStrong` / `<f>Text` |
| `Colors.red` / `green` | status | `t.roles.danger` / `success` (as text: `dangerText` / `successText`) |
| a fill under a white label | solid button | `t.home.solidFill` |

**Shapes:**
- **Style files:** `const styles = StyleSheet.create({…})` becomes `const useStyles = createThemedStyles(t => ({…}))`, with `const styles = useStyles()` in each component that reads it.
- **Expression-bodied components** get a block body.
- **Module helpers that build style objects** (`cardShadow()` ×6 in Staff, `LoginControls` `h4Bold` / `commonLabel` / `buttonStyles`) take `t`.
- **Ripple configs** and other objects built from colours move into the component under `useMemo([t])`.
- **JSX reads** use `const t = useAppTheme()`. These are icon `color`, `highlightColor`, `placeholderTextColor`, `RefreshControl` `tintColor`/`colors`, `ActivityIndicator`, `Switch` `trackColor`, and svg `stroke`.
- **Tone maps** (`STATUS_META`, `STATUS_TONE`, `TONE`, `TILE_TONES`, `PILL_BY_TONE`, `STATUS_BADGE`, `ATTENDANCE_TONE`, `LEVEL_TONE`, `STRENGTH_COLORS`, `STATUS_STYLE`) hold role names, e.g. `{ bg: 'tealTint', fg: 'tealText' }`, and resolve them in render with `t.roles[meta.bg]`. A tone map stays a flat `as const` map in its screen.
- **Status bars:**
  - Drop the hard-coded `barStyle="dark-content"`; rn-ui's `AppStatusBar` defaults from the scheme. That is 20 sites in the parent and 5 in Staff, plus `App.tsx`.
  - Keep `light-content` / `statusBarStyle: 'light'` on the dark screens.
  - The parent `Album.tsx:644-646` ternary becomes `viewerOpen ? 'light-content' : undefined`.

**Per area:**
- **Each step:** run `npm run check:consistency` and `npx jest -w 2 __tests__/themePolicy.test.ts`; the area's files leave both lists.
- **Each area's tests:** its existing tests pass. One of its existing render tests (or a new one) also renders under `<RnUiProvider colorScheme="dark">` and calls `expectReadableInDark`.
- **Commit, per area per app:** `refactor(<area>): read colours from the scheme`.
  - The body names any consolidation moves (black, dark grey or grey text in this area) and any named exception.
  - Staff areas covered by `phoneGolden.json` regenerate it only when the body lists a light move.

### Task 4: Shell, auth and settings

**Files:**
- **Parent (11 files):**
  - `App.tsx` styles;
  - `src/navigation/{MainStack,TabBar,MainNavigation,HeaderComponents}.tsx`;
  - `src/screens/{Login,splash,staffRedirect}/**`;
  - `src/screens/Settings/{Settings,ChangePassword,ProfileUpdate}.tsx`.
  - Delete `src/navigation/TopTabBar.tsx`: dead code, nothing imports it.
- **Staff (14 files):**
  - `App.tsx` styles;
  - `src/navigation/{TabBar,MainStack,PhoneTabsNavigation,navigationRegistry}.tsx`;
  - `src/navigation/components/{AccountActions,customDrawer,HomeHeader}.tsx`;
  - `src/common/components/StudentTagList.tsx`;
  - `src/screens/{Login,splash,ChangePassword,More,Settings}/**`.

**Specifics:**
- **The tablet drawer's `screenOptions`** (`MainStack.tsx:205-232`) and **`drawerIcon`** (`navigationRegistry.tsx:314-322`) read `t` inside the navigator component. `screenOptions` takes a function or a memo on `t`.
- **`TabBar`** reads `t.nav.tabBar` in place of the module `T` constant.

**Test:** `phoneTabBarOverContent` asserts the dark tab bar ground under a dark provider.

### Task 5: Home

**Files:**
- **Parent:** `src/screens/main/**` (13 colour files and 23 JSX reads).
- **Staff:** `src/screens/main/**` (10 files), including `HomeTopTabs` and its `CustomTabBar`.

**Specifics:**
- **Staff activity circles** (`HomeActivityGridPaginated.tsx:45-48`). Spec, Decisions: the circle keeps its light pastel in dark.
  - It becomes `compositeOver(hex ?? playfulAccent, 0.16, LIGHT_CANVAS)`. `LIGHT_CANVAS` is `themeFor('light').roles.canvas` (`#F8F8FA`), and `compositeOver` is imported from `@upriseedu-tech/design-tokens`, as `src/core/feedback/feedback.ts` already imports the package.
  - That is the opaque colour today's translucent circle already shows on the light canvas, so light is unchanged and dark keeps the pastel behind the black line art.
  - Ruling against the spec's "over white": the spec's aim (a light circle) holds, and white would move light by about 1%.
- **Named light exception:** the Staff `FloatingUploadIndicator` dismiss badge (`:280`, `titleColor` as a dark chip under a white ×) moves to `t.home.mediaStage` (`#0F0E17`, the same in both schemes). In dark, `titleColor` turns light and the white × would vanish.
- **String-built colours** (`${token}29`, parent `Album.tsx:367` `${playfulAccent}18`) stay only on tokens that are a 6-digit hex in both schemes.

**Tests:**
- An activity tile under a dark provider has an opaque circle equal to `compositeOver(color, 0.16, '#F8F8FA')`. Review Focus 4.
- `homeRebrandTokens(s).playfulAccent` matches `/^#[0-9A-F]{6}$/i` for both schemes. Review Focus 5.

### Task 6: Students, attendance and daily records

**Files:**
- **Parent:** `src/screens/{Attendance,DailyReports,ProgressReport,MedicalAssessment,AccidentReport}/**`, `src/screens/studentDetails.tsx` and its components.
- **Staff:**
  - `src/screens/{Student,StudentDetails,DailySchedule,Vacation,ProgressReport,MedicalAssessment,AccidentReport}/**`;
  - `src/screens/staff/**` (`AttendanceHistoryScreen`, `CheckInScreen`, `StaffProfileScreen`);
  - `src/screens/modals/**` (`ActionModal`, `MaterialModal`, `TaggingModal`, `VacationModal`, `DateSelector`).

**Specifics:**
- **`activityPillColors`** (Staff `src/screens/Student/helpers/activityPill.ts:20-38`) takes `t` for its fallback pair only (`t.home.calmGhostSurface` / `t.home.titleColor`).
  - The candidate text colours checked against the server fill stay the light ink and white. The fill is the server's light colour in both schemes.
  - `activityPillContrast.test.ts` keeps passing unchanged.
  - Add a dark-provider case.
- **`DateSelector`** (`react-native-calendars`):
  - the `theme` is built from `t`;
  - the `Calendar` gets `key={t.scheme}`, so a flip remounts it (the library caches its styles);
  - the selected-day text (`heroSurface` used as a foreground, `:71,101,106`) becomes `Colors.white` on the accent fill. **Named light exception:** it moves from 94% white (`#F5F5F9` on Android) to white;
  - `dateSelectorCalendarContrast.test.ts` is updated to that.
- **The pickers.**
  - DateTimePicker `themeVariant` comes from `t.scheme`: Staff `ActionModal.tsx:367`, and in the parent `AttendanceDateFilter.tsx:133` and `PickupRoute.tsx:28` (Task 8).
  - `textColor` / `accentColor` come from `t`.
  - Android dialogs follow the DayNight theme (Task 9) and `Appearance`.
- **Named light exception:** the QR viewfinder (`CheckInScreen.tsx:1416-1421`, `titleColor` as a ground) moves to `t.home.mediaStage`. It is a camera stage.
- **`Colors.white` as a surface:** the 17 Staff sites (AccidentReport ×5, MedicalAssessment ×5, `ProgressReport.tsx:560`, `StudentAttendanceCell.tsx:140`, `CheckInScreen.tsx:1401`, …) follow the mapping.

**Tests:**
- Calendar: rendering under light then dark changes its `key`, and the pickers' `themeVariant` is `'dark'` under a dark provider. Review Focus 5.
- The pill: a dark-provider case. Review Focus 4.

### Task 7: Media and learning

**Files:**
- **Parent:** `src/screens/{Album,Gallery,learnings}/**`, `src/screens/Settings/NurseryPolicy.tsx`.
- **Staff:** `src/screens/{Album,Albums,Learnings,camera}/**`.

**Specifics:**
- **The camera and viewers stay dark** (`Colors.black`, `mediaStage`, `mediaControl*`, `cameraControlScrim`, white controls): all of them are the same in both schemes.
- **The Staff `ImageViewer` tags panel** (`:455-538`, `heroSurface` with `Colors.black` text) follows the mapping, so it goes dark in dark.
- **Nursery Policy** is a server page, so it stays light (spec). `HTML_WRAP` / `WEBVIEW_BACKGROUND` read `themeFor('light')` explicitly, with a comment citing the spec. The screen chrome around it follows the scheme.

**Test:** the generated HTML is the same under a dark provider (it still carries the light ground and ink). Review Focus 4.

### Task 8: Chat, notifications and requests

**Files:**
- **Parent:** `src/screens/{chat,notifications,pickup,RequestStatus,RequestsList,OrientationBooking,BranchList,NurseryList}/**`, `src/common/components/ErrorBoundary.tsx` styles if any are left from Task 2.
- **Staff:** `src/screens/{chat,Notification,announcements,Pickup}/**`.

**Specifics:**
- The parent `PickupRoute` and `AttendanceDateFilter` pickers, as in Task 6.

**Close:**
- [ ] **Step 1:** Run `npm run check:consistency` and `npx jest -w 2 __tests__/themePolicy.test.ts`. Expected: PASS, 0 files and 0 reads.
- [ ] **Step 2:** Commit the Task 3 gate files: `test(theme): fail any style that reads a colour where the scheme cannot reach it`.

---

### Task 9: Native files

**Files (each app):**
- iOS: `ios/UpriseMobile/Info.plist:119-120` (Staff `ios/upriseTablet/Info.plist:116-117`), and `Images.xcassets/SplashBackground.colorset/Contents.json`.
- Android: `android/app/src/main/res/values/styles.xml`, `values/bools.xml` (new), `values-night/colors.xml` (new), `values-night/bools.xml` (new).

**Changes:**
- **Remove `UIUserInterfaceStyle`.** `UIViewControllerBasedStatusBarAppearance` stays, and native-stack's default status bar style then follows the interface style.
- **The colorset** gains a `"appearances": [{ "appearance": "luminosity", "value": "dark" }]` entry at `launchScreenBackground('dark')` = `#121214`. The splash mark is the unchanged logo (owner).
- **Android themes:**
  - `BaseAppTheme`'s parent becomes `Theme.AppCompat.DayNight.NoActionBar`.
  - `android:windowLightStatusBar` reads `@bool/light_system_bars`: `true` in `values/`, `false` in `values-night/`.
  - `values-night/colors.xml` sets `splash_background` `#121214`, which `values-v31` reads for the Android 12 splash.
  - `uiMode` is already in `configChanges`, so a flip does not recreate the activity.
- **Drop `appearance="light"`** from the parent's `LaunchScreen.storyboard:3` if Xcode keeps it as a document attribute that forces light. Verify in the build.

**Steps:**
- [ ] **Step 1:** Make the changes. Build both apps (`npm run ios` / `npm run android` on the simulator and emulator).
- [ ] **Step 2:** Check by hand, and report each item literally:
  - With the device dark (`xcrun simctl ui booted appearance dark`, `adb shell cmd uimode night yes`), the native splash is `#121214`.
  - The status bar icons are light on dark screens and dark on light screens.
  - The Android navigation-bar icons follow. If they don't, add `android:windowLightNavigationBar` with the same bool.
- [ ] **Step 3: Commit, per app.** `feat(native): stop pinning light; the splash and system bars follow the device`.

---

### Task 10: The Appearance row in Settings

**Files:**
- `src/common/localization/translations/commonLocalization.ts`, keys:
  - `appearance` (Appearance / المظهر);
  - `appearanceSystem` (Match device / حسب الجهاز);
  - `appearanceLight` (Light / فاتح);
  - `appearanceDark` (Dark / داكن).
- Parent `src/screens/Settings/Settings.tsx`: a row after the language row.
- Staff `src/navigation/components/AccountActions.tsx`: after the language row, so it shows in both the phone Settings and the tablet drawer.
- Tests: parent `__tests__/settings*.test.tsx`; Staff `settingsScreen.test.tsx`, `accountActionsRows.test.tsx`, `moreSettingsRows.test.tsx`.

**The row:**
- `SettingRow` with:
  - `title t('appearance')`;
  - `value` = the label of the current choice;
  - `icon { concept: 'appearance' }`;
  - `testID` `settings.appearance` (parent) / `account.appearance` (Staff).
- On press it calls `pickOption({ title: t('appearance'), options: [system, light, dark], selected })`, as the parent's `NurseryList.tsx:187-198` does. A value dispatches `setColorSchemePreference`; `undefined` (dismissed) does nothing.
- No restart: the scheme applies on the next render.

**Steps:**
- [ ] **Step 1: Failing tests.**
  - The row shows "Match device" by default.
  - Pressing it opens `pickOption` with the three options in that order and `selected: 'system'`.
  - Picking `'dark'` dispatches `setColorSchemePreference('dark')` and the row then shows "Dark".
  - A dismissed picker changes nothing.
  - The Staff row is the same in the drawer (tablet) and in Settings (phone).
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement the row and the strings.
- [ ] **Step 4:** Run the gates (`check:i18n` included). Expected: PASS. Confirm the parent's Detox language flow (`e2e/flows/10-language.test.ts`) still finds `settings.languageToggle`.
- [ ] **Step 5: Commit, per app.** `feat(settings): choose Match device, Light or Dark, applied at once`.

---

### Task 11: Docs, verification on devices, PRs

**Files:** `README.md` (both apps say "light-only": the parent at `:117-120`, Staff at `:118`), `src/design-system/README.md` (Staff's says rn-ui 0.3.3), `CHANGELOG.md` `[Unreleased]`, the roadmap row for Plan 4.

- [ ] **Step 1: Docs.** Correct each "light-only" line with a dated note ("Corrected <date>: …"). Each CHANGELOG `[Unreleased]` gets Added (the preference and the row), Changed (the light consolidation, with values, and the named exceptions) and the release note: store build only; OTAs for older binaries are cut from a branch without this work.
- [ ] **Step 2: The full gates in both apps.** Expected: all pass; `check:consistency` at 0 for `staticThemeStyles`.
- [ ] **Step 3: Devices (spec, Verification).** Report what ran, as it ran.
  - **Coverage:** the parent on an iPhone portrait simulator and a Pixel emulator. Staff on phone portrait, plus iPad landscape at 1366×1024 and 1194×834 with the 320pt drawer.
  - **Each in Light, Dark and Match device, in EN and AR, checking:**
    - Home, a student, chat, the gallery and viewer, Settings, and a form with a date picker (Staff: also check-in and the camera);
    - flip the device while the app is open, and it follows live;
    - the override wins over the device;
    - sign out and back in, and the choice is kept;
    - kill and relaunch: the splash follows the device, then the app shows the chosen scheme.
  - **Light before/after:** compare each area's light screenshots against the preview build. The only differences are the listed moves.
- [ ] **Step 4: Push and open the PRs** into `preview/consistency-2026-10`, one per app, with:
  - `## Verification`: gates with counts; the device matrix as run; the Staff golden diffs;
  - `## Risk & rollback`: store build only, no OTA to older binaries; revert the PR to roll back;
  - the cross-link to the other app's PR.

  Mark Plan 4 built in the roadmap.

---

## Rulings this plan makes against the spec text

These are recorded here, so the owner reviews them with the plan:
- **The Staff `src/design-system/theme/home.ts` re-exports rn-ui and holds no tokens.** The spec's "same per-scheme treatment" has nothing to convert; its one colour importer (`AttendanceConfirmSheet`) migrates with Home.
- **The counts are 74 styled files with colour per app** (plus 2 without colour), not 75.
- **The languages row is a toggle, not a picker.** The Appearance row uses `pickOption`, as the spec says, so the two rows behave differently on purpose: a two-way choice toggles, a three-way choice opens a picker.
- **New package pieces the spec didn't name:**
  - the `appearance` icon concept;
  - `LoadingComponent colorScheme`, so the launch view follows the device like the splash.
- **The activity circle is composited over the light canvas, not white,** so light stays identical.
- **Three named light exceptions:** the Staff navigation theme, two near-black chips, and the calendar's selected-day text.
