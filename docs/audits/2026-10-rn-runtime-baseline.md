# RN runtime baseline, before the Plan 3 foundations (2026-10-15)

These are the "before" numbers for the cross-app consistency work. The spec is `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md`, §8.2 and §10. Plan 3 Task 0 measured them. Task 8 re-runs the render counts after Plan 3, and Plans 5 and 6 re-run Flashlight on the lists they sweep. **Both must use the same device, accounts and method as below**, or the numbers don't compare.

The static baseline (sizes, patterns) is `2026-10-smoothness-baseline.md`.

## Setup

**Device**

The device is an Android emulator, AVD `Perf_Pixel6_API30`:
- profile `pixel_6`, 1080×2400, density 420;
- image `android-30` `google_apis` arm64-v8a, with 4 KB pages;
- 3 GB of RAM;
- `-gpu host`, on an Apple Silicon Mac.

Why not "Pixel 6, API 34" as the plan says: the only API 3x+ image on this machine uses 16 KB pages, and Flashlight 0.18.0's on-device profiler (`BAMPerfProfiler`) segfaults there (exit 139).

**Builds**

| Field | Staff app | Parent app |
|---|---|---|
| Commit | `teacher` 4123a12 (`origin/main`) | `mobile` 1b496d5 (`origin/main`) |
| Package | `com.uprisetablet` | `com.uprise.parent` |

Release builds, arm64-v8a, R8 on as in production. A few local edits were made only so the builds would run against a local server; none of them changes rendering:
- `.env.prod` `Base_URL=http://localhost:3000/api`, through `adb reverse`;
- cleartext HTTP allowed;
- debug signing;
- Sentry upload off, and the Sentry environment set to `perf-baseline`;
- an invalid Stallion project id, so no live OTA bundle replaces the code being measured.

The parent build also carries the R8 keep rule from mobile#72. Without it, `main`'s release build crashes on Home at the first photo (`OkHttpGlideModule.<init>` was stripped).

**Backend**

`backend` 724fa96 (`master`, before backend#141's notification paging). It ran against `uprise_perf`, a local copy of the 2026-10-11 production snapshot with every push token cleared.

**Accounts** (in the copy only)

- **Staff:** a Teacher in a 20-student class with 146 notifications and a 5,535-photo branch. `uses_tablet` is set to false so the phone shows the merged shell (Home, Students, Gallery, More).
- **Parent:** two children, 20,444 notifications, and a 23,761-photo branch.

## Lists, under Flashlight (release builds)

**Method**

- Flashlight 0.18.0 runs `flashlight test --skipRestart --iterationCount 3` on the open screen.
- Before each iteration it scrolls to the top (12 fast swipes).
- The measured part is ten swipes, `adb shell input swipe 540 1600 540 400 300`.
- It records only while the swipes run.
- JS CPU is the `mqt_v_js` thread.

| App | Screen | Avg fps | Min fps | JS CPU | Note |
|---|---|---|---|---|---|
| Staff | Notifications | 45.3 | 23 | 11.7% | 146 rows |
| Staff | Attendance history | 57.5 | 51 | 2.1% | Current month only (snapshot ends 11 Oct), so a short list |
| Staff | Gallery (album grid) | 58.0 | 47 | 1.5% | Few albums for this class |
| Staff | Students | 55.1 | 29 | 1.3% | 20 students |
| Parent | Home | 57.4 | 50 | 2.6% | |
| Parent | Album gallery | 54.8 | 22 | 16.6% | Long album grid |
| Parent | Notifications | 56.9 | 52 | 18.2% | 20,444 rows from the pre-paging backend |

Against the spec's target of an average ≥ 55 fps on the main lists, two miss:
- **Staff Notifications** misses on average fps (45.3).
- **Parent album gallery** sits just under, at 54.8.

Three more lists drop hard at the minimum: Staff Students (29), Staff Notifications (23) and the parent album gallery (22).

## Render counts on Home (debug builds)

**Method**

- React's `<Profiler>` wraps the app root. This is a throwaway edit, never committed; the exact code is kept with the Plan 3 ledger (`perf-profiler-snippet.tsx`).
- Each commit is logged to logcat and counted for the app's own process only.
- Each figure is a cold open (force-stop, then launch), repeated three times. The median is shown, with all three runs in brackets.

| App | Measure | Commits | Slowest commit |
|---|---|---|---|
| Staff | Cold open to idle (no new commit for 8 s) | 6 (5, 7, 6) | 643 ms (612, 643, 648) |
| Staff | Tapping Home after idle | 1–2 | ≤ 21 ms |
| Parent | Commits in the first 15 s after a cold open | 54 (47, 56, 54) | 1010 ms (1332, 960, 1010) |
| Parent | After the first 15 s | ~125 per 105 s | 4–6 ms each |

**Staff**

- The staff app lands on Check-in.
- The phone shell mounts every tab at boot, including Home, so the cold open already includes Home's work. That's why tapping Home afterwards costs only 1–2 commits.
- Idle comes about 17–18 s after launch.

**Parent: Home never goes idle**

- `GalleryCTA`'s Photo Gallery slideshow advances on a 2.4 s `setInterval`.
- Together with the crossfade, Home keeps committing about every 0.8 s for as long as it's open.
- So the parent figure is "first 15 s plus the steady rate" rather than "to idle".

## Findings along the way

- **Parent release crash:** `main`'s Android release build crashes on Home. R8 full mode strips the no-arg constructor of Glide's `OkHttpGlideModule`, which `@d11/react-native-fast-image` loads by reflection. Fixed in mobile#72. iOS is unaffected.
- **Staff camera:** with camera permission denied, the camera screen is plain black, and Check-in asks for the permission again on every cold open.
