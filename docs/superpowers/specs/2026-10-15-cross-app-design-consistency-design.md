# Cross-app design consistency: one icon system, one feedback system, staff app parity, smoothness

- **Status:** approved in conversation, 2026-10-15. Awaiting review of this written spec.
- **Owner:** Fady Shawky.
- **Apps:** `teacher` (UpriseEdu Staff), `mobile` (parent app), `dashboard`, plus `design-tokens` and `backend`.
- **Ships before:** the Staff 6.0.2 and Parent 3.0.0 store submissions. Versions stay at 6.0.2 and 3.0.0; the release tags move once this lands.

## 1. Goal

Uprise is starting marketing and taking on A++ clients. The three apps must read as one premium product. This is a consistency pass, not a redesign.

- The same situation looks and behaves the same on every screen and every platform. That covers errors, successes, confirmations, loading, empty and offline.
- Each product concept has exactly one icon, in one icon family and one style. That icon is the same on all three platforms, and no screen repeats it.
- The Staff app reaches the parent app's level of finish.
- Every app is smooth and easy to use: no glitches, no scroll problems, fast lists and screens.

**Success criteria**

1. Every user-visible message comes from the shared catalogue, in English and Arabic. Raw server text is never shown.
2. Every icon is resolved through the shared concept registry. No two concepts share a glyph, and no glyph has two meanings.
3. On a phone, Staff app screens use the parent app's type scale and its shared components: buttons, skeletons, lists, avatars, status pills and the tab bar.
4. Guard checks fail the build on any regression: stray icons, `Alert.alert`, raw error text, or missing translations.
5. The smoothness targets in §8.2 are met on every swept screen.

## 2. What the audits found (2026-10-15)

These are the read-only audits of the working trees. The counts are what justify the scope.

### Feedback

| | Staff | Parent | Dashboard |
|---|---|---|---|
| Failed request | Global toast on every failure (`react-native-snackbar`), then many screens report again (toast, `Alert`, or inline). Two toast systems with different colours. | Global toast, plus local double reports (`usePickup`, `ChangePassword`, `OrientationBooking`). | No global handling. 145 per-file toasts in 75 files; 39 silent `catch` blocks. 18 of 25 list views hide load errors. |
| Wording | Raw backend `message`, plus `t()`, plus English literals | Same | About 57% raw backend text, 31% `t()`, 12% English literals. Only 54% of success toasts exist in Arabic. |
| Validation | `Alert.alert` (19) | Inline field errors | Inline (RHF/Yup) |
| Success | Toast, `Alert`, or nothing | Mostly nothing | "Update success!" ×17, "Delete success!" ×17, "Create success!" ×15, plus about 20 other phrasings |
| Confirm | Native `Alert` (6), plus 2 custom modals | None (pickup delete, contact delete and logout run unasked) | `ConfirmDialog` ×39, `window.confirm` ×2, event delete unconfirmed |
| Loading | 26 `ActivityIndicator`, 0 skeletons | Skeletons (13 screens) | Mixed |
| Session ended | Silent | Silent | n/a |

### Icons

- ADR 0001 §6 already accepted **Solar Linear across mobile, teacher and the dashboard**. It isn't followed where users look first:
  - **Staff navigation** uses 24 raster PNGs. `reports.png` stands for Assignments, Accident Reports and Staff Attendance at once. The phone **More** tab has no icon.
  - **Dashboard:** 37 nav items share 25 glyphs (folder-with-files ×5, lock ×4). Icons come from 9 families and 3 Solar weights (bold-duotone 503, bold 235, linear 34).
- **The same concept gets a different glyph per platform.** For example, Pickup is a car in both apps but a walking person and a tag on the dashboard.
- **One screen repeats the same icon:** in the tab, the header, every row and the empty state (Albums ×4, Pickup ×3, parent Progress Reports ×3).
- **The RN `IconPlatform` props mislead.** They are named `iosName`/`androidName` like SF Symbols, but the component draws Solar resolved from `androidName` (`src/common/components/icons/solarIconMap.ts`, identical in both RN apps).

### Staff app vs parent app

- **Missing:** skeletons, FastImage caching and fallbacks, FlashList, haptics, press springs, a shared avatar and a shared status pill.
- **Divergent copies:** `PrimaryButton`, `HomeSectionHeader`, `TabBar`, `FlatListWrapper`, `TouchablePlatform` (its white iOS press highlight is invisible on white cards).
- **Phone sizing:** text presets are about 1.3× the parent app's (body 13.72 vs 12), while gutters stay phone-size. `Math.max(floor, width × k)` appears 505 times, and on a phone the floor always wins.
- **Rebrand gaps:** accident reports and medical assessments (6 screens) never got the rebrand.

## 3. Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Approach | Rules first, then sweep each app |
| D2 | Icon family | **Solar Linear on all three platforms**, the dashboard included |
| D3 | Confirmations | Phone apps: a branded bottom sheet (`ConfirmSheet`). Dashboard: `ConfirmDialog`. Same wording on both. |
| D4 | Error wording | Backend error codes plus a translated catalogue. Raw server text is never displayed. |
| D5 | Success | One toast per completed action. Instant on-screen toggles stay silent. |
| D6 | Timing | Lands before the store submissions. Versions are unchanged. |

## 4. The rulebook

### 4.1 `design-tokens` 0.7.0 (data only, as today)

**`iconConcepts`.** Maps every product concept to one Solar Linear glyph name, for example `pickup: 'car'`.

- **Concept set.** The candidate list comes from the audits: home, students, class, attendance (student), staff attendance, check-in, chat, announcements, notifications, pickup, late checkout, daily schedule, activities, events, food, learning, materials, assignments, progress reports, gallery, albums, vacation, accident reports, medical assessments, birthdays, guardians, settings, profile, more, branches, nurseries, invoices, quotations, document templates, request logs, deleted data, system settings, app versions, roles, analytics. The dashboard-only concepts are the dashboard's 37 nav items.
- **Separate action set.** back, close, add, edit, delete, search, filter, share, more, download, upload, send, camera, refresh, chevron.
- **Reserved status glyphs:**
  - approved/present/done → check-circle
  - pending → hourglass
  - rejected/absent → close-circle
  - late → clock
  - half day, vacation and sick leave → one each, with no overlap
- **Validation, in the package's checks:** glyphs are unique across concepts and statuses. The action set never overlaps concepts.
- **Rendering.** Each app maps a glyph name to its renderer: the RN apps use their Solar SVG set, the dashboard uses Iconify `solar:<glyph>-linear`. The final glyph per concept is chosen in Wave 0 on the registry review page (§4.2) and approved before any app changes.

**`feedback`.** The message catalogue, in English and Arabic.

- **Templates:**
  - `success.{saved,created,updated,deleted,sent,approved,rejected,uploaded}` with `{{item}}`
  - `error.actionFailed` ("Couldn't {{action}} {{item}}. Try again.")
  - `error.loadFailed`, `error.offline`, `error.server`, `error.sessionEnded`, `error.permission`
- **`errors.<CODE>`:** one message for each backend error code.
- **`items.<item>`:** the nouns used by the templates, so Arabic gender and agreement can be correct per item. Arabic phrasings may be whole sentences per item where the template doesn't fit.
- **Wiring.** Each app wires the catalogue into its own i18n: RN localization or the dashboard's `locales/*.json`. A parity check compares the keys.

**Feedback policy.** Section 5, recorded in the package README as the contract.

### 4.2 The "Uprise Dashboard" design-system artifact

- **Tokens.** Register the tokens it is missing (it has 0 today): colours, type, spacing, radii and shadows, with values taken from the repos.
- **New pages:**
  - **Icons:** the rendered registry, one card per concept, the action set and the status glyphs.
  - **Feedback:** toast, inline error, `ConfirmSheet`/`ConfirmDialog`, empty, loading, offline and session-ended states, each with its en/ar wording.
- **Staff-app templates** are updated to the all-staff app on phone and tablet.
- **Precedence.** The artifact documents what the code does. The code and this package remain the source of truth.

### 4.3 Backend error codes

- Every business error a user can trigger carries a `code`.
- Existing codes stay, for example `ON_VACATION`, `STAFF_ID_MISMATCH`, `MODULE_DISABLED` and `NURSERY_SUSPENDED`.
- Missing codes are added. Examples: the vacation balance (`"Not enough Vacations"` becomes `NOT_ENOUGH_VACATION_DAYS`), already checked in, outside working hours, and duplicate late checkout.
- `message` stays in responses for logs and is no longer displayed.
- A check script lists thrown 4xx errors that have no code.

## 5. Feedback system (all platforms)

| Situation | Pattern | Never |
|---|---|---|
| A screen's data fails to load (GET) | In-place error state with **Try again** | A toast, or a pop-up |
| A write fails (POST/PUT/DELETE) | **One** error toast. Text: `errors.<code>` if known, else `error.actionFailed` | A second report, or raw server text |
| Invalid input | Message under the field; focus moves to it | A pop-up |
| A write succeeds | One success toast (`success.*`) | A pop-up, or ad-hoc wording |
| Instant toggle (mark present, select photos) | Silent; the screen state is the feedback | A toast for every tap |
| Destructive action (delete, log out, discard) | Phone apps: `ConfirmSheet`. Dashboard: `ConfirmDialog`. Shared wording. | Native `Alert`, `window.confirm`, or none |
| Loading | First load: skeleton. Refresh: pull-to-refresh. Action: the button's own spinner. | Full-screen spinners, except at app start |
| Empty | One `EmptyState` (concept icon, title, line, optional action) | Ad-hoc text |
| Offline | Phone apps: the existing top banner. Dashboard: a new banner. Writes while offline: `error.offline` toast. | — |
| Session ended | `error.sessionEnded` toast, then login | A silent logout |

### 5.1 Phone apps (teacher and mobile)

- **One toast component:** the parent app's branded `showSnackbar`/`SnackbarProvider`. The Staff app drops `react-native-snackbar`.
- **The API layer (`core/api/serverHeaders.ts`) is the only reporter of failed writes.** It maps `code` to the catalogue. It never toasts for GET failures; those surface through the screen's error state.
  - A request can opt out (`skipErrorToast`) when the screen reports the failure itself through `notifyError(action, item, error)`.
  - There is never more than one report per failure.
- **`notifySuccess(action, item)` and `notifyError(...)`** are the only way screens show feedback.
- **Native `Alert.alert`** is removed for errors, successes, validation and confirmations. It is kept only for OS permission rationale.
- **`ConfirmSheet`:** title, one-line explanation, a destructive button and Cancel. Built on `@gorhom/bottom-sheet`, as the parent app's sheets already are. RTL-correct.
- **Forced logout** shows `error.sessionEnded`.

### 5.2 Dashboard

- **`notify`** wraps notistack:
  - `notify.success(action, item)`
  - `notify.error(err, action, item)`, which applies the code catalogue
  - `notify.info(key)`
- **API-layer policy:**
  - The axios interceptor reports session end and suspension once.
  - Callers use `notify` for writes.
  - Lists render their error state (`RebrandListView error` / `RebrandEmptyState`) for failed loads.
- **Fixes:**
  - Every silent `catch` reports.
  - Both `window.confirm`s become `ConfirmDialog`, and event delete gets one.
  - Every message goes through `t()` with Arabic.
  - Add an offline banner.

## 6. Icons (all platforms)

### 6.1 Rules

1. One concept, one glyph, on every platform.
2. One glyph, one meaning. Action and status glyphs are reserved.
3. Solar Linear only, at the `IconTokens` sizes 16/20/24/32. A selected tab may show the Bold variant of the same glyph. No PNGs, emoji or text characters as icons. Activity artwork is content, not iconography, and stays as it is.
4. No repeats on a screen:
   - A screen reached from a tab or drawer item doesn't repeat that item's icon in its header. The `HomeSectionHeader` icon shell stays only on Home's dashboard sections.
   - List rows don't repeat the screen's concept icon. A row icon must distinguish rows (type or status).
   - Dates, times and IDs get no decorative icon. Dashboard detail pages drop per-field-label icons.
   - Empty states may use the concept icon.

### 6.2 Changes

- **RN icon component.** It takes `concept`, `action` or `status` (`<Icon concept="pickup" />`), and the `iosName`/`androidName` props are removed. A codemod migrates call sites, and `solarIconMap.ts` becomes glyph data keyed by Solar name.
- **Staff navigation** (drawer, phone tab bar, More) moves from the 24 PNGs to the registry, each module unique. The phone More tab gets its icon.
- **Dashboard:**
  - `NAV_ICONS` is rebuilt from the registry, so the 37 nav items get 37 distinct glyphs.
  - Everything moves to Solar Linear. mdi, eva, mingcute, ic, fluent, gravity-ui and material-symbols are removed.
  - The dead maps `components/icons-rebrand/icon-map.js` and `utils/icons.js` are deleted.
- **Guards.** Each app has a check that fails on an icon not resolved through the registry.

## 7. Staff app parity

The parent app is the reference. Where it already does something well, the Staff app gets the same component, with the same API and look.

- **Phone sizing.** On phones, `CommonSizes` and the `CommonStyles` text presets use the parent app's scale. Tablets keep the current scale. After that, the most visible `Math.max(floor, …)` sites on the swept screens are fixed.
- **Components ported from `mobile`:**
  - `PrimaryButton`: pill shape, with its loading state
  - The skeleton set
  - `FlatListWrapper`: FlashList, skeleton, empty state and Try again
  - `CachedImage` and `ImageWithFallback` (FastImage)
  - `ProfileImage` (avatar)
  - One `StatusPill`/badge
  - `TabBar`: sliding pill, filled selected glyph, unread badge
  - Settings-style rows for More: icon tile, subtitle, chevron
  - Press feedback: the iOS system-fill highlight, a spring scale on cards, haptics on key moments (check-in success, approve, delete)
- **Screens:**
  - Accident reports and medical assessments (6 screens) move onto the rebrand tokens and shared components.
  - The drawer hero shows the person's name, photo and role.
  - The sweep covers Home, Students, Gallery, Chat, Check-in, Attendance history, Vacation, More, Pickup, Notifications and Learnings. On each, tokens replace hard-coded colours, radii and font sizes, and sections 5–6 are applied.
- **Centred modals** (vacation, tagging, action, material, report) stay as cards, restyled. Turning them into sheets is out of scope.
- **New native dependencies,** at the versions `mobile` ships:
  - `react-native-fast-image`
  - `@shopify/flash-list`
  - `react-native-haptic-feedback`
  - `react-native-skeleton-placeholder` and `react-native-linear-gradient`
  - `@gorhom/bottom-sheet`
- **Parent app.** It gets sections 5–6, plus `ConfirmSheet` for pickup delete, contact delete and logout. Its look is otherwise unchanged.

## 8. Smoothness, glitches, scrolling and performance (all apps)

### 8.1 Find the problems with evidence

**Code audit, per app,** for the usual causes:

- **Scrolling (RN):**
  - Scroll views nested in same-direction lists ("VirtualizedLists should never be nested").
  - Lists built as `ScrollView` + `.map`.
  - Content hidden behind the tab bar or home indicator.
  - The keyboard covering inputs (`keyboardShouldPersistTaps`, `KeyboardAvoidingView`).
  - Pull-to-refresh that jumps.
  - Horizontal-in-vertical conflicts.
  - Scroll direction or position wrong under RTL.
- **Speed (RN):**
  - `renderItem` and inline callbacks that re-render whole lists.
  - Missing `keyExtractor` or `getItemLayout`.
  - Selectors that return new objects or whole slices on every render.
  - Full-size photos in grids.
  - Animations on the JS thread (no native driver).
  - Leaking Firestore listeners or timers.
  - Refetch on every focus that blanks or flickers the screen.
  - `console.*` in release builds.
- **Glitches (RN):**
  - Layout jumps as content loads.
  - Double taps that navigate or submit twice.
  - Stale data after a write.
  - State lost on tab switch.
  - Safe-area overlaps.
  - Modals behind the keyboard.
- **Dashboard:**
  - Re-render storms and large unpaginated or unvirtualised tables.
  - SWR revalidation flicker and layout shift.
  - Nested scroll containers and dialogs that don't scroll.
  - Route and bundle size (Vite chunking).

**Measurements:**

- Release builds on an iPhone simulator, an iPad simulator and an Android emulator.
- Flashlight (Android performance CLI) on the main lists.
- React Profiler on the slowest screens.
- Lighthouse and web vitals on the main dashboard pages.
- **Backend:** the endpoints each main screen waits on, ranked by real `duration_ms` in `request_logs` on the 2026-10-11 snapshot, against the ~100 ms server-side budget.

Before/after numbers are recorded in each PR.

### 8.2 Targets for this release

- **Scrolling:** the main lists hold about 60 fps (Flashlight average ≥ 55 on the Android emulator). No nested-list warnings appear in the logs.
- **Loading:** nothing jumps. Skeletons match the final layout, and a refetch never blanks a screen that already has data.
- **Every swept screen:**
  - It scrolls to its last item with the keyboard closed and open, and nothing is hidden behind bars.
  - Double taps don't double-act.
  - It works in Arabic.
- **Backend:** endpoints the main screens wait on stay within budget, with indexes where needed (`CONCURRENTLY` migrations).

### 8.3 How the fixes land

- **Shared groundwork first** (waves 2–3):
  - FlashList-backed `FlatListWrapper`
  - Cached, thumbnail-sized images
  - Memoised selectors
  - A tap-once guard for navigation and submit
  - Skeletons sized to the final layout
- **Slow endpoints** are fixed in the backend wave.
- **Each screen PR in wave 4** carries that screen's glitch, scroll and speed fixes. It ticks the per-screen QA checklist: scroll, keyboard, Arabic, loading/empty/error/offline, double tap, back navigation, phone and tablet.

## 9. Delivery

Each wave is a set of reviewable PRs, approved before merge.

| Wave | Content | Repos |
|---|---|---|
| 0 | `design-tokens` 0.7.0: `iconConcepts`, the `feedback` catalogue and checks. Registry review page in the artifact, where the owner approves the glyphs. Smoothness audit and baseline measurements (§8.1). | design-tokens, artifact, all apps (read-only) |
| 1 | Error codes on user-facing business errors, plus a check for missing codes. Slow endpoints behind the main screens. | backend |
| 2 | Foundations: icon component and codemod, one toast, `ConfirmSheet`, `notify*` and the API-layer policy (RN); the `notify` helper and its API-layer policy (dashboard). Performance groundwork (§8.3). | teacher, mobile, dashboard |
| 3 | Staff parity components and phone sizing | teacher |
| 4 | Screen sweeps, each with its glitch, scroll and speed fixes and the per-screen QA checklist. Staff app: navigation and Home, then daily work, then staff and admin screens. Parent app: 1–2 PRs. Dashboard: 2–3 PRs by nav section. | all |
| 5 | Artifact: tokens, the Icons and Feedback pages, Staff templates | artifact |
| 6 | Release: device QA. Move the `v6.0.2` and `v3.0.0` tags and rebuild. Deploy the dashboard (merge as upriseEdu-tech) and the backend. | all |

## 10. Verification

- **Unit tests (Jest, RN):**
  - Registry uniqueness and catalogue key parity.
  - The API layer shows exactly one toast per failed write and none for a failed GET.
  - The `notify*` helpers.
  - `ConfirmSheet` behaviour.
- **Guard scripts (CI and local),** each failing the build:
  - An icon that bypasses the registry
  - `Alert.alert` outside the permission allowlist
  - Raw `err.message` / `response.data.message` rendered in the dashboard
  - Missing en/ar keys
- **Backend:** the missing-code check, plus a rolled-back run of affected services on the local snapshot.
- **On device:**
  - Fresh debug builds of both RN apps on an iPhone simulator, an iPad simulator and an Android emulator, against a local backend on the 2026-10-11 snapshot with local test accounts.
  - Before/after screenshots of the key screens in English and Arabic.
  - The dashboard is checked in the browser preview.
- **Smoothness:** before/after numbers in each PR: Flashlight fps on the swept lists, React Profiler render counts on the slowest screens, Lighthouse for dashboard pages, and `request_logs` durations for the endpoints changed. Logs show no nested-list warnings. The per-screen QA checklist (§8.3) is ticked in each screen PR.
- **Release builds:** the owner checks them in TestFlight and on a Headwind tablet before submission.

## 11. Out of scope

- Converting the centred modals into sheets
- A shared RN component library
- Dark mode
- New features
- Store listing assets

## 12. Risks

- **Size.** About 3–5 weeks of work across five repos, the smoothness sweep included, and the store submission waits for it. Waves are ordered so the most visible wins land first.
- **Native dependencies in the Staff app.** They need a full rebuild and `pod install`. Versions are pinned to `mobile`'s.
- **Publishing `design-tokens`.** It publishes to GitHub Packages. RN CI already fails `npm ci` on that package with a 403, so CI must be checked separately.
- **Parallel sessions.** All work happens in worktrees off the default branches. Other sessions' checkouts are never touched.
