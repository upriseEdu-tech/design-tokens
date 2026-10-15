# Smoothness baseline, before the consistency sweep

**Date:** 2026-10-15. **Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md` §8. **Plan:** Plan 1 Task 7.

This is the static half of the baseline: code read on the default branches, plus the backend's own timing log. The runtime half (Flashlight fps and React Profiler on release builds) is taken at the start of Plan 3, when fresh builds exist (roadmap note).

| App | Ref read |
|---|---|
| Staff app (`teacher`) | `origin/main` @ `4123a12` |
| Parent app (`mobile`) | `origin/main` @ `1b496d5` |
| Dashboard | `origin/master` @ `efca40d` |
| Backend timings | `request_logs` on the local snapshot `uprise_prod_1011`, 14 days ending 2026-10-11 14:41 (10,032 requests) |

**How to read the counts.** Each one comes from a `git grep` on the ref above, so it can be rerun after the sweep and compared. `git grep -E` has no `\b` or `\s`, so the list, image and selector counts use `git grep -P`, and `useRef<FlatList>` type references and each wrapper's own list are excluded by hand. Multi-line `.map(… => (` renders were counted with a small parse of `git grep -A2` output, because a line-based pattern finds none of them.

The **Plan** column names the plan that fixes the row:
- 2: backend performance
- 3: RN foundations
- 5: staff screen sweeps
- 6: parent sweep
- 7: dashboard

## 1. Staff app (`teacher`)

| What | Where | Count | Plan |
|---|---|---|---|
| The staff app's `FlatListWrapper` renders a plain `FlatList`, not FlashList (the house rule, and what the parent app's wrapper does) | `common/components/FlatListWrapper.tsx:57` | 1 | 3 |
| Lists on raw `FlatList`, bypassing the wrapper | `AccidentReportListScreen.tsx:135`, `ImageViewer.tsx:134`, `UploadConfirmModal.tsx:106`, `MedicalAssessmentListScreen.tsx:131`, `StudentPickerScreen.tsx:186`, `AnnouncementsList.tsx:239`, `chat/Chat.tsx:368`, `chat/ChatList.tsx:420`, `AttendanceConfirmModal.tsx:93`, `AttendanceHistoryScreen.tsx:449` | 10 raw vs 3 wrapper | 5 |
| Lists built as `ScrollView` + `.map` | `AccidentReportFormScreen.tsx:304`, `DailySchedule/ActivityScreen.tsx:133,135`, `MedicalAssessmentFormScreen.tsx:268`, `ProgressReport/AssignmentsScreen.tsx:126`, `Student/components/StudentPickerGrid.tsx:190`, `Vacation/Vacation.tsx:152` | 7 sites in 6 files (21 map-renders in 15 files overall) | 5 |
| Horizontal `ScrollView`s in the same file as a horizontal `FlatList` pager. Confirm they are siblings, not nested. | `Album/components/ImageViewer.tsx:134` (pager), `:200`, `:274` | 1 file | 5 |
| Raw `<Image>` with no cache or resize; FastImage isn't installed | top: `Album.tsx` 6, `CameraScreen.tsx` 5, `StudentActivityRow.tsx` 4, `ImageGrid.tsx` 4 | 47 `<Image>`, 0 FastImage | 3 (cached image), 5 |
| Animation off the native driver | `FloatingUploadIndicator.tsx:45`. It animates an SVG `strokeDashoffset`, which the native driver can't drive, so this one stays. | 1 (keep) | — |
| Whole-slice selectors (re-render on any change to the slice) | `HomeTeacherAttendance.tsx`, `main/Main.tsx`, `MainNavigation.tsx`, `RTLInitializer.tsx` | 4 of 139 `useAppSelector` | 3 |
| Selectors returning a fresh object | — | 0 | — |
| `useFocusEffect` (refetch on every focus; check each for blanking) | across screens | 22 | 5 |
| `console.*` in shipped code | across `src` | 45 | 5 |
| Modals and forms with no keyboard handling (`KeyboardAvoidingView` / `keyboardShouldPersistTaps`) | `UploadConfirmModal`, `AttendanceConfirmModal`, `AnnouncementModal`, `EditAnnouncementModal`, `MaterialModal`, `TaggingModal`, `VacationModal`, `ModalPillHeader` | 8 files | 5 |
| `Alert.alert` (a second error and confirm channel, spec §5) | across `src` | 39 | 4, 5 |

`VacationModal` and the other modals now scroll in portrait (teacher#90), but only `ActionModal` avoids the keyboard.

## 2. Parent app (`mobile`)

| What | Where | Count | Plan |
|---|---|---|---|
| Raw `FlatList`, bypassing the FlashList-backed wrapper | `ParentAccidentReportList.tsx:95`, `AlbumImageGallery.tsx:410`, `AlbumVideoGallery.tsx:527`, `ParentAttendanceScreen.tsx:189`, `ParentMedicalAssessmentList.tsx:91` | 5 (plus 2 direct `FlashList`: `chat/Chat.tsx:298`, `Notifications.tsx:87`; 18 wrapper) | 6 |
| A vertical `ScrollView` wrapping a `FlatListWrapper` (the nested-VirtualizedList warning) | `learnings/Learnings.tsx:338` → `:372` | 1 | 6 |
| Lists built as `ScrollView` + `.map` | `ParentMedicalAssessmentView.tsx:60`, `OrientationBooking.tsx:169`, `Settings/ChangePassword.tsx:294,389`, `LearningSectionPager.tsx:163,213`, `main/components/EventsView.tsx:189` | 7 sites in 5 files (31 map-renders in 14 files overall) | 6 |
| Raw `<Image>` alongside the cached components | top: `AlbumImageGallery.tsx` 4, `AlbumVideoGallery.tsx` 3 | 31 `<Image>`, 14 FastImage | 6 |
| Whole-slice selectors | `AddContactComponent.tsx`, `main/Main.tsx`, `ChangePassword.tsx`, `useGlobalChat.ts`, `RTLInitializer.tsx` | 5 of 112 | 3 |
| Forms with no keyboard handling | `ForceUpdateModal.tsx`, `OrientationBooking/components/FormInput.tsx`, `pickup/components/PickupForm.tsx` | 3 files | 6 |
| `console.*` in shipped code | across `src` | 8 | 6 |
| `Alert.alert` | across `src` | 6 | 6 |
| `useFocusEffect` | across `src` | 2 | — |
| Animation off the native driver | — | 0 | — |

## 3. Dashboard

| What | Where | Count | Plan |
|---|---|---|---|
| Icons fetched from `api.iconify.design` at runtime (pop-in, external dependency) | no `addCollection`, no `@iconify-json/*` in `package.json` | 601 `<Iconify>`/`<Icon icon=>` usages | 7 |
| Tables with no `TablePagination`. Most are short fixed widgets (invoice lines, dashboard cards). These list views can grow: `app-versions-list-view`, `branch-qr-list-view`, `system-settings-list-view`, `login-analytics-table`, `super-admin/announcements/announcement-table`, `staff-roles/roles-view`, `late-checkout/report-view`, `student-attendance/date-range-summary-view` | `src/sections/**` | 27 of 46 table files | 7 |
| Scroll containers set by hand (`overflow: auto/scroll`). Check the dialog ones for nested scroll: `quotation-view-modal`, `tablet-receival-dialog`, `nursery-insights-modal`, `branch-insights-modal`, `announcement-edit-dialog`, `bulk-mark-modal` | `src/sections/**` | 17 | 7 |
| Fetching inside `useEffect` instead of SWR | 1 file; 147 `useEffect` in all | 1 | 7 |
| `console.*` in shipped code | across `src` | 119 | 7 |

## 4. Backend endpoints (Plan 2 input)

The query is Plan 1 Task 7 Step 3: 2xx/3xx only, at least 50 calls, p95 above 150 ms, ordered by p95 × calls. The budget is about 100 ms server-side (`uprise-codebase` rule 8).

| Method | Route | Calls | p50 ms | p95 ms | Max ms |
|---|---|---|---|---|---|
| GET | /schedule | 2045 | 49 | 309 | 1065 |
| GET | /notifications | 564 | 79 | 730 | 3326 |
| GET | /album | 704 | 80 | 478 | 1114 |
| GET | /student | 756 | 109 | 391 | 1008 |
| GET | /single-food | 306 | 154 | 569 | 979 |
| GET | /event | 254 | 185 | 626 | 984 |
| POST | /bulk-schedule | 166 | 212 | 728 | 1548 |
| GET | /nursery/:id | 249 | 97 | 460 | 968 |
| POST | /photo/confirm-upload | 62 | 751 | 1101 | 1389 |
| GET | /attendance/records | 258 | 112 | 250 | 459 |
| GET | /activity | 259 | 117 | 234 | 501 |
| GET | /pickup | 271 | 55 | 210 | 752 |
| GET | /accident-report | 141 | 106 | 280 | 532 |
| GET | /report | 113 | 102 | 229 | 442 |
| POST | /refresh-token | 143 | 74 | 163 | 377 |
| GET | /video | 87 | 60 | 164 | 246 |

**Over budget at p50:** `/single-food`, `/event`, `/bulk-schedule`, `/photo/confirm-upload`, `/student`, `/attendance/records`, `/activity`, `/accident-report` and `/report`.

**Worst tail:** `/notifications` has a p95 of 730 ms against a p50 of 79 ms, and a max of 3.3 s.

All of these go to Plan 2: profile each one with `EXPLAIN (ANALYZE, BUFFERS)` on the snapshot first.

## Targets (spec §8.2)

- **Scrolling:** the main lists hold about 60 fps (Flashlight average ≥ 55 on the Android emulator). No nested-list warnings appear in the logs.
- **Loading:** nothing jumps. Skeletons match the final layout, and a refetch never blanks a screen that already has data.
- **Every swept screen** passes three checks:
  - It scrolls to its last item with the keyboard closed and open, and nothing is hidden behind bars.
  - Double taps don't double-act.
  - It works in Arabic.
- **Backend:** the endpoints the main screens wait on stay within the ~100 ms budget, with indexes added through `CONCURRENTLY` migrations where needed.

**The counts the sweeps bring down:**

| Count | Staff | Parent | Dashboard |
|---|---|---|---|
| Raw `FlatList` | 10 → 0 | 5 → 0 | |
| `ScrollView` + `.map` lists | 7 → 0 | 7 → 0 | |
| Nested same-direction lists | — | 1 → 0 | |
| Uncached `<Image>` in lists and grids | → 0 | → 0 | |
| Modals and forms without keyboard handling | 8 → 0 | 3 → 0 | |
| `Alert.alert` | 39 → 0 | 6 → 0 | |
| `console.*` | 45 → 0 | 8 → 0 | 119 → 0 |
| Online icon fetches | | | → 0 |
| Endpoints above in the backend table | → within budget | | |
