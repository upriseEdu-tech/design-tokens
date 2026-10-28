# Plan 3: rn-ui theme and migration (rn-ui 0.4.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@upriseedu-tech/rn-ui` draws every component in light or graphite dark from a host-supplied scheme, switching live, so Plan 4 can turn dark mode on in the parent and Staff apps.

**Architecture:**
- **Provider.** `RnUiProvider` takes `colorScheme`. A per-scheme `AppTheme` (roles, home tokens, nav-shell tokens) is cached.
- **Style hook.** `createThemedStyles(factory)` gives each of the 32 styled files a `useStyles()` hook that builds `StyleSheet.create(factory(theme))` at most once per scheme.
- **Tokens per scheme.** rn-ui's own home tokens and `CommonStyles` become per-scheme the way design-tokens 0.8.0's are.
- **Code outside React.** The nav-shell getters, `confirm()` and the Android colour map read a mirrored scheme.
- **Two phases.** The migration is light-identical, so the existing render goldens guard every migration commit. The owner's light consolidation of `Colors.black` / `darkGray` / `gray` as text is one later commit that re-records the goldens once.

**Tech Stack:** React Native 0.87.1, React 19.2.3, TypeScript, Jest 30 (`react-test-renderer`), `@upriseedu-tech/design-tokens` 0.8.0.

**Spec:** `docs/superpowers/specs/2026-10-26-dark-mode-design.md` ("rn-ui" section). Roadmap: `docs/superpowers/plans/2026-10-27-dark-mode-roadmap.md`. Builds on Plan 1 (0.8.0: `Roles`, `sharedHomeTokens`, `navigationShellTokens`, `systemChrome`, `resolveColour`, `contrastRatio`, `ColourSource`).

## Global Constraints

- **Worktree:** `.worktrees/rnui-dark`, branch `feat/dark-mode` off `origin/main` (`8bf6403`, 0.3.10). Conventional Commits, authored by Fady Shawky, no AI attribution.
- **JS-only package rules hold:**
  - host context comes only through `RnUiProvider`;
  - no host imports (`check:host-imports`);
  - peers come from what the files import (`check:peers`);
  - en/ar strings parity (`check:strings`).
- **Default scheme.** A host that passes no `colorScheme` gets **light**, exactly as 0.3.10 draws. Apps on rn-ui 0.4.0 without Plan 4 must look unchanged apart from the consolidation.
- **Dark values.** A dark value is a design-tokens role, or a `{ same }` value: dark-glass and media chrome already designed for both, accents, and the on-accent ink. Never a new hex.
- **Text on a solid accent fill stays ink `#1A1732` in both schemes.** That is `onAccentText` (selected ChoiceChip): 5.39:1 on `primary` in both, because the accent fill doesn't change. It is `{ same }`, never the `text` role, which turns light in dark. `PrimaryButton`'s white label on `primary` stays as it is (3.21:1, a known separate AA item, out of scope).
- **Light changes in two named commits only:**
  - the 0.8.0 bump (Task 1: the 13 design-tokens values);
  - the consolidation (Task 4: `Colors.black` / `darkGray` as text → `text`, `Colors.gray` as text → `textMuted`).

  Every other commit leaves the render goldens (`__tests__/fixtures/parent*Golden.json`) byte-identical.
- **Gates:** `npm run typecheck && npm run lint && npx jest -w 2 && npm run check:host-imports && npm run check:strings`. Jest runs at `-w 2`, one run at a time; check `pgrep -f "[j]est/bin|[j]est -w" >/dev/null && echo busy || echo free` first.
- **Publishing** follows `RELEASING.md` and happens only on the owner's go.

## Review Focus

1. **Code outside React reading the scheme at call time.** The nav getters, `confirm()` sheets and `colorHelpers.resolveColor` must read the mirrored scheme when called, not a value captured at import. Test in Task 2: with the provider in dark, `getTabBarSurfaceColor()` returns the dark value.
2. **Memoised components and recycled list cells keeping light styles after a flip.** `useStyles()` reads context, so a `React.memo` child re-renders on a scheme change. Test in Task 2: a memo'd component inside the provider shows dark styles after the provider flips, without new props.
3. **Text on accent fills in dark.** `onAccentText` must stay ink. Test in Task 2: ≥ 4.5:1 on `primary` in both schemes, and the selected ChoiceChip renders `#1A1732` under a dark provider.
4. **Android colour map.** iOS `PlatformColor` names (TouchablePlatform's `secondarySystemFill`, …) follow iOS appearance by themselves. Android draws the `ANDROID_TOKENS` map, which is static today. Test in Task 2: `resolveColor` on Android under dark returns the dark value.
5. **A host with no `colorScheme`** (an app bumping to 0.4.0 before Plan 4). It must render light, `getRnUiColorScheme()` must be `'light'`, and nothing may throw. Test in Task 2.

---

## File structure

| Path | Responsibility |
|---|---|
| `package.json` (modify) | design-tokens peer `^0.8.0`, dev `0.8.0`; version 0.4.0 (Task 5) |
| `src/provider/RnUiProvider.tsx` (modify) | `colorScheme` prop, `RnUiHost.colorScheme`, `getRnUiColorScheme()` mirror |
| `src/theme/appTheme.ts` (create) | `AppTheme`, `themeFor(scheme)` (cached) |
| `src/theme/useAppTheme.ts` (create) | `useAppTheme()` |
| `src/theme/createThemedStyles.ts` (create) | `createThemedStyles(factory)` → `useStyles()` |
| `src/theme/home.ts` (modify) | `HomeRebrandColourSources`, `homeRebrandTokens(scheme)`; `HomeRebrandTokens` = light |
| `src/theme/commonStyles.ts` (modify) | `commonStylesFor(scheme)`; `CommonStyles` = light |
| `src/theme/navigationShell.ts` (modify) | getters read `navigationShellTokens(getRnUiColorScheme())` |
| `src/theme/index.ts`, `src/index.ts` (modify) | exports |
| `src/primitives/AppStatusBar.tsx`, `src/feedback/LoadingComponent.tsx:34`, `src/navigation/ScreenHeader.tsx:64` (modify) | status bar from the scheme |
| `src/utils/colorHelpers.ts` (modify) | Android token map per scheme |
| the 32 styled files (modify) | `createThemedStyles` (Task 3) |
| `__tests__/darkTheme.test.tsx` (create), `__tests__/themedStyles.test.ts` (create), `__tests__/fixtures/darkThemeGolden.json` (create), `__tests__/fixtures/parent*Golden.json` (re-record in Tasks 1 and 4 only) | |
| `CHANGELOG.md`, `README.md` (modify) | 0.4.0 notes, "Adopting 0.4.0" |

---

### Task 1: design-tokens 0.8.0

**Files:** `package.json`, `package-lock.json`, `__tests__/fixtures/parentThemeGolden.json`, `__tests__/scaffold.test.ts` (the design-tokens peer test)

- [ ] **Step 1: Update the scaffold test first**

The "design-tokens is a peer, tested at the version the apps pin" test expects the peer `^0.8.0` and the dev pin `0.8.0`.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest -w 2 __tests__/scaffold.test.ts`
Expected: FAIL on the design-tokens test.

- [ ] **Step 3: Bump the package**

`npm install --save-dev --save-exact @upriseedu-tech/design-tokens@0.8.0` and set the peer to `^0.8.0`. The install needs `UPRISE_NPM_TOKEN`; never print it.

- [ ] **Step 4: Re-record the theme golden**

Re-record it with the test's own dump rule, then check the diff.

Expected: exactly the Plan 1 light moves that reach rn-ui's exports:
- `HomeRebrandTokens`: `priorityPairIconShellBg`, `calmGhostSurface`, `subtitleColor`, `foodEmptyTitle`, `foodEmptySubtitle`, `foodFlatMealEyebrow`, `chatMetaText`, `foodEmptyIconBg`, `chatMetaBg`, `welcomeBrandSurface`;
- `NavigationShellTokens`: `tabBar.inactiveColor`, `tabBar.shadowColor`, `header.pillShadowColor`.

The render goldens move only where a component reads one of those. List every moved leaf in the commit body.

- [ ] **Step 5: Run the gates and commit**

`npx jest -w 2` passes.

`chore(deps): design-tokens 0.8.0, with its one-time light consolidation`

---

### Task 2: Theme core: scheme, theme, styles hook, per-scheme tokens

**Files:**
- Create: `src/theme/appTheme.ts`, `src/theme/useAppTheme.ts`, `src/theme/createThemedStyles.ts`, `__tests__/darkTheme.test.tsx`, `__tests__/themedStyles.test.ts`
- Modify: `src/provider/RnUiProvider.tsx`, `src/theme/home.ts`, `src/theme/commonStyles.ts`, `src/theme/navigationShell.ts`, `src/theme/index.ts`, `src/index.ts`, `src/primitives/AppStatusBar.tsx`, `src/feedback/LoadingComponent.tsx`, `src/navigation/ScreenHeader.tsx`, `src/utils/colorHelpers.ts`

**Interfaces:**
- Consumes: 0.8.0's `Roles`, `ColorScheme`, `ColourSource`, `resolveColour`, `sharedHomeTokens`, `navigationShellTokens`, `systemChrome`, `contrastRatio`.
- Produces:
  - `RnUiProvider` gains the prop `colorScheme?: ColorScheme` (default `'light'`) and `RnUiHost.colorScheme`.
  - `getRnUiColorScheme(): ColorScheme` mirrors the mounted provider, like `getRnUiLanguage`, and returns `'light'` with none mounted.
  - `type AppTheme = { scheme: ColorScheme; roles: Record<RoleName, string>; home: ReturnType<typeof homeRebrandTokens>; nav: ReturnType<typeof navigationShellTokens>; legacyText: { black: string; darkGray: string; gray: string }; statusBar: 'dark-content' | 'light-content' }`
  - `themeFor(scheme): AppTheme` is cached and returns the same object per scheme.
  - `useAppTheme(): AppTheme`. With no provider it returns the light theme.
  - `createThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (t: AppTheme) => T): () => T`. The returned hook builds `StyleSheet.create(factory(themeFor(scheme)))` once per scheme, at module level.
  - `homeRebrandTokens(scheme)`, `HomeRebrandColourSources`, `HomeRebrandTokens = homeRebrandTokens('light')`, `commonStylesFor(scheme)`, `CommonStyles = commonStylesFor('light')`.
  - `legacyText` is `{ black: '#000000', darkGray: '#262626', gray: '#929292' }` in light, and `{ text, text, textMuted }` (roles) in dark. **It exists only until Task 4**, which removes it.

**`HomeRebrandColourSources`.** rn-ui's own keys; the spread `sharedHomeTokens(scheme)` brings the shared 26.

| Keys | Source |
|---|---|
| `priorityPairSurface`, `heroSurface` | iOS `surfaceFrosted` / Android `surfaceElevatedAndroid` (picked by `Platform.OS` at load, as today) |
| `foodSurface`, `birthdaySurface` | `surface` |
| `foodBorder`, `birthdayBorder`, `birthdayCardBorder` | `border` |
| `foodSeparator` | `borderStrong` |
| `foodHeaderSurface` / `birthdayCardSurface` | `{ light: today's, dark: 'surfaceRaised' }` |
| `foodDateChipBg` | `{ light: '#F1F1F4', dark: 'surfaceSunken' }` |
| `foodDateChipText`, `foodMealContent`, `birthdayNameText` | `{ light: today's, dark: 'text' }` |
| `birthdayDateText` | `{ light: '#6C688A', dark: 'textMuted' }` |
| `foodMealLabel`, `foodEliteTodayBadgeText`, `birthdayAccentText` | `{ light: today's, dark: 'primaryText' }` |
| `foodFlatListBg` | `{ light: 'rgba(255,255,255,0.82)', dark: 'surfaceFrosted' }` |
| `birthdayAvatarRing` | `{ light: 'rgba(26,23,50,0.10)', dark: 'borderStrong' }` |
| `buttonPressHighlight` | `{ light: 'rgba(0,0,0,0.05)', dark: 'border' }` |
| `sheetSurface`, `tabBarSurface` | `surfaceRaised` |
| `sheetHandle` | `{ light: 'rgba(106,103,136,0.32)', dark: 'borderStrong' }` |
| `onAccentText` | `{ same: '#1A1732' }`: ink on a solid accent fill, 5.39:1 on `primary` in both schemes |
| `welcomeLogoShellBg`, `welcomeLogoShellBorder` | `{ same }`: a nursery logo keeps its light tile |
| `foodEliteTodayBadgeBg`, `birthdayAccentBg`, `forceUpdateAccentSoft`, `forceUpdateAccentRing`, `attendanceDone*` | `{ same }`: translucent accents |
| `media*`, `cameraControlScrim`, `networkBanner*`, `galleryScrim*`, `chatViewer*`, `sheetOverlay` | `{ same }`: already designed for both, dark glass over content |

**`commonStylesFor(scheme)`.** The screen and card backgrounds use `canvas` / `surface`. The text presets use `legacyText.black` until Task 4. The card's `shadowColor: '#2D9CDB'` stays (`{ same }`).

- [ ] **Step 1: Write the failing tests**

`__tests__/themedStyles.test.ts`:

```ts
test('themeFor caches one theme per scheme', () => expect(themeFor('dark')).toBe(themeFor('dark')));
test('createThemedStyles builds once per scheme', () => {
  const factory = jest.fn((t: AppTheme) => ({ box: { backgroundColor: t.roles.surface } }));
  const useStyles = createThemedStyles(factory);
  // render a probe twice in light, once in dark (renderHook-style probe under RnUiProvider)
  expect(factory).toHaveBeenCalledTimes(2);
});
test('no provider → light; getRnUiColorScheme() is light', …);                     // Review Focus 5
test('homeRebrandTokens("light") deep-equals HomeRebrandTokens; CommonStyles = commonStylesFor("light")', …);
test('every dark colour in homeRebrandTokens is a Roles.dark value or its { same }', …);
test('non-colour home values are identical in both schemes', …);
```

`__tests__/darkTheme.test.tsx`:

```ts
test('getTabBarSurfaceColor() follows the mounted provider', …);                    // Review Focus 1
test('a React.memo child restyles when the provider flips to dark', …);             // Review Focus 2
test('onAccentText is #1A1732 and reaches 4.5:1 on primary in both schemes', …);    // Review Focus 3
test('selected ChoiceChip label renders #1A1732 under a dark provider', …);
test('resolveColor on Android maps divider/secondaryText by scheme', …);           // Review Focus 4 (Platform mocked to android)
test('AppStatusBar defaults to light-content in dark, dark-content in light', …);
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx jest -w 2 __tests__/themedStyles.test.ts __tests__/darkTheme.test.tsx`
Expected: FAIL, because the modules are missing.

- [ ] **Step 3: Implement**

- **Mirror:** `getRnUiColorScheme` lives beside `getRnUiLanguage` in `RnUiProvider.tsx` and works the same way.
- **Colour sources:** resolve with design-tokens' `resolveColour`, which throws on a mistyped role.
- **Android map:** `colorHelpers.ANDROID_TOKENS` becomes a function of `getRnUiColorScheme()`:
  - `divider`: light `Colors.gray5`, dark `border`;
  - `primary`: light `Colors.primaryText`, dark the dark `primaryText`;
  - `secondaryText`: light `Colors.gray`, dark `textMuted`.
- **Status bar:** `AppStatusBar` takes `barStyle` from `useAppTheme().statusBar` when none is passed. Drop the explicit `dark-content` at `LoadingComponent.tsx:34` and `ScreenHeader.tsx:64`. Its iOS comment now says that iOS follows `UIUserInterfaceStyle`, which Plan 4 stops pinning.

- [ ] **Step 4: Run the gates**

Run: `npm run typecheck && npm run lint && npx jest -w 2`
Expected: PASS, with the render goldens unchanged, because light is identical.

- [ ] **Step 5: Commit**

`feat(theme): a colour scheme from the host, a per-scheme theme and a styles hook that builds once per scheme`

---

### Task 3: Migrate the 32 styled files

**Files:** every `src/**` file with a module-level `StyleSheet.create` that reads a colour. As of `8bf6403`:
- `app/ForceUpdateModal`;
- `feedback/{EmptyView,LoadingComponent,NetworkBanner,SkeletonPlaceholder,Skeletons,SnackbarProvider,TryAgain}`;
- `home/{ChatFab,GalleryCard,HomeTopBar}`;
- `inputs/{ChoiceChip,PrimaryButton,PrimaryTextInput,RadioButton,RadioIcon}`;
- `lists/FlatListWrapper`;
- `media/{AuthAmbientBackground,ImageGallery,LogoTile,viewerChrome}`;
- `navigation/{HeaderIconButton,ScreenHeader}`;
- `primitives/{LinkText,TouchablePlatform}`;
- `settings/SettingRow`;
- `sheets/{AppSheet,ConfirmSheet,SelectSheet}`.

Plus a new `__tests__/staticThemeStyles.test.ts`.

**Interfaces:**
- Consumes: `createThemedStyles`, `AppTheme` (Task 2).

**Mapping rule** (by what the colour does, not by name):

| Today | Job | Becomes |
|---|---|---|
| `Colors.black`, `Colors.darkGray` | text | `t.legacyText.black` / `.darkGray` (Task 4 moves these to `text`) |
| `Colors.gray` (and `gray2`, `lightGray` as text) | text | `t.legacyText.gray` (Task 4 → `textMuted`) |
| `Colors.white` | surface | `t.roles.surface` (sheets: `surfaceRaised`) |
| `Colors.white` | text or icon on an accent fill or dark glass | `'#FFFFFF'` unchanged (`{ same }`); comment why |
| `Colors.gray5`, `lightGray` | line, skeleton fill | `t.roles.border` / `borderStrong` / `surfaceSunken` (the closest light value; record it if not identical) |
| `Colors.<f>100` | accent fill, border, dot | `t.roles.<f>` |
| `Colors.<f>10` / `<f>20` / `<f>Text` | tint ground / text on it | `t.roles.<f>Tint` / `<f>TintStrong` / `<f>Text` |
| `Colors.red` / `green` | status | `danger` / `success` (text: `dangerText` / `successText`) |
| `HomeRebrandTokens.x` | (any) | `t.home.x` |

One addition the spec asks for: `home/GalleryCard`'s cover photo gets a `t.roles.photoScrim` overlay. It is `transparent` in light, so the golden stays identical, and 12% black in dark takes the glare off a bright photo. The full-screen viewer gets none.

- [ ] **Step 1: Write the failing scan**

`__tests__/staticThemeStyles.test.ts` walks `src/`, excluding `src/theme/`. It fails on any file with a module-level `StyleSheet.create(` whose body reads `Colors.`, `HomeRebrandTokens.`, `CommonStyles.`, `rebrandScreenCanvas`, `androidElevatedCardSurface` or a colour literal (`#…`, `rgba(`). The failure lists the files.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest -w 2 __tests__/staticThemeStyles.test.ts`
Expected: FAIL, listing the 32 files.

- [ ] **Step 3: Migrate in five commits, one area each**

1. feedback;
2. inputs and lists;
3. sheets and settings;
4. home, media and navigation;
5. app and primitives.

For each commit:
- `const useStyles = createThemedStyles((t) => ({ … }))` at module level, `const styles = useStyles()` in the component;
- run `npx jest -w 2`;
- the **render goldens must stay byte-identical** (light is unchanged by construction);
- commit as `refactor(<area>): read colours from the scheme`.

- [ ] **Step 4: Run the scan**

Run: `npx jest -w 2 __tests__/staticThemeStyles.test.ts`
Expected: PASS, with 0 files.

---

### Task 4: The light consolidation

**Files:** `src/theme/appTheme.ts` (drop `legacyText`), every `t.legacyText.*` reader, `src/theme/commonStyles.ts`, `__tests__/fixtures/parent*Golden.json`, plus a test in `__tests__/themedStyles.test.ts`

- [ ] **Step 1: Add the failing test**

`AppTheme` has no `legacyText`, and no file in `src/` reads it.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest -w 2 __tests__/themedStyles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Consolidate**

- `t.legacyText.black` and `.darkGray` → `t.roles.text`; `.gray` → `t.roles.textMuted`.
- The `CommonStyles` text presets → `text`.
- Remove `legacyText`.
- Re-record the render goldens and the theme golden once. The commit body lists the moved values: `#000000` / `#262626` → `#1A1732`, and `#929292` → `#63607E`, which fixes 3.11:1 on white.

- [ ] **Step 4: Run the gates and commit**

Run: `npm run typecheck && npm run lint && npx jest -w 2`
Expected: PASS.

`feat(theme): one ink for text and one AA grey for secondary text, as the owner chose`

---

### Task 5: Dark golden, docs, release 0.4.0

**Files:** `__tests__/fixtures/darkThemeGolden.json` (create), `__tests__/theme.test.ts` (extend), `CHANGELOG.md`, `README.md`, `package.json`

- [ ] **Step 1: Pin dark**

Add a `themeFor('dark')` dump (with the test's function rule) as `darkThemeGolden.json`, and a test that compares against it.

- [ ] **Step 2: Write the docs and bump the version**

- **CHANGELOG `[0.4.0]`:**
  - **Added:** the scheme API.
  - **Changed:** the two light commits, with values.
  - **Upgrading:**
    - pass `colorScheme` to `RnUiProvider`;
    - the design-tokens peer is now `^0.8.0`;
    - re-vendor `scripts/rn-ui-exports.json` (`node scripts/export-names.mjs`), because the new exports `useAppTheme`, `createThemedStyles`, `themeFor`, `homeRebrandTokens`, `commonStylesFor` and `getRnUiColorScheme` join the apps' duplicate rule.
- **README:** "Adopting 0.4.0".
- **`package.json`:** `"version": "0.4.0"`.

- [ ] **Step 3: Run the gates, push and open the PR**

Run the full `RELEASING.md` step 3 gates, then `npm run build && npm pack --dry-run`. Push as `upriseEdu-tech` with a per-command token. The PR carries `## Verification` (the pass counts, golden diffs from Tasks 1 and 4 only) and `## Risk & rollback`.

- [ ] **Step 4: Publish, only after merge and the owner's go**

Follow `RELEASING.md` steps 4–7: build, `check:peers` against both apps' preview branches, publish, annotated tag `v0.4.0`. Then mark Plan 3 done in the roadmap and write Plan 4.
