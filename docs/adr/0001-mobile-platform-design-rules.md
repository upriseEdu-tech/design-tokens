# ADR 0001 — Mobile platform design rules

- **Status:** Accepted (§2 amended)
- **Date:** 2026-09-17 (decided 2026-09-21)
- **Issue:** upriseEdu-tech/design-tokens#1
- **Deciders:** Fady Shawky
- **Context PRs:** upriseEdu-tech/mobile#22–#24, upriseEdu-tech/teacher#19–#21

## Context

`mobile` and `teacher` just took the platform upgrade and bug fixes from `@fadyshawky/react-native-magic`
(React Native 0.87.1, the iOS 27 scene life cycle, RTL fixes, launch screens, spacing tokens). The template made
seven design calls that Uprise's system doesn't make yet. Each section below gives:

- what the apps do today
- a recommendation
- the alternatives
- what changes in which repo if it's accepted

Nothing here changes `src/` until it's accepted. Accepted token values then land here as data. That means no
`react-native` import, no runtime dependency, and a version bump.

## 1. Layout rhythm (spacing between components)

**Today:**
- Neither app has a shared screen container, so every screen picks its own numbers.
- The only named between-component values are in `SharedHomeTokens`: `pageHorizontalPadding 18`,
  `pageTopPadding 14`, `sectionGap 14`, `priorityClusterGap 10`, `sectionHeaderGap 8`.
- Measured on `main`, per role:
  - **Mobile:** gutter 18 (~28 screens) vs 20 (~12) and 16 (6); section 14 (~16) vs 20 (~10); stack 12; list 14 on
    redesigned screens and 12 on older ones; lines inside a block 6; heading → body 10 or 8; label ↔ input 6; card
    padding 12 / 14 / 20; no explicit row minimum height.
  - **Teacher:** mostly reuses the phone numbers (gutter 18, section 14, list 14) instead of the ×1.96 scale. It uses
    ×1.96-like values only on login (gutter 40) and screen bottoms (40).
- Mobile's `FlatListWrapper` adds its own 20 gutter under the screen's 18, so several lists sit at 38. The gallery
  sits at 60.

**Recommendation:**
- Name the rhythm with Uprise's measured values.
- Keep **gaps on the parent, no outer margins on components**. A component never pads or margins itself away from its
  siblings; the screen or stack that owns them sets `gap`, and pads once, on the view that holds the children.

| Token | Mobile | Where it comes from | Use |
|---|---|---|---|
| `gutter` | 18 | `pageHorizontalPadding` (dominant) | screen side padding |
| `gutterAuth` | 20 | login/orientation; teacher's 40 ÷ 1.96 | sign-in, orientation booking, pre-login pickers |
| `screenBottom` | 20 | dominant; added after tab-bar/safe-area reserve | below the last block |
| `section` | 14 | `sectionGap` (dominant) | between a screen's top-level blocks |
| `sectionLoose` | 24 | home feed (effectively 28 today, 16–20 elsewhere) | feed screens |
| `stack` | 12 | dominant | form fields, form → button |
| `list` | 12 | older screens; redesigned ones use 14 | stacked cards |
| `related` | 6 | dominant | lines inside one block |
| `titleToBody` | 8 | `sectionHeaderGap` | heading → description |
| `field` | 6 | `PrimaryTextInput` | label / error ↔ input |
| `cardPadding` | sm 12 · md 16 · lg 20 | 14 is today's md; 16 is on the scale | card padding |
| `rowMinHeight` | 52 | inputs and tab items already 52 | tappable list rows |

**Where it lives:**
- Put the **mobile base values here** (`LayoutRhythm`, data only).
- Each app applies its own scale in its `commonSizes`: mobile ×1, teacher ×1.96. `commonSizes` itself stays
  per-app, as this package's README already says.

**Open question:** teacher's screens don't follow ×1.96 for spacing today. Applying the scaled tokens roughly doubles
teacher's gutters and gaps. The apps define the tokens now, but teacher only adopts them where today's value already
matches (login gutter, screen bottom), until a tablet layout pass decides whether ×1.96 or ×1 is right for spacing.

**Alternatives:**
- Adopt the dashboard's 8px grid values (16 / 24 / 32). That's cleaner arithmetic, but moves most mobile screens by
  2–6pt.
- Keep per-screen numbers. That's what produced the 38/60 gutters.

**If accepted:** add `LayoutRhythm` to `src/`, bump the minor version, and have the apps read their base from it.

## 2. Arabic and RTL typography

**Today:**
- Every app sets Kumbh Sans, which has **no Arabic glyphs**.
- On iOS and Android the OS falls back to its own Arabic face (SF Arabic, Noto Sans Arabic). Weights then drift, and
  the dashboard gets whatever the browser picks.
- Text roles keep Latin letter-spacing under RTL, which breaks Arabic's joined letters apart.
- Eyebrows force uppercase.

**Recommendation (amended 2026-09-21 — Cairo, not IBM Plex Sans Arabic):**
1. **Arabic family: Cairo** (SIL OFL).
   - Chosen because Arabic is the dominant reading language for these users, so the Arabic face is the product's
     primary voice rather than a companion to the Latin one. Cairo is what Egyptian products overwhelmingly use, so
     it reads as native rather than as a well-matched import.
   - It carries SemiBold (600), so our SemiBold roles survive — the reason Tajawal was rejected.
   - `@fontsource/cairo` exists for the dashboard.
   - **Cairo also ships Latin glyphs, and they are not ours.** Kumbh Sans must stay the Latin face: order the web
     stack `'Kumbh Sans', 'Cairo', sans-serif`, and in RN select the family per string's script rather than setting
     Cairo globally under RTL. Getting this wrong silently restyles every Latin word on an Arabic screen.
   - Until it ships, the RN apps rely on the platform Arabic face. The RTL fix PRs only map weights explicitly if
     the fallback loses them. Nothing is bundled yet.

   *Not chosen: IBM Plex Sans Arabic, the original recommendation. It pairs more quietly with Kumbh Sans, which is
   the right criterion when screens mix scripts and the wrong one when most screens are read in Arabic.*
2. **Under RTL:**
   - Tracking is 0 for every role.
   - No `textTransform: 'uppercase'`. Arabic has no case, and eyebrows that rely on caps for hierarchy use weight or
     colour instead.
   - Natural text is right-aligned. In RN that means `writingDirection: 'rtl'` on text roles and a physical
     `textAlign: 'right'` on inputs.
3. **Latin-only faces** (any mono or number face) are for numerals only, never for worded copy.
4. **Mirroring:**
   - These mirror: arrows and chevrons that point along the reading direction (back, forward, disclosure), progress
     that runs start → end, and sliders and switch knobs (their travel).
   - These never mirror: brand marks and logos, media controls (play, pause, skip), checkmarks, clocks, charts' time
     axes, numbers, phone numbers, or any icon depicting a real-world object (camera, bell, calendar).

**Alternatives:**
- **Cairo:** geometric, very common in Egyptian products, and has a Latin set. Its wider letterforms don't pair as
  quietly with Kumbh Sans.
- **Tajawal:** light and geometric, but it has no SemiBold, so our SemiBold roles would jump to Bold.
- **Noto Sans Arabic:** safe, but anonymous, and it's what Android already falls back to.
- **Keep the system fallback:** zero bytes, but the brand reads differently on iOS, Android and web.

**If accepted:**
- Here: add `typography.arabicFamily` (Cairo) and the RTL rules (tracking 0, no uppercase) as data.
- Apps: bundle the font, map roles under RTL, keep Kumbh Sans for Latin.
- Dashboard: add `@fontsource/cairo` and set it on `dir="rtl"`, after Kumbh Sans in the stack.

## 3. Launch screen

**Today:**
- `UILaunchStoryboardName` is empty in both iOS apps, so there's no launch screen. On iPad that also makes iPadOS run
  `teacher` in a window instead of full screen.
- Android shows a blank window.
- The JS splash (`teacher`) is a full-bleed illustration with the logo off-centre.

**Recommendation:**
- **Mark:** the live Uprise sun logo (the single mark used on login, the drawer, loading states and the dashboard
  favicon). See §4 for which master to keep.
- **Size:** 96pt on phones and 188pt (96 × 1.96) on tablets, measured on the mark's bounding box.
- **Position:** dead centre of the screen, ignoring safe areas, so it doesn't shift between devices.
- **Background:** the screen canvas token (`rebrandScreenCanvas`) in light *and* dark appearance. The product is
  light-only, so a dark launch screen would flash dark and then snap to a light app.
- **Handoff:** the in-app splash draws the same mark at the same size in the same spot. Anything else (progress, OTA
  download status, a tagline) hangs *below* the mark and never moves it. iOS keeps the storyboard up as the root view's
  loading view while JS loads, so there is no blank frame.
- **Android 12+:** `windowSplashScreenBackground` = canvas and `windowSplashScreenAnimatedIcon` = the mark, inside
  the 192dp circle on the 288dp canvas. Before 12, a layer-list window background (canvas + centred mark).

**Alternatives:** keep the illustrated splash as the JS screen and only fix the native side. The handoff then jumps
from a centred mark to the illustration.

**If accepted:**
- Here: `launch.markSize` (phone 96, tablet via scale) and `launch.background` → `rebrandScreenCanvas`.
- Apps: the storyboard, Android resources, and aligning the JS splash.

## 4. App icon

**Today:**
- Both apps ship the "UPRISE" sun wordmark as a flattened 1024px PNG with an alpha channel. App Store validation
  flags alpha on the marketing icon.
- Android ships legacy PNG mipmaps only: no adaptive icon, no monochrome layer.
- There are two marks in circulation:
  - the live sun logo (`dashboard/public/logo/logo_single.svg`)
  - an unused "learning circuit" exploration (`mobile/resources/branding/logos/uprise_learning_circuit_*`)

**Recommendation:**
1. **Master SVG — decided 2026-09-17 (Fady): the sun logo is the one brand mark.** The launch screens and
   regenerated icons use `dashboard/public/logo/logo_single.svg`; the "learning circuit" exploration is not used.
   Still open: moving the master SVG into this repo under `assets/brand/` (data, not code).
2. **iOS:** one 1024 × 1024 PNG, **opaque** (no alpha), art on the canvas colour, no pre-rounded corners (iOS masks
   it). Xcode derives every size from the single image.
3. **Android adaptive icon:**
   - The canvas is 108dp; about 72dp shows after the launcher mask.
   - Keep all meaningful art inside the **66dp** safe zone.
   - Background layer: canvas colour (vector).
   - Foreground layer: the mark (vector), with the gradients converted to user-space coordinates.
4. **Legacy PNGs** (`mipmap-*dpi`, API 24–25): square with 8% rounded corners for `ic_launcher`, a circle for
   `ic_launcher_round`, rendered from the same master.
5. **Monochrome (themed) icon:** yes. Add a single-colour silhouette of the mark as the adaptive icon's `monochrome`
   layer, so Android 13+ themed icons don't fall back to a tinted square.

**If accepted:** icon generation stays a documented one-off in each app (scripts not committed), sourced from
`assets/brand/` here.

## 5. Status bar and system chrome

**Today:**
- Both iOS apps use the legacy app-wide status bar API. Those calls are no-ops on iOS 27, so the status bar doesn't
  follow the screen.
- Android's theme is `DayNight`, so native dialogs and pickers go dark on a dark-mode device while the app stays light.

**Recommendation:**
- **The product is light-only.** System chrome is pinned to light regardless of the device setting:
  - iOS: `UIUserInterfaceStyle = Light`.
  - Android: a `Light` app theme.
  - Status bar content is dark on the canvas.
- A screen with a dark or coloured header sets its own status bar style at the navigator level (native-stack
  `statusBarStyle`), never through a global call.
- **If a dark theme is ever added,** a manual theme choice must override the system appearance for the status bar,
  keyboard and alerts (`Appearance.setColorScheme`), not only the React tree.

**If accepted:** a `chrome.statusBar: 'dark-content'` note here. The apps already do this in the upgrade PRs.

## 6. Icon set

**Today:**
- `IconPlatform` draws **SF Symbols on iOS** and **MaterialIcons on Android**: two different glyph families for one
  product.
- It carries two native dependencies: `react-native-sfsymbols` (unmaintained since 2024) and the icon font.
- The dashboard uses **Solar** through Iconify.
- Sizes in use are scattered: 12, 14, 16, 18, 20, 28.

**Recommendation:**
- Move both RN apps to **Solar (Linear style)**, drawn as SVG with `react-native-svg` (already installed). Glyph data
  is generated at build time from `@iconify-json/solar`, so there's no runtime dependency.
- That gives one set across mobile, teacher and the dashboard, and drops both native icon dependencies.
- **Stroke:** Solar's native 1.5 on a 24 grid.
- **Sizes (mobile):** 16 (inline with body text), 20 (buttons, rows), 24 (navigation, headers), 32 (empty states,
  feature tiles). Teacher applies ×1.96.
- **Colour:** icons inherit the text colour of their role. Only the single accent is allowed as an icon tint.
- **Mirroring:** follows §2, and happens inside the icon component, never at call sites.

**Alternatives:**
- **Lucide at 1.75 stroke:** what the template chose. Excellent RN ergonomics, but a third family next to Solar on the
  dashboard.
- **Keep platform icons:** native feel, but the apps keep two unaligned families and two native dependencies.

**If accepted:** a separate migration PR per app (replace `IconPlatform`'s renderers, keep its API). The upgrade PRs
only swap the deprecated `react-native-vector-icons` package for its per-family successor.

## 7. Mobile rules worth stating

| Rule | Recommendation | Today |
|---|---|---|
| Touch target | ≥ 48 × 48 on mobile (hit slop counts); teacher follows the ×1.96 scale and never goes below 48pt physical | mobile icon buttons 32–44 (six close buttons at 36); teacher 24–44; `hitSlop` used in 4 / 5 places |
| Accent | one accent per screen: primary violet for the main action and active state; teal and the category hues stay decorative | not measured |
| Surfaces | 1px border (`cardBorderColor`) on every card/sheet surface; shadows are optional and warm-indigo only | 1px borders and shadows both common (mobile ~170 border / ~135 shadow lines; teacher ~98 / ~113) |
| Copy | sentence case for titles, buttons and labels; eyebrows use weight/colour, not forced uppercase (also required for Arabic, §2) | 14 mobile files and 1 teacher file force uppercase |

## Decision

Decided 2026-09-21 by Fady Shawky.

| § | Decision |
|---|---|
| 1 Layout rhythm | **Accepted** as proposed. Teacher adopts the scaled values only where today's value already matches, until a tablet layout pass settles whether spacing scales ×1.96 or stays ×1. |
| 2 Arabic / RTL typography | **Accepted, amended:** the family is **Cairo**, not IBM Plex Sans Arabic. The RTL rules (tracking 0, no forced uppercase, the mirroring list) are accepted unchanged — they are correctness, not preference. |
| 3 Launch screen | **Accepted** as proposed. |
| 4 App icon | Master mark decided 2026-09-17 (the sun logo). Mechanics accepted: opaque 1024px iOS image, Android adaptive icon with a monochrome layer. Still open: moving the master SVG into `assets/brand/` here. |
| 5 Status bar / system chrome | **Accepted** as proposed. Light-only, pinned. |
| 6 Icon set | **Accepted:** Solar Linear as SVG across mobile, teacher and the dashboard. Migration starts now rather than waiting for the release wave. |
| 7 Mobile rules | **Accepted** as proposed. |

Sections 1, 3, 5 and 7 describe what the apps already do, so accepting them changes no pixels today; their value is
that the next screen stops inventing its own numbers.

## Consequences

- Accepted sections become tokens or notes here, with a minor version bump.
- The apps adopt them in follow-up PRs linked from issue #1.
- The icon-set and app-icon sections change what users see in the store and on every screen, so they ship behind
  explicit sign-off, separately from the platform upgrade. That sign-off is given (§6, 2026-09-21): the per-app
  migrations proceed now, one PR per app, keeping `IconPlatform`'s API so call sites do not change.
