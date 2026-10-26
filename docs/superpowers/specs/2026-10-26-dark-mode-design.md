# Dark mode on every platform — design

**Date:** 2026-10-26
**Status:** Approved in conversation 2026-10-26, including the light-mode consolidation. Builder check done; the written spec awaits the owner's review. Not scheduled: this ships after the current store submissions are approved, with no deadline.
**Scope:** `design-tokens`, `rn-ui`, `dashboard`, `mobile` (parent app), `teacher` (UpriseEdu Staff, phone and tablet). No backend change. No change to the landing site, the nursery websites, emails or generated PDFs.
**Owner:** Fady Shawky.

## Goal

Every Uprise client (the dashboard, the parent app and the Staff app) gets a dark mode that is designed once and looks the same on all three.

- By default each app follows the device's own light/dark setting, and switches live while open (a phone that turns dark at sunset turns the app dark too).
- Settings gets a three-way choice: **System / Light / Dark**. The choice applies instantly, with no restart.
- The look is **graphite**: neutral near-black surfaces (`#121214` canvas), with the brand purple, teal, blue, coral, orange and yellow carrying the identity. Picked by the owner from three mocked directions (violet night, graphite, deep navy) on parent Home, then confirmed on Staff tablet Home and the dashboard Students list.
- The Uprise sun logo is **unchanged** in dark: same file, same colours. Owner's pick over a lightened-violet outline, a white outline and a light badge.
- Light mode keeps its look, with one deliberate tidy-up (owner, 2026-10-26): text colours that do the same job consolidate to one value per role.
  - Pure black `#000` and `#262626` text become ink `#1A1732`.
  - The greys used for secondary text become one AA grey.
  - The shift is slight, and it fixes today's AA failures: `Colors.gray` `#929292` is 3.11:1 on white, and `subtitleColor` is 4.47:1 on the `#F1F0F6` chip.

Mockups the owner chose from (local only, in no repo): `uprise/.superpowers/brainstorm/9279-1793014571/content/`, files `logo.html`, `dark-flavour.html` and `graphite-everywhere.html`.

## Current state

Read on 2026-10-26 from `design-tokens` `a5d0628`, `rn-ui` `8bf6403`, `mobile` `164eeb6`, `teacher` `a1b27db` (each `origin/main`) and `dashboard` `d62555e3` (`origin/master`).

Every client is light-only on purpose: the May 2026 rebrand removed the dashboard template's dark mode (`86895f41`, "remove theme presets, contrast, and settings drawer").

**design-tokens.** `src/colors.ts:9` is `enum Colors`, a fixed list of light hex values (53 colour lines, including the AA `*Text` tokens whose ratios are written beside them, all measured against light tints). `src/home.ts` `SharedHomeTokens` holds 26 more colours named after screens and features (`titleColor`, `foodEmptyTitle`, `chatMetaText`…). `src/navigationShell.ts` holds 14. `src/mobilePlatform.ts:127` `SystemChrome` is `{ colorScheme: 'light', statusBar: 'dark-content' }` and `:98` `LaunchScreen.background` is the light canvas. The package is data-only: no `react-native`, no `@mui`, no runtime dependency.

**rn-ui.** `src/theme/colors.ts` re-exports `Colors`. `src/theme/home.ts:7` `HomeRebrandTokens` spreads `SharedHomeTokens` and adds 47 colour tokens, two of them picked by `Platform.OS`. `src/theme/commonStyles.ts` adds 27. `src/theme/navigationShell.ts:26-41` exposes the surface colours through argument-less getters (`getTabBarSurfaceColor()` and siblings). `src/provider/RnUiProvider.tsx:47` is the only way a host reaches the package; it carries `language` and mirrors it into a module variable for code outside React (`confirm()`). `src/primitives/AppStatusBar.tsx:14` renders Android's `StatusBar` only (iOS status bar style is view-controller based) and its comment relies on the app being light-only. `LoadingComponent.tsx:34` and `ScreenHeader.tsx:64` hard-code `barStyle="dark-content"`. `__tests__/fixtures/parentThemeGolden.json` pins the theme values.

**Parent and Staff apps.** Zero colour literals in `src/`: every colour already comes from the tokens, which `check:tokens` (drift) and `check:consistency` enforce. The problem is **when** colours are read: 182 files build their styles with a module-level `StyleSheet.create` (rn-ui 32, mobile 75, teacher 75), so token values are baked in when the file loads. Screens also use the brand primitives directly for surfaces and text, 325 `Colors.*` references (rn-ui 97, teacher 203, mobile 25), against the house rule that primitives never decide a surface.

Native locks, both apps:
- iOS `Info.plist` sets `UIUserInterfaceStyle` = `Light` (mobile `ios/UpriseMobile/Info.plist:119`, teacher `ios/upriseTablet/Info.plist:116`).
- Android `res/values/styles.xml:4` parents `Theme.AppCompat.Light.NoActionBar`.
- `NavigationContainer` passes `dark: false` (mobile `src/navigation/MainNavigation.tsx:133`; teacher `src/navigation/MainNavigation.tsx:47`).
- 28 `barStyle` props are hard-coded (mobile 20 dark + 1 light, teacher 6 + 2).
- The splash screens (`LaunchScreen.storyboard` + `SplashBackground.colorset`, Android `splash_background.xml`) are light.

Android already lists `uiMode` in `configChanges` (mobile `AndroidManifest.xml:37`, teacher `:24`), so a theme flip does not recreate the activity.

The language preference lives in the `app` slice (`src/core/store/app/appState.ts`), is persisted, and survives sign-out through `KEPT_ON_LOGOUT` (mobile `src/core/store/rootReducer.ts:45`, teacher `:50`). The appearance preference follows the same path.

Content the apps do not draw: nursery logos (`rn-ui` `src/media/LogoTile.tsx`), photos, and Staff activity icons, which are server images (`icon_url`, black line art) shown at teacher `src/screens/main/components/HomeActivityGridPaginated.tsx:298`, `HomeSectionHeader.tsx:130` and `src/screens/StudentDetails/components/StudentActivityRow.tsx:78`.

**Dashboard.** MUI 5.14. `src/theme/index.jsx:47` already builds the palette from a mode (`palette(settings.themeMode)`), and `src/app.jsx:33` pins `themeMode: 'light'`. `src/theme/palette.js:127-169` still has the template's `dark` branch, undesigned. Template components still branch on `palette.mode` (`components/chart/chart.js:46`, `label/styles.js:7`, `snackbar/styles.js:8`, `custom-popover/styles.js:39`, `nav-section/mini/nav-item.jsx:147`). 424 `palette.*` references in 104 files follow the MUI theme and switch for free.

What does not switch:
- 78 files import `src/theme/tokens.js` and read its constants straight into `sx` (340 `RebrandTokens.*`, 87 `RebrandPalette.*`, plus `REBRAND_*`), e.g. `sections/auth/jwt/jwt-login-view.jsx:73`.
- 133 hex and 52 `rgba()` literals sit in about 45 files, mostly the template illustrations in `src/assets/illustrations/`.
- `src/global.css:8` mirrors the canvas hex, because CSS cannot import JS.
- `index.html:5` sets `theme-color` `#000000`.
- 5 files render ApexCharts.

The 133 files that import `@upriseedu-tech/design-tokens` directly take icons and feedback strings, not colours.

## Why this path and not the alternatives

- **RN: theme-reading style files, not the platforms' dynamic colours.** `DynamicColorIOS`/`PlatformColor` would leave the 182 style files alone. They are rejected for four reasons:
  - Android has no JS dynamic colour, so every token would have to live in each app's `values` and `values-night` resource files, which a JS-only package (`rn-ui`) cannot ship.
  - The resulting values are opaque objects, which `react-native-svg` props, Reanimated colour interpolation and the contrast tests cannot read.
  - The in-app switch would depend on `Appearance.setColorScheme` reaching every native colour lookup.

  The style-file route is mechanical, identical on iOS and Android, and testable in Jest. Owner approved it 2026-10-26.
- **RN: no restart-to-apply.** Choosing the theme once at launch would keep module-level styles, but it cannot follow the device live, and it needs a restart library (a native dependency).
- **Tokens: roles, not 170 hand-picked dark values.** Giving every screen-named token its own dark hex means about 170 picks and 170 contrast checks, and they drift. Instead the dark values are defined once per role (about 35), and screen-named tokens point at roles.
- **Dashboard: CSS variables, not moving 78 files onto `useTheme()`.** In chat this was described as "move onto the MUI theme". While writing the spec, CSS variables turned out to do the same job with no call-site change, so this spec uses them.
  - Making the `tokens.js` constants `var(--uprise-…)` strings leaves the ~430 `sx` call sites as they are.
  - The values switch by one attribute on `<html>`.
  - `global.css` stops mirroring a hex.

  MUI's own `CssVarsProvider` is experimental in 5.14 and would still mean rewriting the call sites to `theme.vars.*`.

## Decisions

| Question | Decision |
|---|---|
| Which clients? | Dashboard, parent app, Staff app (phone and tablet). *(owner)* |
| When? | After the current submissions are approved; no deadline. *(owner)* |
| How does the user get dark? | Follows the device by default; Settings has System / Light / Dark that overrides it. Applies instantly, no restart. *(owner)* |
| Which dark? | Graphite: canvas `#121214`, surface `#1C1C1F`, chip/sunken `#2A2A30`. *(owner, from mockups)* |
| Logo in dark? | Unchanged sun logo, same file. *(owner)* |
| How do RN styles switch? | Style files read the current theme through an rn-ui hook; no platform dynamic colours. *(owner)* |
| Where is the choice stored? | On the device (app: `app` slice; dashboard: browser storage), not on the account. Kept on sign-out like the language. No API change. |
| Token structure? | One role table with light and dark values. Screen-named tokens keep their names and resolve to roles. *(my call)* |
| Light: pixel-identical or consolidated? | Consolidated: one light value per job (main text, secondary text…). Light shifts slightly and today's AA failures are fixed. Chosen over keeping every old light value with its own dark pairing. *(owner)* |
| Server-provided activity colours in dark? | Keep their light look: the student-card pill keeps the server fill, and the icon circle's tint is composited over white, not over the dark card. *(my call)* |
| Can dark-mode JS reach an older binary by OTA? | No runtime check. OTAs for binaries built before dark mode are cut from a branch without it, under the existing rule of judging an OTA by the whole branch against the last shipped binary. *(my call)* |
| Server images in dark? | Nursery logos keep their light tile; Staff activity icons keep their light pastel circles (black line art would vanish on dark). Photos are shown as they are; gallery cover cards get a 12% scrim in dark, as mocked. *(my call)* |
| Splash screen? | Follows the device setting only: it draws before the app has read the stored choice. *(my call)* |
| What stays light? | Generated PDFs and progress reports, emails, server-provided web pages in WebViews (Learnings, Nursery Policy), store assets. *(my call)* |
| Dashboard mechanism? | `tokens.js` values become CSS variables; MUI palette rebuilt per mode. *(my call, see "Why")* |
| Rollout? | Dashboard may ship first (no store review). Parent and Staff ship dark mode together, one store build each. *(owner)* |

## design-tokens

**Roles.** A new `src/roles.ts` exports `Roles = { light, dark }`. Both sides have identical keys, and the `dark` side's type is the `light` side's keys, so a missing dark value fails `tsc`. Roughly 35 roles:

- **Neutrals:** `canvas`, `surface`, `surfaceSunken` (chips, segmented controls), `surfaceRaised` (sheets, popovers), `surfaceFrosted` (the iOS translucent card), `border`, `borderStrong`, `text`, `textMuted`, `shadow`, `scrim`.
- **Per brand family** (`primary`, `teal`, `blue`, `coral`, `orange`, `yellow`):
  - `<family>` is the 100 value, the same in both modes.
  - `<family>Tint` and `<family>TintStrong`: light uses today's 10 and 20; dark uses the 100 composited at about 16% and 24% over `surface`, stored **opaque** so contrast maths is exact and Android elevation never stacks alpha.
  - `<family>Text`: light uses today's `*Text`; dark is lightened until it reaches at least 4.5:1 on dark `<family>TintStrong`.
- **No on-accent text role yet** (as built, 2026-10-27). White measures 1.31–3.35:1 on seven of the eight solid accents, so one white role can't serve them. The owner picks the on-accent text colour with Plan 3.
- **Status:** `success`, `successText`, `danger`, `dangerText`. Today's `red` `#CE3C3E` measures 3.51:1 on graphite `surface`, which fails, so dark `dangerText` must be lighter (`#FF6B6E` measures 6.14:1).

Starting values from the approved mockup. Graphite measures:

| Text | on canvas `#121214` | on surface `#1C1C1F` | on sunken `#2A2A30` |
|---|---|---|---|
| `text` `#F2F2F5` | 16.75 | 15.22 | 12.77 |
| `textMuted` `#A1A1AA` | 7.30 | 6.63 | 5.57 |
| `primaryText` (dark) `#B4B2FF` | 9.58 | 8.70 | 7.30 |

Mocked tinted chips (16% tint over `surface`): teal text `#5FE3CF` 7.92, coral `#FF9196` 6.49, yellow `#FFE08A` 8.65, primary `#B4B2FF` 6.92. The builder computes the remaining dark values with the same method and writes every ratio beside its value, as `colors.ts` does today.

**Screen-named tokens.**
- `SharedHomeTokens` and `NavigationShellTokens` become per-scheme: `sharedHomeTokens(scheme)` / `navigationShellTokens(scheme)`.
- Each token resolves to a **role** in both modes; a dark side never carries a new hex.
- A token whose light value is deliberately distinct and has no role (an accent such as `welcomeNurseryText`, the ambient glows) keeps its light literal and names a dark role. The PR lists each such exception.
- The existing `SharedHomeTokens` and `NavigationShellTokens` exports stay, equal to the light result. Their names don't change; values change only where consolidated, and each change is listed in the CHANGELOG.
- `SystemChrome` and `LaunchScreen.background` become per-scheme the same way.

**Gates.**
- A new `test/contrast.test.js` covers both schemes (the package has none today; teacher's `__tests__/contrast.test.ts` is the model): every `*Text` role reaches at least 4.5:1 on its tint and on `surface`; `text` and `textMuted` reach it on `canvas`, `surface` and `surfaceSunken`.
- The light side of the contrast test is new. Today's `Colors.gray` text and `subtitleColor` on the chip fail it, and the consolidation is what makes it pass.
- A key-parity test checks that the light and dark tables have the same keys and that every dark side resolves to a role.

**Release:** 0.8.0, minor. Export names are additive; light values change only where consolidated.

**Owner review before publishing.** The full role table goes to the owner as a light/dark swatch sheet with the ratios, plus a before/after for every consolidated light value. The graphite base was approved; the per-family dark tints and texts were not seen individually.

## rn-ui

- **Provider.** `RnUiProvider` takes a `colorScheme: 'light' | 'dark'` prop, which the host resolves. It mirrors the scheme into a module variable exactly as it mirrors `language`, for code outside React (`confirm()`, the navigation-shell getters).
- **Hooks.**
  - `useAppTheme()` returns `{ scheme, roles, home, nav }` for the current scheme.
  - `createThemedStyles(factory)` returns a `useStyles()` hook. The hook calls `StyleSheet.create(factory(theme))` at most once per scheme per file (cached at module level), so a render allocates nothing and a theme flip costs one re-render.
- **Theme files.**
  - `src/theme/home.ts` becomes `homeRebrandTokens(scheme)`, keeping its two `Platform.OS` picks. `HomeRebrandTokens` stays as the light value for anything not yet migrated.
  - `commonStyles.ts` colours move the same way.
  - The `navigationShell.ts` getters read the mirrored scheme.
- **Status bar.** `AppStatusBar` defaults `barStyle` from the scheme when the caller passes none. The hard-coded `dark-content` at `LoadingComponent.tsx:34` and `ScreenHeader.tsx:64` goes. The iOS comment is corrected: iOS follows `UIUserInterfaceStyle`, which the apps stop pinning.
- **Migration.** All 32 styled files move to `createThemedStyles`. `Colors.*` used for a surface or text becomes a role. The `CommonStyles` text presets, which bake in `Colors.black` and are used across 38 Staff files, move to `text`. Brand accents (dots, fills, borders) may keep the family value, which is the same in both modes.
- **Server images.**
  - `LogoTile` keeps a light backing in dark.
  - `ImageGallery`'s full-screen viewer is unchanged (it is already dark chrome).
  - Gallery cover cards get the 12% `scrim` in dark.
- **Tests.**
  - The light goldens (`parentThemeGolden.json` and the rendered `parentSheetsGolden` and `parentLocalizedGolden`) are re-recorded once, in the consolidation commit, with the value diff in its message. After that they stay fixed through the migration.
  - A dark golden is added.
  - Component tests render under both schemes. Run with `npx jest -w 2`.
- **Release:** 0.4.0, minor. Hosts that never pass `colorScheme` get light, so the change is additive.

## Parent app (mobile) and Staff app (teacher)

Both apps get the same change, with the same names, landing in the same piece of work.

- **Preference.**
  - The `app` slice gains `colorScheme: 'system' | 'light' | 'dark'`, default `'system'`. It is persisted and already survives sign-out (`app` is in `KEPT_ON_LOGOUT`).
  - The root resolves `pref === 'system' ? useColorScheme() : pref` and passes the result to `RnUiProvider`.
  - It also calls `Appearance.setColorScheme(...)` with the override, or with "follow the system" for `system`, so native UI follows: alerts, date pickers, the keyboard, the iOS status bar. The builder confirms the exact "unset" value RN 0.87 takes.
- **Settings.** An "Appearance" row next to the language choice, offering System / Light / Dark through rn-ui's `pickOption`. Strings go through i18n in `en` and `ar`.
- **Navigation.** `NavigationContainer` gets `dark` and `colors` from the resolved theme.
- **Migration.** 75 styled files per app move to `createThemedStyles` and roles. The Staff app's `src/design-system/theme/home.ts` gets the same per-scheme treatment as rn-ui's.
- **Native.**
  - Remove `UIUserInterfaceStyle` from both `Info.plist`s.
  - Android `styles.xml` (and `values-v31/styles.xml`) parent becomes `Theme.AppCompat.DayNight.NoActionBar`.
  - Add `res/values-night/colors.xml` for the splash and system-bar colours.
  - Give `SplashBackground.colorset` a dark appearance. The splash mark is the unchanged logo.
  - The 28 hard-coded `barStyle`s go: rn-ui's default handles them, and the light-content exceptions stay explicit where a screen has a dark header.
- **Staff activity icons and colours.** Their pastel circles keep their light colours in dark, so the black line art stays readable. The circle tint (the server's `background_color` at 16%) is composited over white, not over the dark card. The student-card status pill (`src/screens/Student/helpers/activityPill.ts:24`) keeps the server fill, and `__tests__/activityPillContrast.test.ts` keeps passing.
- **Gate.** `check:consistency` gains a rule, `staticThemeStyles`: a module-level `StyleSheet.create` that reads a colour token fails the build, with no baseline. Without it, the next new screen bakes in light colours again.
- **Release:**
  - These are store builds, not OTA, because the native files change.
  - From the moment this merges, OTAs for binaries built before it (3.1.x / 6.1.x) are cut from a branch that does not contain it. There is no runtime check.
  - Both apps ship together, after the current submission is approved.
  - Merge goes into the then-current preview branch; preview → main is the owner's step.

## Dashboard

- **Tokens.**
  - `src/theme/tokens.js` keeps every export name. The colour values become `var(--uprise-<name>)` strings.
  - A `GlobalStyles` inside the theme provider writes both schemes' values from design-tokens: `:root` for light, `[data-color-scheme="dark"]` for dark.
  - `src/global.css:8` then reads the variable instead of mirroring the hex.
  - The 78 importing files are unchanged.
- **Values JS computes on.** These need real colours, not `var()`, so they read the resolved table for the current mode:
  - the 4 `alpha(RebrandTokens|RebrandPalette|REBRAND_…)` calls;
  - ApexCharts options (5 files);
  - the gradient constants built from token values, which keep working since `var()` composes inside CSS strings.

  MUI throws on `alpha('var(…)')`, so any site that was missed fails loudly in development.
- **Palette.** `palette.js` builds both branches from the role table, replacing the template's `dark` branch. `customShadows` and `shadows` already take the mode.
- **Preference.**
  - `app.jsx:33` `themeMode: 'light'` becomes a stored System / Light / Dark preference, persisted by the existing settings provider.
  - `system` resolves through `matchMedia('(prefers-color-scheme: dark)')` with a change listener.
- **No flash.** An inline script in `index.html` reads the stored preference and sets `data-color-scheme` on `<html>` before the bundle loads. `<meta name="color-scheme" content="light dark">` is added, and `theme-color` (`index.html:5`, `#000000` today) gets one tag per scheme.
- **Switch.** In the account/header menu, beside `LanguagePopover` (`src/layouts/common/language-popover.jsx`). Strings go in `en.json`/`ar.json`.
- **Literals.**
  - The 133 hex + 52 `rgba()` literals move to tokens or `palette`.
  - Template illustrations that no route renders are deleted rather than themed.
  - The `check:tokens` allow-list (`global.css`, the activity-form colour picker, the grey ramp) keeps its three entries, each still justified.
- **Charts.** `components/chart/chart.js` already reads the mode. ApexCharts gets `theme.mode` and tooltip theme from it.

## Backwards compatibility

- No backend or API change. The store apps (parent 2.1.2, Staff stack) see nothing.
- design-tokens 0.8.0 keeps every existing export name. Light values change only where consolidated, each listed in the CHANGELOG. `Colors` (the brand primitives) stays unchanged.
- rn-ui 0.4.0 defaults to light when the host passes no scheme, so the apps can bump the package before migrating.

## Verification

- **design-tokens:** `npm test` passes (contrast in both schemes, key parity, existing suites). `tsc` passes for cjs and esm.
- **rn-ui:**
  - `npm run typecheck`, `npm run lint` and `npx jest -w 2` pass.
  - The light goldens match the consolidated values and the dark golden matches.
  - `check:host-imports`, `check:peers` and `check:strings` pass.
- **mobile and teacher:**
  - `npm run check:tokens`, `npm run check:consistency` (new rule at 0) and `npx jest -w 2` pass.
- **Simulators:**
  - Parent: phone portrait. Staff: phone portrait, plus tablet landscape at 1366×1024 and 1194×834 with the 320pt drawer.
  - Each case in Light, Dark and System, in EN and AR.
  - Flip the device setting while the app is open (`xcrun simctl ui booted appearance dark`; `adb shell cmd uimode night yes`) and confirm it changes live.
  - Confirm the override wins over the device.
  - Sign out, and confirm the choice is kept.
  - Confirm the splash follows the device.
  - Compare light mode before and after for each screen area against today's build. The only differences are the consolidated text colours.
- **Dashboard:**
  - `npm run lint` (which chains `check:tokens`) and `npm run build` pass.
  - Browser pass for every dashboard role (Super_Admin, Admin, Owner, Branch_Admin), × EN/AR, × light/dark/system.
  - A hard reload in dark shows no light flash.
  - Charts, data grids and date pickers are readable.
- Report exactly what ran, with counts; nothing claimed that wasn't run.

## Delivery

| # | Repo | Branch | Needs | Ships as |
|---|---|---|---|---|
| 1 | `design-tokens` | `feat/dark-mode-roles` | owner sign-off on the swatch sheet | 0.8.0 |
| 2 | `dashboard` | `feat/dark-mode` | 1 | Vercel deploy, any time after merge |
| 3 | `rn-ui` | `feat/dark-mode` | 1 | 0.4.0 |
| 4 | `mobile` + `teacher` | `feat/dark-mode` | 3 | Store builds after the current submission is approved |

2 and 3 are independent and can run in parallel. 4 lands in both apps in the same piece of work. Within 3 and 4, the migration goes one screen area per commit, so review is diffable and a bad commit reverts alone. Each commit carries light before/after screenshots of its area, and its only light change is the consolidation (black text to ink, light greys to the AA grey).

## Deliberate simplifications

- **Preference per device, not per account.** Ceiling: a user with two devices sets it twice. Upgrade path: a user preference field on the API, once the store apps that understand it are approved.
- **Splash follows the device only.** Ceiling: someone who forces dark on a light phone sees a light splash for under a second.
- **Two cached StyleSheets per file**, one per scheme. Ceiling: none in practice.
- **Server images untouched** (light tile or circle behind them). Ceiling: on dark they read as small light badges. Upgrade path: a monochrome activity-icon set tinted by the theme.
- **Dashboard tokens as CSS variables.** Ceiling: JS cannot compute on a token value, so those few sites read the resolved table.
- **No runtime native-capability check.** Ceiling: an OTA cut from the wrong branch would put dark JS over light native pickers, alerts and splash on an older binary. Upgrade path: show the Appearance row and honour dark only from the first native build that has dark mode.

## Out of scope

- Landing site, `public-web`, nursery websites
- Emails
- Generated PDFs and progress reports
- Store screenshots and creative assets
- WebView content (Learnings, Nursery Policy)
- Dark or tinted app icons (iOS 18, Android themed icons)
- Per-nursery theming
- White text on `primary100` buttons (3.21:1, the same in light today; a separate AA fix)
