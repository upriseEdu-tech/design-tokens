# Plan 1: Rulebook and error codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared rulebook that every later plan builds on:
- the icon concept registry and the en/ar feedback catalogue in `design-tokens` 0.7.0;
- a backend whose error responses actually carry `code`;
- a glyph review page the owner approves;
- a measured smoothness baseline.

**Architecture:**
- `design-tokens` gains two data modules (`icons.ts`, `feedback.ts`) plus two pure helpers. Node's built-in test runner checks the invariants: no shared glyphs, en/ar parity, matching placeholders.
- The backend error handler moves into `middlewares/error_handler.js` and returns `code` for 4xx. The few business errors without one get codes.
- A small script renders the registry into a review artifact.
- A read-only audit records the smoothness baseline.

**Tech Stack:**
- TypeScript 5.9 (design-tokens), with `node --test` (no new runtime dependencies; `@iconify-json/solar` as a devDependency for glyph validation).
- Node/Express backend, with `scripts/verify/*.js` checks (the backend has no test runner).
- An HTML artifact.

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md` (this repo). The roadmap is in `docs/superpowers/plans/2026-10-15-consistency-roadmap.md`.

## Global Constraints

- The `design-tokens` package stays **data only**, with no runtime dependencies. Its helpers must be pure functions that import nothing (spec §4.1, `src/index.ts` header).
- Icon family: **Solar Linear**. Registry values are Solar base names **without** a suffix; renderers append `-linear` (spec §6.1).
- One concept → one glyph, and one glyph → one meaning. The only allowed shared glyphs are the same-meaning pairs in `IconSameMeaning` (spec §6.1 rules 1–2).
- Every user-visible message exists in **en and ar**, with identical placeholders. Raw server text is never displayed (spec §5, D4).
- The backend error envelope is `{ status: "error", code, message }`. `code` is a contract and is never renamed. `code` is sent only for 4xx (fady-style invariant 6).
- `design-tokens` version is **0.7.0**. App versions stay frozen at Staff 6.0.2 and Parent 3.0.0.
- Commits are Conventional Commits authored by Fady Shawky, with no `Co-Authored-By` and no generated-with footer, in commits and PR bodies.
- Work only in worktrees off the default branch. Never touch another session's checkout.

## Review Focus

1. **An error code the catalogue doesn't know** (a new backend code shipped before the apps update). `feedbackForError` must fall back by HTTP status, then to the generic action message, and never return `undefined` to the UI. The test is in Task 2.
2. **A 500 that carries a `code`.** Postgres (`23505`) and Node (`ECONNREFUSED`) errors have string codes. The handler must not leak them, and must send `code` only when the status is below 500. The test is in Task 3.
3. **English templates that start with the item** ("{{Item}} saved"). They must capitalise only the first letter ("Vacation request saved", not "Vacation Request Saved"). Arabic has no case and must be left untouched. The test is in Task 2.
4. **A glyph name typed with its suffix** (`'home-smile-linear'`). The renderers would request `home-smile-linear-linear` and draw nothing. The registry test rejects suffixes. The test is in Task 1.
5. **An Arabic string accidentally left in English, or empty,** in the catalogue. The parity test requires Arabic script in every `ar` value. The test is in Task 2.

---

### Task 1: Icon concept registry in `design-tokens`

**Files:**
- Create: `src/icons.ts`
- Create: `test/icons.test.js`
- Modify: `src/index.ts` (add one export line)
- Modify: `package.json` (`scripts.test`, `devDependencies`)

**Interfaces:**
- Produces:
  - `IconConcepts`, `IconActions`, `IconStatuses`, `IconFeedback`: `as const` records of key → Solar base name.
  - `IconSameMeaning: readonly (readonly string[])[]`
  - Types `IconConcept`, `IconAction`, `IconStatus`, `IconFeedbackKind`
  - `solarLinearName(glyph: string): string` returns `` `${glyph}-linear` ``
  - `iconifyName(glyph: string): string` returns `` `solar:${glyph}-linear` ``

- [ ] **Step 1: Set up the worktree and test runner**

```bash
cd /Users/fadyshawky/Dev/uprise/design-tokens
git fetch origin
git worktree add -b feat/icon-registry-feedback ../.worktrees/design-tokens-0.7 origin/main
cd ../.worktrees/design-tokens-0.7
npm install --save-dev --save-exact @iconify-json/solar@1.2.2
```

In `package.json` `scripts`, add:

```json
"test": "npm run build && node --test test/"
```

- [ ] **Step 2: Write the failing test**

Create `test/icons.test.js`:

```js
// The registry's invariants (spec 2026-10-15 §6.1). A failure here is a
// product bug, not a test bug: two meanings drawn alike, or a glyph Solar
// doesn't have, which renders as nothing.
const test = require('node:test');
const assert = require('node:assert/strict');
const solar = require('@iconify-json/solar/icons.json');
const {
  IconConcepts,
  IconActions,
  IconStatuses,
  IconFeedback,
  IconSameMeaning,
  solarLinearName,
  iconifyName,
} = require('../dist/cjs');

const groups = {
  concepts: IconConcepts,
  actions: IconActions,
  statuses: IconStatuses,
  feedback: IconFeedback,
};
const entries = Object.entries(groups).flatMap(([group, map]) =>
  Object.entries(map).map(([key, glyph]) => ({ ref: `${group}.${key}`, glyph })),
);

test('every glyph exists in Solar Linear', () => {
  const missing = entries.filter((e) => !solar.icons[`${e.glyph}-linear`]);
  assert.deepEqual(missing, []);
});

test('glyphs are base names, without a style suffix', () => {
  const suffixed = entries.filter((e) => /-(linear|bold|broken|outline|duotone)$/.test(e.glyph));
  assert.deepEqual(suffixed, []);
});

test('no glyph carries two meanings', () => {
  const byGlyph = new Map();
  for (const e of entries) byGlyph.set(e.glyph, [...(byGlyph.get(e.glyph) || []), e.ref]);
  const allowed = (refs) =>
    IconSameMeaning.some((pair) => refs.every((r) => pair.includes(r)));
  const clashes = [...byGlyph].filter(([, refs]) => refs.length > 1 && !allowed(refs));
  assert.deepEqual(clashes, []);
});

test('every same-meaning pair really shares one glyph', () => {
  const glyphOf = Object.fromEntries(entries.map((e) => [e.ref, e.glyph]));
  for (const pair of IconSameMeaning) {
    assert.ok(pair.every((r) => r in glyphOf), `unknown ref in ${pair}`);
    assert.equal(new Set(pair.map((r) => glyphOf[r])).size, 1, `${pair} differ`);
  }
});

test('keys are camelCase', () => {
  const bad = entries.filter((e) => !/^[a-z][a-zA-Z0-9]*$/.test(e.ref.split('.')[1]));
  assert.deepEqual(bad, []);
});

test('renderer names', () => {
  assert.equal(solarLinearName('car'), 'car-linear');
  assert.equal(iconifyName('car'), 'solar:car-linear');
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL at `require('../dist/cjs')`, because `IconConcepts` is undefined (it isn't exported yet).

- [ ] **Step 4: Write the registry**

Create `src/icons.ts`:

```ts
/**
 * One concept, one glyph, on every platform (spec 2026-10-15 §6).
 *
 * Values are Solar base names. The renderers add the style: the RN apps look
 * up `solarLinearName(glyph)` in their generated SOLAR_GLYPHS, the dashboard
 * passes `iconifyName(glyph)` to Iconify. Apps name a concept, an action or a
 * status — never a glyph — so a glyph change here moves all three apps.
 *
 * The first values were proposed on 2026-10-15 and are confirmed on the glyph
 * review page (Plan 1 Task 6). The audit that motivated them: `reports.png`
 * drew Assignments, Accident Reports and Staff Attendance in the staff app;
 * the dashboard drew five nav items with one folder; Pickup was a car in both
 * apps and a walking person on the dashboard.
 */

export const IconConcepts = {
  home: 'home-smile',
  dashboard: 'widget-2',
  students: 'users-group-rounded',
  parents: 'user-heart-rounded',
  pickupContacts: 'user-check-rounded',
  staff: 'user-id',
  staffRoles: 'shield-user',
  classes: 'square-academic-cap',
  studentAttendance: 'clipboard-check',
  staffAttendance: 'clipboard-clock',
  checkIn: 'scanner',
  branchQr: 'qr-code',
  vacation: 'suitcase',
  pickup: 'car',
  lateCheckout: 'clock-square',
  orientation: 'hand-shake',
  events: 'confetti',
  calendar: 'calendar',
  food: 'chef-hat',
  dailySchedule: 'checklist',
  learning: 'notebook',
  materials: 'book-2',
  assignments: 'clipboard-list',
  progressReports: 'graph-up',
  accidentReports: 'danger-triangle',
  medicalAssessments: 'stethoscope',
  medicalInfo: 'heart-pulse',
  gallery: 'gallery',
  videos: 'videocamera',
  chat: 'chat-round-dots',
  announcements: 'volume-loud',
  notifications: 'bell',
  reviews: 'star',
  websiteMessages: 'inbox-in',
  nurseries: 'buildings-2',
  branches: 'map-point-school',
  analytics: 'chart-square',
  invoices: 'bill-list',
  quotations: 'clipboard-text',
  documentTemplates: 'documents',
  requestLogs: 'server-square',
  deletedData: 'archive',
  nurseryPolicy: 'document',
  nurserySettings: 'tuning-2',
  systemSettings: 'server',
  appVersions: 'smartphone-update',
  settings: 'settings',
  profile: 'user-circle',
  more: 'widget-4',
  birthdays: 'gift',
  language: 'global',
  password: 'lock-password',
} as const;

/** Generic UI actions. Never used for a concept. */
export const IconActions = {
  back: 'alt-arrow-left',
  forward: 'alt-arrow-right',
  expand: 'alt-arrow-down',
  close: 'close',
  add: 'add',
  edit: 'pen-new-square',
  delete: 'trash-bin-minimalistic',
  search: 'magnifier',
  filter: 'filter',
  sort: 'sort',
  share: 'share',
  more: 'menu-dots',
  menu: 'hamburger-menu',
  download: 'download',
  upload: 'upload',
  send: 'plain',
  camera: 'camera',
  refresh: 'refresh',
  login: 'login-2',
  logout: 'logout-2',
  pickDate: 'calendar-minimalistic',
  view: 'eye',
  copy: 'copy',
  call: 'phone',
  email: 'letter',
  location: 'map-point',
  attach: 'paperclip',
  play: 'play',
  pause: 'pause',
} as const;

/** Reserved status glyphs (spec §6.1 rule 2). */
export const IconStatuses = {
  done: 'check-circle',
  pending: 'hourglass',
  rejected: 'close-circle',
  late: 'clock-circle',
  halfDay: 'sunset',
  vacation: 'suitcase',
  sickLeave: 'hand-pills',
} as const;

/** Toast and banner glyphs (spec §5). */
export const IconFeedback = {
  success: 'check-circle',
  error: 'danger-circle',
  info: 'info-circle',
  offline: 'cloud-cross',
} as const;

/**
 * The only glyphs allowed to appear twice: each pair means one thing.
 * "On vacation" is the vacation concept; a successful action is "done".
 */
export const IconSameMeaning: readonly (readonly string[])[] = [
  ['concepts.vacation', 'statuses.vacation'],
  ['statuses.done', 'feedback.success'],
];

export type IconConcept = keyof typeof IconConcepts;
export type IconAction = keyof typeof IconActions;
export type IconStatus = keyof typeof IconStatuses;
export type IconFeedbackKind = keyof typeof IconFeedback;

/** Key in the RN apps' generated SOLAR_GLYPHS. */
export function solarLinearName(glyph: string): string {
  return `${glyph}-linear`;
}

/** Iconify name for the dashboard. */
export function iconifyName(glyph: string): string {
  return `solar:${glyph}-linear`;
}
```

Add to `src/index.ts`, after the existing `export { … } from './mobilePlatform';` block:

```ts
export {
  IconConcepts,
  IconActions,
  IconStatuses,
  IconFeedback,
  IconSameMeaning,
  solarLinearName,
  iconifyName,
} from './icons';
export type { IconConcept, IconAction, IconStatus, IconFeedbackKind } from './icons';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: 6 tests pass, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/icons.ts src/index.ts test/icons.test.js
git commit -m "feat(icons): one Solar Linear glyph per concept, checked for clashes"
```

---

### Task 2: Feedback catalogue (en/ar) in `design-tokens`

**Files:**
- Create: `src/feedback.ts`
- Create: `test/feedback.test.js`
- Modify: `src/index.ts` (add export lines)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `FeedbackMessages: { en: FeedbackCatalogue; ar: FeedbackCatalogue }`
  - `type FeedbackLocale = 'en' | 'ar'`
  - `type FeedbackItem = keyof FeedbackCatalogue['items']`
  - `type FeedbackAction = keyof FeedbackCatalogue['actions']`
  - `type FeedbackSuccess = keyof FeedbackCatalogue['success']`
  - `SessionErrorCodes: readonly string[]`, `PermissionErrorCodes: readonly string[]`
  - `fillFeedback(template: string, vars: Record<string, string>): string`. It replaces `{{name}}` with `vars.name`, and `{{Name}}` with `vars.name` capitalised in its first letter.
  - `feedbackForError(locale: FeedbackLocale, error: { code?: string | null; status?: number | null }, action: FeedbackAction, item: FeedbackItem): string`. It always returns text.
  - `feedbackForSuccess(locale: FeedbackLocale, kind: FeedbackSuccess, item: FeedbackItem): string`

- [ ] **Step 1: Write the failing test**

Create `test/feedback.test.js`:

```js
// The catalogue is the only source of user-facing feedback text (spec §5, D4).
// These guards keep it whole in both languages: a missing Arabic key falls
// back to English on screen, which is exactly what the audit found in 46% of
// dashboard success toasts.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FeedbackMessages,
  fillFeedback,
  feedbackForError,
  feedbackForSuccess,
} = require('../dist/cjs');

const leaves = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
const placeholders = (s) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1].toLowerCase()).sort();

test('en and ar have exactly the same keys', () => {
  const en = leaves(FeedbackMessages.en).map(([k]) => k).sort();
  const ar = leaves(FeedbackMessages.ar).map(([k]) => k).sort();
  assert.deepEqual(ar, en);
});

test('every value is a non-empty string, Arabic in ar', () => {
  for (const [k, v] of leaves(FeedbackMessages.en)) assert.ok(typeof v === 'string' && v.trim(), `en.${k}`);
  for (const [k, v] of leaves(FeedbackMessages.ar)) {
    assert.ok(typeof v === 'string' && v.trim(), `ar.${k}`);
    assert.match(v, /[؀-ۿ]/, `ar.${k} has no Arabic`);
  }
});

test('en and ar use the same placeholders', () => {
  const ar = Object.fromEntries(leaves(FeedbackMessages.ar));
  for (const [k, v] of leaves(FeedbackMessages.en)) {
    assert.deepEqual(placeholders(ar[k]), placeholders(v), k);
  }
});

test('error codes are SCREAMING_SNAKE', () => {
  for (const code of Object.keys(FeedbackMessages.en.errors)) assert.match(code, /^[A-Z][A-Z0-9_]+$/);
});

test('fillFeedback capitalises only {{Name}}, and only the first letter', () => {
  assert.equal(fillFeedback('{{Item}} saved.', { item: 'vacation request' }), 'Vacation request saved.');
  assert.equal(fillFeedback("Couldn't save the {{item}}.", { item: 'album' }), "Couldn't save the album.");
  assert.equal(fillFeedback('تم حفظ {{item}}.', { item: 'الألبوم' }), 'تم حفظ الألبوم.');
  assert.equal(fillFeedback('{{Item}}', {}), '');
});

test('success text', () => {
  assert.equal(feedbackForSuccess('en', 'sent', 'vacationRequest'), 'Vacation request sent.');
  assert.equal(feedbackForSuccess('ar', 'sent', 'vacationRequest'), 'تم إرسال طلب الإجازة.');
});

test('a known code wins over the status', () => {
  const text = feedbackForError('en', { code: 'NOT_ENOUGH_VACATION_DAYS', status: 400 }, 'send', 'vacationRequest');
  assert.equal(text, FeedbackMessages.en.errors.NOT_ENOUGH_VACATION_DAYS);
});

test('an unknown code falls back by status, then to the action message', () => {
  const en = FeedbackMessages.en;
  assert.equal(feedbackForError('en', { code: 'BRAND_NEW', status: 403 }, 'save', 'album'), en.error.permission);
  assert.equal(feedbackForError('en', { code: 'BRAND_NEW', status: 404 }, 'save', 'album'), en.error.notFound);
  assert.equal(feedbackForError('en', { status: 401 }, 'save', 'album'), en.error.sessionEnded);
  assert.equal(feedbackForError('en', { status: 503 }, 'save', 'album'), en.error.server);
  assert.equal(feedbackForError('en', { status: 0 }, 'save', 'album'), en.error.offline);
  assert.equal(feedbackForError('en', { code: 'BRAND_NEW', status: 400 }, 'delete', 'album'), "Couldn't delete the album. Try again.");
  assert.equal(feedbackForError('ar', {}, 'delete', 'album'), 'تعذّر حذف الألبوم. حاول مرة أخرى.');
});

test('code families: *_NOT_FOUND, session and permission codes', () => {
  const en = FeedbackMessages.en;
  assert.equal(feedbackForError('en', { code: 'PICKUP_NOT_FOUND', status: 404 }, 'save', 'pickupRequest'), en.error.notFound);
  assert.equal(feedbackForError('en', { code: 'TOKEN_EXPIRED', status: 401 }, 'save', 'album'), en.error.sessionEnded);
  assert.equal(feedbackForError('en', { code: 'STAFF_ID_MISMATCH', status: 403 }, 'save', 'album'), en.error.permission);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL. `FeedbackMessages` is undefined.

- [ ] **Step 3: Write the catalogue and helpers**

Create `src/feedback.ts`:

```ts
/**
 * Every toast, inline error and confirmation the three apps show, in English
 * and Arabic (spec 2026-10-15 §4.1, §5). Apps wire these into their own i18n;
 * they never show the server's `message` (decision D4: the audit found raw
 * backend text in ~57% of dashboard error toasts and in both RN apps' global
 * interceptors, English-only and sometimes internal, e.g. "Not enough
 * Vacations").
 *
 * Arabic success and error templates use the verbal-noun form ("تم حفظ …",
 * "تعذّر حفظ …"), so one template agrees with every item regardless of gender.
 * English items are lower-case nouns; a template that opens with the item
 * writes `{{Item}}`, and fillFeedback capitalises it.
 */

const en = {
  success: {
    saved: '{{Item}} saved.',
    created: '{{Item}} created.',
    updated: '{{Item}} updated.',
    deleted: '{{Item}} deleted.',
    sent: '{{Item}} sent.',
    approved: '{{Item}} approved.',
    rejected: '{{Item}} rejected.',
    uploaded: '{{Item}} uploaded.',
    submitted: '{{Item}} submitted.',
  },
  error: {
    actionFailed: "Couldn't {{action}} the {{item}}. Try again.",
    loadFailed: "Couldn't load this. Try again.",
    offline: "You're offline. Check your connection and try again.",
    server: 'Something went wrong on our side. Try again in a moment.',
    sessionEnded: 'Your session ended. Please log in again.',
    permission: "You don't have access to this.",
    notFound: 'This item no longer exists.',
  },
  actions: {
    save: 'save',
    create: 'create',
    update: 'update',
    delete: 'delete',
    send: 'send',
    approve: 'approve',
    reject: 'reject',
    upload: 'upload',
    submit: 'submit',
    load: 'load',
  },
  items: {
    vacationRequest: 'vacation request',
    album: 'album',
    photos: 'photos',
    video: 'video',
    activity: 'activity',
    announcement: 'announcement',
    message: 'message',
    student: 'student',
    attendance: 'attendance',
    checkIn: 'check-in',
    checkOut: 'check-out',
    pickupRequest: 'pickup request',
    contact: 'contact',
    accidentReport: 'accident report',
    medicalAssessment: 'medical assessment',
    assignment: 'assignment',
    progressReport: 'progress report',
    event: 'event',
    schedule: 'schedule',
    menu: 'menu',
    learningPlan: 'learning plan',
    material: 'material',
    class: 'class',
    branch: 'branch',
    nursery: 'nursery',
    invoice: 'invoice',
    quotation: 'quotation',
    template: 'template',
    settings: 'settings',
    profile: 'profile',
    password: 'password',
    review: 'review',
    lateCheckout: 'late checkout',
    staffMember: 'staff member',
    parent: 'parent',
    shift: 'shift',
    note: 'note',
    tags: 'tags',
  },
  confirm: {
    deleteTitle: 'Delete the {{item}}?',
    deleteBody: "This can't be undone.",
    deleteConfirm: 'Delete',
    logoutTitle: 'Log out?',
    logoutBody: "You'll need to log in again to use the app.",
    logoutConfirm: 'Log out',
    discardTitle: 'Discard changes?',
    discardBody: 'Your changes will be lost.',
    discardConfirm: 'Discard',
    cancel: 'Cancel',
  },
  errors: {
    ON_VACATION: "You're on vacation today, so check-in is closed.",
    NOT_ENOUGH_VACATION_DAYS: "You don't have enough vacation days left.",
    NOT_WORKING_DAY: "Today isn't a working day for your branch.",
    LOCATION_REQUIRED: 'Turn on location to check in.',
    DEVICE_ID_REQUIRED: "This device couldn't be identified. Restart the app and try again.",
    QR_NOT_RECOGNIZED: "This QR code isn't recognised. Scan your branch's code.",
    STAFF_CHECKED_IN: "You're already checked in.",
    NO_OPEN_CHECKIN: "You haven't checked in yet today.",
    OPEN_SHIFT_NOT_CHECKED_OUT: 'Check out of your previous shift first.',
    SHIFT_ALREADY_COMPLETE: 'This shift is already complete.',
    SHIFT_ALREADY_RECORDED: 'Attendance for this shift is already recorded.',
    NO_SHIFT_FOR_TIME: "There's no shift at this time.",
    MODULE_DISABLED: "This feature isn't enabled for your branch.",
    NURSERY_SUSPENDED: "Your nursery's account is suspended. Contact your administrator.",
    ACCOUNT_DISABLED: 'Your account is disabled. Contact your administrator.',
    PASSWORD_CHANGED: 'Your password was changed. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Wait a moment and try again.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Wait a moment and try again.',
    NOT_EDITABLE: "This can't be edited anymore.",
    NOT_PENDING: 'This request has already been handled.',
    CONTENT_TOO_LONG: "That's too long. Shorten it and try again.",
    EMPTY_CONTENT: 'Write something before sending.',
    NO_RECIPIENTS: 'Choose at least one recipient.',
    DUPLICATE_KEY: 'This already exists.',
    CLASS_FULL: 'This class is full.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: "This student has attendance this month, so they can't be removed.",
    VALIDATION_ERROR: 'Some details are missing or invalid. Check the form.',
  },
};

type Catalogue = typeof en;

const ar: Catalogue = {
  success: {
    saved: 'تم حفظ {{item}}.',
    created: 'تم إنشاء {{item}}.',
    updated: 'تم تحديث {{item}}.',
    deleted: 'تم حذف {{item}}.',
    sent: 'تم إرسال {{item}}.',
    approved: 'تم اعتماد {{item}}.',
    rejected: 'تم رفض {{item}}.',
    uploaded: 'تم رفع {{item}}.',
    submitted: 'تم تقديم {{item}}.',
  },
  error: {
    actionFailed: 'تعذّر {{action}} {{item}}. حاول مرة أخرى.',
    loadFailed: 'تعذّر التحميل. حاول مرة أخرى.',
    offline: 'أنت غير متصل بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.',
    server: 'حدث خطأ من جهتنا. حاول مرة أخرى بعد قليل.',
    sessionEnded: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
    permission: 'ليس لديك صلاحية الوصول إلى هذا.',
    notFound: 'هذا العنصر لم يعد موجودًا.',
  },
  actions: {
    save: 'حفظ',
    create: 'إنشاء',
    update: 'تحديث',
    delete: 'حذف',
    send: 'إرسال',
    approve: 'اعتماد',
    reject: 'رفض',
    upload: 'رفع',
    submit: 'تقديم',
    load: 'تحميل',
  },
  items: {
    vacationRequest: 'طلب الإجازة',
    album: 'الألبوم',
    photos: 'الصور',
    video: 'الفيديو',
    activity: 'النشاط',
    announcement: 'الإعلان',
    message: 'الرسالة',
    student: 'الطالب',
    attendance: 'الحضور',
    checkIn: 'تسجيل الحضور',
    checkOut: 'تسجيل الانصراف',
    pickupRequest: 'طلب الاستلام',
    contact: 'جهة الاتصال',
    accidentReport: 'تقرير الحادث',
    medicalAssessment: 'التقييم الطبي',
    assignment: 'التكليف',
    progressReport: 'تقرير التقدم',
    event: 'الفعالية',
    schedule: 'الجدول',
    menu: 'قائمة الطعام',
    learningPlan: 'خطة التعلم',
    material: 'المادة',
    class: 'الفصل',
    branch: 'الفرع',
    nursery: 'الحضانة',
    invoice: 'الفاتورة',
    quotation: 'عرض السعر',
    template: 'القالب',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    password: 'كلمة المرور',
    review: 'التقييم',
    lateCheckout: 'الانصراف المتأخر',
    staffMember: 'الموظف',
    parent: 'ولي الأمر',
    shift: 'الوردية',
    note: 'الملاحظة',
    tags: 'الوسوم',
  },
  confirm: {
    deleteTitle: 'حذف {{item}}؟',
    deleteBody: 'لا يمكن التراجع عن هذا الإجراء.',
    deleteConfirm: 'حذف',
    logoutTitle: 'تسجيل الخروج؟',
    logoutBody: 'ستحتاج إلى تسجيل الدخول مرة أخرى لاستخدام التطبيق.',
    logoutConfirm: 'تسجيل الخروج',
    discardTitle: 'تجاهل التغييرات؟',
    discardBody: 'ستفقد التغييرات التي أجريتها.',
    discardConfirm: 'تجاهل',
    cancel: 'إلغاء',
  },
  errors: {
    ON_VACATION: 'أنت في إجازة اليوم، لذا تسجيل الحضور غير متاح.',
    NOT_ENOUGH_VACATION_DAYS: 'ليس لديك أيام إجازة كافية.',
    NOT_WORKING_DAY: 'اليوم ليس يوم عمل في فرعك.',
    LOCATION_REQUIRED: 'فعّل خدمة الموقع لتسجيل الحضور.',
    DEVICE_ID_REQUIRED: 'تعذّر التعرّف على هذا الجهاز. أعد تشغيل التطبيق وحاول مرة أخرى.',
    QR_NOT_RECOGNIZED: 'رمز QR غير معروف. امسح رمز فرعك.',
    STAFF_CHECKED_IN: 'لقد سجّلت حضورك بالفعل.',
    NO_OPEN_CHECKIN: 'لم تسجّل حضورك اليوم بعد.',
    OPEN_SHIFT_NOT_CHECKED_OUT: 'سجّل انصرافك من الوردية السابقة أولًا.',
    SHIFT_ALREADY_COMPLETE: 'اكتملت هذه الوردية بالفعل.',
    SHIFT_ALREADY_RECORDED: 'تم تسجيل الحضور لهذه الوردية بالفعل.',
    NO_SHIFT_FOR_TIME: 'لا توجد وردية في هذا الوقت.',
    MODULE_DISABLED: 'هذه الميزة غير مفعّلة في فرعك.',
    NURSERY_SUSPENDED: 'حساب حضانتك موقوف. تواصل مع المسؤول.',
    ACCOUNT_DISABLED: 'حسابك معطّل. تواصل مع المسؤول.',
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور. سجّل الدخول مرة أخرى.',
    RATE_LIMITED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    RATE_LIMIT_EXCEEDED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    NOT_EDITABLE: 'لم يعد بالإمكان تعديل هذا.',
    NOT_PENDING: 'تمت معالجة هذا الطلب بالفعل.',
    CONTENT_TOO_LONG: 'النص طويل جدًا. اختصره وحاول مرة أخرى.',
    EMPTY_CONTENT: 'اكتب شيئًا قبل الإرسال.',
    NO_RECIPIENTS: 'اختر مستلمًا واحدًا على الأقل.',
    DUPLICATE_KEY: 'هذا موجود بالفعل.',
    CLASS_FULL: 'هذا الفصل مكتمل.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: 'لدى هذا الطالب حضور هذا الشهر، لذا لا يمكن حذفه.',
    VALIDATION_ERROR: 'بعض البيانات ناقصة أو غير صحيحة. راجع النموذج.',
  },
};

export const FeedbackMessages = { en, ar };
export type FeedbackCatalogue = Catalogue;
export type FeedbackLocale = keyof typeof FeedbackMessages;
export type FeedbackItem = keyof Catalogue['items'];
export type FeedbackAction = keyof Catalogue['actions'];
export type FeedbackSuccess = keyof Catalogue['success'];

/** Codes that mean "log in again" (backend auth_middleware / jwt_service). */
export const SessionErrorCodes: readonly string[] = [
  'TOKEN_EXPIRED',
  'SESSION_EXPIRED',
  'INVALID_TOKEN',
  'NO_TOKEN',
  'NO_REFRESH_TOKEN',
  'REFRESH_TOKEN_ERROR',
  'UNAUTHENTICATED',
];

/** Codes that mean "you can't reach this" (scope_policy and friends). */
export const PermissionErrorCodes: readonly string[] = [
  'FORBIDDEN',
  'UNAUTHORIZED',
  'STAFF_ID_MISMATCH',
  'USER_ID_MISMATCH',
  'PARENT_OUTSIDE_TENANT',
  'STUDENT_NO_SCOPE',
  'ROLE_NOT_ASSIGNABLE',
  'ROLE_NOT_MANAGEABLE',
];

export function fillFeedback(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name.toLowerCase()] ?? '';
    return name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
  });
}

export function feedbackForSuccess(locale: FeedbackLocale, kind: FeedbackSuccess, item: FeedbackItem): string {
  const m = FeedbackMessages[locale];
  return fillFeedback(m.success[kind], { item: m.items[item] });
}

/**
 * The text for a failed write. A known code wins; an unknown one is read by
 * its family, then by HTTP status; anything left is the action message. Never
 * returns the server's own text and never returns empty (status 0 is how
 * axios reports "no response": offline).
 */
export function feedbackForError(
  locale: FeedbackLocale,
  error: { code?: string | null; status?: number | null },
  action: FeedbackAction,
  item: FeedbackItem,
): string {
  const m = FeedbackMessages[locale];
  const { code, status } = error;
  if (code && code in m.errors) return m.errors[code as keyof Catalogue['errors']];
  if (code && SessionErrorCodes.includes(code)) return m.error.sessionEnded;
  if (code && PermissionErrorCodes.includes(code)) return m.error.permission;
  if (code && (code === 'NOT_FOUND' || code.endsWith('_NOT_FOUND'))) return m.error.notFound;
  if (status === 0) return m.error.offline;
  if (status === 401) return m.error.sessionEnded;
  if (status === 403) return m.error.permission;
  if (status === 404) return m.error.notFound;
  if (status != null && status >= 500) return m.error.server;
  return fillFeedback(m.error.actionFailed, { action: m.actions[action], item: m.items[item] });
}
```

Add to `src/index.ts`:

```ts
export {
  FeedbackMessages,
  SessionErrorCodes,
  PermissionErrorCodes,
  fillFeedback,
  feedbackForError,
  feedbackForSuccess,
} from './feedback';
export type {
  FeedbackCatalogue,
  FeedbackLocale,
  FeedbackItem,
  FeedbackAction,
  FeedbackSuccess,
} from './feedback';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all icon and feedback tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/feedback.ts src/index.ts test/feedback.test.js
git commit -m "feat(feedback): one en/ar message catalogue, never the server's text"
```

---

### Task 3: Backend error responses carry `code`

The global handler in `app.js` sends `{ status, message }` and drops `err.code`. So about 90 existing codes (`ON_VACATION`, `MODULE_DISABLED`, …) never reach a client unless a controller hand-writes them.

**Files:**
- Create: `middlewares/error_handler.js`
- Create: `scripts/verify/check-error-handler.js`
- Modify: `app.js` (the `app.use(function (err, req, res, next) { … })` block near the end)

**Interfaces:**
- Produces: `module.exports = { errorHandler }`, where `errorHandler(err, req, res, next)` is an Express error middleware. The response body is `{ status: "error", message, code? , stack? }`.

- [ ] **Step 1: Set up the worktree**

```bash
cd /Users/fadyshawky/Dev/uprise/backend
git fetch origin
git worktree add -b feat/error-codes ../.worktrees/backend-error-codes origin/master
cd ../.worktrees/backend-error-codes
ln -s /Users/fadyshawky/Dev/uprise/backend/node_modules node_modules
```

- [ ] **Step 2: Write the failing check**

Create `scripts/verify/check-error-handler.js`:

```js
// Usage: node scripts/verify/check-error-handler.js
//
// The global error handler dropped err.code, so clients only ever saw the
// English `message` (spec 2026-10-15 §4.3). It must now send `code` for 4xx,
// and never for 5xx: Postgres ("23505") and Node ("ECONNREFUSED") errors carry
// string codes that are internals, not contract.
const { errorHandler } = require("../../middlewares/error_handler");

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` -> ${detail}`}`);
}
function run(err, env = "production") {
  const out = {};
  const req = { app: { get: () => env }, method: "GET", originalUrl: "/api/x" };
  const res = { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } };
  const warn = console.warn; const error = console.error;
  console.warn = () => {}; console.error = () => {};
  try { errorHandler(err, req, res, () => {}); } finally { console.warn = warn; console.error = error; }
  return out;
}
const withProps = (message, props) => Object.assign(new Error(message), props);

let r = run(withProps("Not enough Vacations", { status: 400, code: "NOT_ENOUGH_VACATION_DAYS" }));
check("4xx carries its code", r.status === 400 && r.body.code === "NOT_ENOUGH_VACATION_DAYS", JSON.stringify(r));

r = run(withProps("x", { statusCode: 404, code: "PICKUP_NOT_FOUND" }));
check("statusCode (HttpError) works too", r.status === 404 && r.body.code === "PICKUP_NOT_FOUND", JSON.stringify(r));

r = run(withProps("duplicate key value", { code: "23505" }));
check("a 500 never sends its code", r.status === 500 && !("code" in r.body), JSON.stringify(r));
check("a 500 hides its message in production", r.body.message === "Internal server error", JSON.stringify(r));

r = run(withProps("bad", { status: 400 }));
check("4xx without a code sends none", r.status === 400 && !("code" in r.body), JSON.stringify(r));

r = run(withProps("bad", { status: 400, code: 42 }));
check("a non-string code is ignored", !("code" in r.body), JSON.stringify(r));

r = run(withProps("boom", {}), "development");
check("development keeps the stack", typeof r.body.stack === "string", JSON.stringify(r));

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node scripts/verify/check-error-handler.js`
Expected: crash with `Cannot find module '../../middlewares/error_handler'`.

- [ ] **Step 4: Move the handler and add `code`**

Create `middlewares/error_handler.js`:

```js
"use strict";

/**
 * Global Express error handler (moved out of app.js so it can be checked:
 * scripts/verify/check-error-handler.js).
 *
 * Sets req.apiErrorMessage so the request-log middleware can record it.
 * `code` goes out for 4xx only: it is the contract the apps branch on
 * (MODULE_DISABLED, NOT_ENOUGH_VACATION_DAYS, …) and was dropped here until
 * 2026-10, so they fell back to showing `message`. A 5xx's code is an
 * internal (Postgres "23505", Node "ECONNREFUSED") and stays in the logs.
 */
function errorHandler(err, req, res, next) {
  req.apiErrorMessage = err.message || String(err);

  const isProd = req.app.get("env") !== "development";
  const status = err.status || err.statusCode || 500;

  // Expected client errors (4xx — e.g. a stale/unknown tracking or orientation
  // token, a validation failure) are normal traffic, not incidents. Log them as
  // a single concise line with no stack trace. Reserve the full stack for 5xx,
  // which are genuine server faults worth tracing.
  const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${status} ${err.message}`;
  if (status >= 500) {
    console.error(line, err.stack || err);
  } else {
    console.warn(line);
  }

  res.status(status).json({
    status: "error",
    ...(status < 500 && typeof err.code === "string" ? { code: err.code } : {}),
    message: isProd && status === 500 ? "Internal server error" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { errorHandler };
```

In `app.js`:
- Replace the whole `app.use(function (err, req, res, next) { … });` block (from the line after `// error handler (set req.apiErrorMessage …)` through its closing `});`) with `app.use(errorHandler);`.
- Add `const { errorHandler } = require("./middlewares/error_handler");` next to the other middleware requires at the top.
- Keep the `// error handler …` comment line above it.

- [ ] **Step 5: Run the checks to verify they pass**

```bash
node scripts/verify/check-error-handler.js
node scripts/verify/check-routes-load.js
```

Expected: `all checks passed`, then `all route files load`.

- [ ] **Step 6: Commit**

```bash
git add middlewares/error_handler.js scripts/verify/check-error-handler.js app.js
git commit -m "fix(errors): send the error code to clients, for 4xx only"
```

---

### Task 4: Codes on the business errors users can hit, plus a scan that keeps them

Most uncoded 4xx are "not found", "forbidden" or malformed-parameter responses. The apps word those correctly from the HTTP status (`feedbackForError`, Task 2). A code is only needed where the message carries business meaning. The 2026-10-15 scan of the user-facing services found two such sites, plus generic sites that should state their family.

**Files:**
- Create: `scripts/verify/check-error-codes.js`
- Modify: `services/user_services/vacation_service.js` (the `"Not enough Vacations"` throw, about line 64)
- Modify: `services/student_services/student_service.js` (the two `"…has reached maximum capacity"` throws, about lines 94 and 191)
- Modify: `services/attendance_services/staff_shift_resolution_service.js` (lines 98 and 109)
- Modify: `services/attendance_services/attendance_service.js` (the uncoded throws at about lines 807–947)
- Modify: `services/gallery_services/gallery_scope_service.js` (about line 40)

**Interfaces:**
- Consumes: Task 3's handler, which now forwards `err.code`.
- Produces: the codes `NOT_ENOUGH_VACATION_DAYS` and `CLASS_FULL`, which Task 2's catalogue already holds. The family codes are `STAFF_NOT_FOUND`, `SHIFT_NOT_FOUND` and `VALIDATION_ERROR`.

- [ ] **Step 1: Write the scan (the failing check)**

Create `scripts/verify/check-error-codes.js`:

```js
// Usage: node scripts/verify/check-error-codes.js
//
// Lists every 4xx thrown or returned without a `code` in the services the
// staff and parent apps call (spec 2026-10-15 §4.3), and fails if any remain.
// Static on purpose: it reads source, so it needs no database.
//
// ponytail: regex over source, not an AST. It knows the three shapes this
// codebase uses (err.status/statusCode then err.code within 4 lines,
// attendanceError(status, msg, code), res.status(4xx).json({…})). Upgrade
// path: an acorn walk if a fourth shape appears.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const USER_FACING = [
  "services/attendance_services",
  "services/user_services/vacation_service.js",
  "services/pickup_services",
  "services/late_checkout_services",
  "services/chat_services",
  "services/gallery_services",
  "services/accident_report",
  "services/medical_assessment",
  "services/report_services",
  "services/progress_services",
  "services/student_services",
  "services/auth_services/auth_service.js",
];

function files(rel) {
  const abs = path.join(ROOT, rel);
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs).filter((f) => f.endsWith(".js")).map((f) => path.join(rel, f));
}

const found = [];
for (const rel of USER_FACING.flatMap(files)) {
  const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n");
  lines.forEach((line, i) => {
    const window = lines.slice(i, i + 4).join("\n");
    if (/new Error\(/.test(line) && /\.status(Code)?\s*=\s*4\d\d/.test(window) && !/\.code\s*=/.test(window)) {
      found.push(`${rel}:${i + 1}  ${line.trim()}`);
    }
    const ae = line.match(/attendanceError\(\s*4\d\d\s*,\s*(["'`]).*?\1\s*\)/);
    if (ae) found.push(`${rel}:${i + 1}  ${line.trim()}`);
  });
  const src = lines.join("\n");
  for (const m of src.matchAll(/res\s*\.status\(\s*4\d\d\s*\)\s*\.json\(\s*\{([\s\S]{0,400}?)\}\s*\)/g)) {
    if (!/\bcode\b/.test(m[1])) found.push(`${rel}:${src.slice(0, m.index).split("\n").length}  res.status(4xx) without code`);
  }
}

for (const f of found) console.log(`UNCODED  ${f}`);
console.log(found.length ? `\n${found.length} uncoded 4xx in user-facing services` : "all user-facing 4xx carry a code");
process.exit(found.length ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-error-codes.js`
Expected: exit 1. It lists at least these sites:
- `vacation_service.js` (Not enough Vacations)
- `student_service.js` ×2 (maximum capacity)
- `staff_shift_resolution_service.js` ×2
- `attendance_service.js` (the parameter checks at about lines 807–947)
- `gallery_scope_service.js`

- [ ] **Step 3: Add the codes**

In each listed site, add the `code` line directly under the existing `status` line. Don't change the messages: `message` still feeds the logs and the request log.

`services/user_services/vacation_service.js`:

```js
    const err = new Error("Not enough Vacations");
    err.status = 400;
    err.code = "NOT_ENOUGH_VACATION_DAYS";
    throw err;
```

`services/student_services/student_service.js`, at both capacity throws:

```js
      err.code = "CLASS_FULL";
```

`services/attendance_services/staff_shift_resolution_service.js`:
- On the line-98 `"Staff not found"` site, add `err.code = "STAFF_NOT_FOUND";`.
- On the line-109 `"Shift not found"` site, add `err.code = "SHIFT_NOT_FOUND";`.

`services/attendance_services/attendance_service.js`:
- On each uncoded `"Staff not found"` site, add `e.code = "STAFF_NOT_FOUND";`. Use the error variable the block declares (`e` or `err`).
- On each uncoded parameter check (page, limit, `branch_id is required`, `Invalid staff_id`, `Invalid date_from or date_to`, `date_from must be <= date_to`, `Date range cannot exceed 366 days`), add `<var>.code = "VALIDATION_ERROR";`.

`services/gallery_services/gallery_scope_service.js`, at `"album_id is required"`: add `err.code = "VALIDATION_ERROR";`.

If the scan lists a site not named above, give it a code by the same rules:
- `*_NOT_FOUND` for a missing row
- `VALIDATION_ERROR` for bad input
- a new specific `SCREAMING_SNAKE` code only when the message carries business meaning the user must read. Add any new specific code to the catalogue in Task 5.

- [ ] **Step 4: Run the checks to verify they pass**

```bash
node scripts/verify/check-error-codes.js
node scripts/verify/check-error-handler.js
node scripts/verify/check-routes-load.js
node scripts/check_attendance_vacation_scope.js
```

Expected:
- `all user-facing 4xx carry a code`
- `all checks passed`
- `all route files load`
- `All checks passed.`

- [ ] **Step 5: Commit**

```bash
git add scripts/verify/check-error-codes.js services
git commit -m "fix(errors): give user-facing business errors a code the apps can translate"
```

- [ ] **Step 6: Open the backend PR**

Write the body to a file. Use a quoted heredoc, so the shell doesn't expand it:

```bash
cat > /tmp/pr-error-codes.md <<'EOF'
## Why
The global error handler dropped `err.code`, so the ~90 codes the services already throw (`ON_VACATION`, `MODULE_DISABLED`, …) never reached the apps, which fell back to showing the English `message` (spec 2026-10-15 §4.3, decision D4).

## What
- `middlewares/error_handler.js`: the handler moves out of `app.js` and sends `code` for 4xx (never for 5xx, whose codes are Postgres/Node internals).
- Codes on the uncoded user-facing business errors: `NOT_ENOUGH_VACATION_DAYS`, `CLASS_FULL`, plus `*_NOT_FOUND` / `VALIDATION_ERROR` families.
- `scripts/verify/check-error-codes.js` keeps user-facing services coded.

## Verification
- `node scripts/verify/check-error-handler.js` → all checks passed
- `node scripts/verify/check-error-codes.js` → all user-facing 4xx carry a code
- `node scripts/verify/check-routes-load.js` → all route files load
- `node scripts/check_attendance_vacation_scope.js` → All checks passed

## Deploy
`cd /app/backend && git pull origin master && pm2 reload Uprise` (no migration, no npm install). Responses only gain a field; current apps ignore it.
EOF
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/backend.git HEAD:refs/heads/feat/error-codes
gh pr create -R upriseEdu-tech/backend --base master --head feat/error-codes \
  --title "fix(errors): send error codes to the apps" --body-file /tmp/pr-error-codes.md
```

Expected: a PR URL. **Don't merge.** The owner approves the merge.

---

### Task 5: Catalogue parity with the backend, README policy, and 0.7.0

**Files:**
- Create: `test/catalogue-codes.test.js`
- Modify: `src/feedback.ts`, only if Task 4 introduced a specific code not already in `errors`
- Modify: `README.md` (add a "Feedback and icons" section)
- Modify: `package.json` (`version` → `0.7.0`)

**Interfaces:**
- Consumes: Task 2 (`FeedbackMessages`) and Task 4 (the backend codes).
- Produces: the published package `@upriseedu-tech/design-tokens@0.7.0`.

- [ ] **Step 1: Write the failing test**

Create `test/catalogue-codes.test.js`:

```js
// Every specific code a user can hit has a message (spec §4.1, §4.3). The
// list is the backend's user-facing codes as of Plan 1 Task 4; a new one is
// added here and to src/feedback.ts in the same commit.
const test = require('node:test');
const assert = require('node:assert/strict');
const { FeedbackMessages } = require('../dist/cjs');

const USER_FACING_CODES = [
  'ON_VACATION', 'NOT_ENOUGH_VACATION_DAYS', 'NOT_WORKING_DAY', 'LOCATION_REQUIRED',
  'DEVICE_ID_REQUIRED', 'QR_NOT_RECOGNIZED', 'STAFF_CHECKED_IN', 'NO_OPEN_CHECKIN',
  'OPEN_SHIFT_NOT_CHECKED_OUT', 'SHIFT_ALREADY_COMPLETE', 'SHIFT_ALREADY_RECORDED',
  'NO_SHIFT_FOR_TIME', 'MODULE_DISABLED', 'NURSERY_SUSPENDED', 'ACCOUNT_DISABLED',
  'PASSWORD_CHANGED', 'RATE_LIMITED', 'RATE_LIMIT_EXCEEDED', 'NOT_EDITABLE', 'NOT_PENDING',
  'CONTENT_TOO_LONG', 'EMPTY_CONTENT', 'NO_RECIPIENTS', 'DUPLICATE_KEY', 'CLASS_FULL',
  'STUDENT_HAS_CURRENT_MONTH_ATTENDANCE', 'VALIDATION_ERROR',
];

test('every user-facing backend code has en and ar text', () => {
  for (const locale of ['en', 'ar']) {
    const missing = USER_FACING_CODES.filter((c) => !FeedbackMessages[locale].errors[c]);
    assert.deepEqual(missing, [], locale);
  }
});
```

- [ ] **Step 2: Run it**

Run: `npm test`
Expected:
- PASS if Task 4 added only `NOT_ENOUGH_VACATION_DAYS` and `CLASS_FULL`.
- If Task 4 added another specific code, first add it to `USER_FACING_CODES`. The test then FAILs.

- [ ] **Step 3: Add any missing code to both languages**

For each code the test reports missing, add one English and one Arabic sentence to `errors` in `src/feedback.ts`. Write them in the same voice as the existing entries: what happened, then what to do. Rerun `npm test` until it PASSes.

- [ ] **Step 4: Verify each catalogue message against its throw site**

For each code in `USER_FACING_CODES`, find where it's thrown:

```bash
git -C /Users/fadyshawky/Dev/uprise/backend grep -n "<CODE>" origin/master -- services middlewares helpers controllers
```

Then read the condition at that site. If the catalogue sentence describes something else, correct the sentence in both languages. For example, check that `STAFF_CHECKED_IN` really means "already checked in" and not "checked in elsewhere". Record any correction in the commit body.

- [ ] **Step 5: README policy and version**

Append to `README.md`:

```markdown
## Feedback and icons (spec 2026-10-15)

- **Icons:** apps name a concept, action or status — `IconConcepts.pickup`, never a glyph. One concept, one Solar Linear glyph, on every platform; `npm test` fails on a glyph with two meanings or one Solar doesn't have. RN renders `solarLinearName(glyph)`, the dashboard `iconifyName(glyph)`.
- **Feedback:** every toast, inline error and confirmation comes from `FeedbackMessages` (en/ar). Failed writes use `feedbackForError(locale, { code, status }, action, item)` — a known code, else its family, else the HTTP status, else the action message; the server's `message` is never shown. Successful writes use `feedbackForSuccess`. One report per failure; a failed load is the screen's error state, never a toast.
```

Set `"version": "0.7.0"` in `package.json`.

- [ ] **Step 6: Run the full build and tests**

Run: `npm test`
Expected: all tests pass. `dist/` is rebuilt.

- [ ] **Step 7: Commit, push, PR**

```bash
git add README.md package.json src/feedback.ts test/catalogue-codes.test.js
git commit -m "feat: release the icon registry and feedback catalogue as 0.7.0"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/design-tokens.git HEAD:refs/heads/feat/icon-registry-feedback
```

Open the PR with a `## Verification` section listing `npm test` and its pass count. **Don't merge, and don't publish.** Publishing to GitHub Packages is outward-facing, and the owner approves it after the glyph review (Task 6).

- [ ] **Step 8: Publish (only after owner approval)**

After the owner approves both the PR and the glyphs:

```bash
npm publish
```

Expected: `+ @upriseedu-tech/design-tokens@0.7.0`. If the registry refuses (401/403), stop and report it. Don't change credentials.

---

### Task 6: Glyph review page (owner approves the registry)

**Files:**
- Create: `scripts/render-icon-review.mjs` (design-tokens)
- Output (not committed): `/private/tmp/…/scratchpad/icon-review.html`, published as an Artifact

**Interfaces:**
- Consumes: Task 1 (`dist/cjs` exports) and `@iconify-json/solar` icon bodies.
- Produces: an Artifact URL the owner reviews. If the owner changes any glyphs, edit `src/icons.ts` and rerun Task 1's tests.

- [ ] **Step 1: Load the artifact-design skill**

Load `artifact-design` before writing the page, as the Artifact tool requires.

- [ ] **Step 2: Write the renderer**

Create `scripts/render-icon-review.mjs`:

```js
// Renders the icon registry for the owner's review (spec §4.2, Plan 1 Task 6):
// one card per concept with the proposed glyph and what each app draws today,
// then the action, status and feedback sets. Run after `npm run build`.
//   node scripts/render-icon-review.mjs > /path/to/icon-review.html
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const solar = require('@iconify-json/solar/icons.json');
const { IconConcepts, IconActions, IconStatuses, IconFeedback } = require('../dist/cjs/index.js');

// What each app draws today for a concept (2026-10-15 icon audit). Empty = none.
const TODAY = {
  home: ['home.png', 'home', 'widget-2 duotone'],
  chat: ['message_square.png / chat-round / chat-round-dots', 'chat-round', 'chat-round-dots duotone; mdi:message-text'],
  notifications: ['notification.png / bell', 'bell', 'bell-bing duotone; mdi:bell'],
  pickup: ['car.png / car', 'car', 'walking (nav) / tag (KPI)'],
  dailySchedule: ['calendar_dots.png / calendar', 'calendar; document-text', 'checklist'],
  events: ['confetti', 'calendar-mark / calendar', 'confetti; mdi:calendar-star'],
  vacation: ['calendar_check.png / umbrella / calendar-mark', '', 'calendar / sun-2 / suitcase'],
  progressReports: ['reports.png / clipboard / Assignment.png / chart', 'chart-square / clipboard', 'graph-up / document-text'],
  learning: ['book.png / book / book-2 / academic-cap', 'book / folder-open / target', 'notebook'],
  staffAttendance: ['checkin.png / reports.png / clock / login', '', 'calendar / clock-circle'],
  accidentReports: ['reports.png', '', 'folder-with-files'],
  assignments: ['reports.png / clipboard / Assignment.png', '', ''],
  medicalAssessments: ['Assignment.png', '', ''],
  birthdays: ['balloon / gift', 'star SVG / gift / confetti', 'cake'],
  classes: ['academic-cap', '', 'book-bookmark / graduation-cap'],
  announcements: ['volume-loud', '', 'letter (nav) / megaphone'],
};

const svg = (glyph, size = 28) => {
  const icon = solar.icons[`${glyph}-linear`];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${icon.body}</svg>`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const card = (key, glyph, today) => `
  <article class="card">
    <div class="glyph">${svg(glyph)}</div>
    <div class="meta"><strong>${esc(key)}</strong><code>${esc(glyph)}</code>
    ${today ? `<dl><dt>Staff</dt><dd>${esc(today[0] || '—')}</dd><dt>Parent</dt><dd>${esc(today[1] || '—')}</dd><dt>Dashboard</dt><dd>${esc(today[2] || '—')}</dd></dl>` : ''}
    </div>
  </article>`;
const section = (title, map, withToday) => `
  <section><h2>${title} <span>${Object.keys(map).length}</span></h2>
  <div class="grid">${Object.entries(map).map(([k, g]) => card(k, g, withToday ? TODAY[k] : null)).join('')}</div></section>`;

process.stdout.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Uprise Icon Registry</title>
<style>
:root{--canvas:#F8F8FA;--card:#FFFFFF;--title:#1A1732;--sub:#6F6B8A;--border:rgba(132,129,253,.14);--accent:#8481FD;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--canvas:#14121F;--card:#1D1A2C;--title:#F4F3FA;--sub:#A9A5C2;--border:rgba(132,129,253,.28);}}
:root[data-theme="dark"]{--canvas:#14121F;--card:#1D1A2C;--title:#F4F3FA;--sub:#A9A5C2;--border:rgba(132,129,253,.28);}
body{margin:0;background:var(--canvas);color:var(--title);font:15px/1.5 "Kumbh Sans",system-ui,sans-serif;}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px;}
h1{font-size:28px;margin:0 0 4px} p.lead{color:var(--sub);margin:0 0 24px}
h2{font-size:18px;margin:32px 0 12px} h2 span{color:var(--sub);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.card{display:flex;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px}
.glyph{color:var(--accent);flex:none;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:rgba(132,129,253,.10)}
.meta{min-width:0} .meta code{display:block;color:var(--sub);font-size:12px}
dl{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin:8px 0 0;font-size:12px} dt{color:var(--sub)} dd{margin:0;overflow-wrap:anywhere}
</style></head><body><main>
<h1>Uprise icon registry</h1>
<p class="lead">One Solar Linear glyph per concept, on the staff app, the parent app and the dashboard. Proposed 2026-10-15 for approval. "Today" shows what each app draws now.</p>
${section('Concepts', IconConcepts, true)}
${section('Actions', IconActions, false)}
${section('Statuses', IconStatuses, false)}
${section('Feedback', IconFeedback, false)}
</main></body></html>`);
```

- [ ] **Step 3: Render the page and check it**

```bash
npm run build
node scripts/render-icon-review.mjs > /private/tmp/claude-503/-Users-fadyshawky-Dev-uprise/7d3ff877-d050-4cde-a093-9779ad7dba7c/scratchpad/icon-review.html
grep -c '<article' /private/tmp/claude-503/-Users-fadyshawky-Dev-uprise/7d3ff877-d050-4cde-a093-9779ad7dba7c/scratchpad/icon-review.html
```

Expected: the count equals the sum of the four registries' sizes (`Object.keys` of each). This plan's data gives 52 + 29 + 7 + 4 = 92.

- [ ] **Step 4: Publish for review**

Publish the HTML with the Artifact tool:
- `icon: "palette"`
- description: "Proposed icon registry for the Uprise apps: one Solar Linear glyph per concept, for approval."

Give the owner the link. Ask them to approve it or name any glyphs to change.

- [ ] **Step 5: Apply the owner's changes**

For each glyph the owner changes:
1. Edit `src/icons.ts`.
2. Run `npm test` (the clash and existence checks).
3. Re-render and republish to the same artifact URL.

Commit:

```bash
git add scripts/render-icon-review.mjs src/icons.ts
git commit -m "feat(icons): glyphs approved on the review page"
```

---

### Task 7: Smoothness baseline (read-only audit)

**Files:**
- Create: `docs/audits/2026-10-smoothness-baseline.md` (design-tokens repo, on the Task 1 branch)

**Interfaces:**
- Produces: the baseline that Plans 2, 5, 6 and 7 cite. For each app it records:
  - every finding with its `file:line`
  - the request_logs endpoint table
  - the counts the sweeps must bring down

- [ ] **Step 1: Run the static RN checks**

Run each command in both `teacher` and `mobile`, on `origin/main` via `git grep`, so no working tree is touched. Record the counts and the top files.

```bash
# Lists built as ScrollView + map (should be FlatListWrapper)
git grep -n -E "<ScrollView" origin/main -- src | cut -d: -f2 | sort | uniq -c | sort -rn | head -20
git grep -n -E "\.map\(\(.*\) =>\s*\(?\s*<" origin/main -- src | cut -d: -f2 | sort | uniq -c | sort -rn | head -20
# FlatList/FlashList inside a ScrollView in the same file (nested virtualized lists)
for f in $(git grep -l "<ScrollView" origin/main -- src | cut -d: -f2); do git show origin/main:$f | grep -qE "<(FlatList|FlashList|FlatListWrapper|SectionList)" && echo "$f"; done
# Animations off the native driver
git grep -n "useNativeDriver: false" origin/main -- src
# Raw Image in lists/grids (no cache, no resize)
git grep -n "<Image" origin/main -- src | cut -d: -f2 | sort | uniq -c | sort -rn | head -15
# console in shipped code
git grep -n -E "console\.(log|warn|error)\(" origin/main -- src | wc -l
# Selectors returning whole slices or fresh objects (re-render on every store change)
git grep -n -E "useAppSelector\(\s*\(?state\)?\s*=>\s*state\.[a-zA-Z]+\s*\)" origin/main -- src | wc -l
git grep -n -E "useAppSelector\(\s*\(?state\)?\s*=>\s*\(\{" origin/main -- src
# Refetch on every focus
git grep -n "useFocusEffect" origin/main -- src | wc -l
# Keyboard handling on form screens
git grep -L -E "KeyboardAvoidingView|KeyboardAwareScrollView|keyboardShouldPersistTaps" origin/main -- 'src/screens/**/*Form*.tsx' 'src/screens/**/*Modal*.tsx'
```

- [ ] **Step 2: Run the static dashboard checks**

Run these in `dashboard` on `origin/master`:

```bash
# Icons fetched from api.iconify.design at runtime (pop-in, external dependency)
git grep -n "addCollection\|@iconify-json" origin/master -- src package.json || echo "Iconify loads icons online"
# Tables without pagination
git grep -l "<Table" origin/master -- src | while read f; do git show "$f" | grep -q "TablePagination" || echo "${f#origin/master:}"; done
# Effects that fetch without a key (refetch storms)
git grep -n -E "useEffect\(\(\) => \{[^}]*fetch" origin/master -- src | wc -l
# Nested scroll containers in dialogs
git grep -n -E "overflow(Y)?: ?'(auto|scroll)'" origin/master -- src | cut -d: -f2 | sort | uniq -c | sort -rn | head -15
```

- [ ] **Step 3: Record the backend endpoint baseline**

Run against the local snapshot only (`uprise_prod_1011`), never production:

```bash
psql -d uprise_prod_1011 -X -A -F' | ' -c "
with r as (
  select method, regexp_replace(regexp_replace(split_part(request_url,'?',1),'/[0-9]+(?=/|\$)','/:id','g'),'^/api','') as route, duration_ms
  from request_logs where duration_ms is not null
    and created_at > (select max(created_at) from request_logs) - interval '14 days' and response_status < 400),
s as (select method, route, count(*) n,
  percentile_cont(0.5) within group (order by duration_ms)::int p50,
  percentile_cont(0.95) within group (order by duration_ms)::int p95, max(duration_ms) mx
  from r group by 1,2)
select * from s where n >= 50 and p95 > 150 order by p95*n desc limit 25;"
```

Expected: a table. On 2026-10-15 it started with `GET /schedule` (p95 309 ms, n 2045), `GET /notifications` (730), `GET /album` (478) and `GET /student` (391). Paste it into the report as the Plan 2 input.

- [ ] **Step 4: Write the report**

Write `docs/audits/2026-10-smoothness-baseline.md` with these sections:
1. RN staff app
2. RN parent app
3. Dashboard
4. Backend endpoints

Each finding is one table row: what, where (`file:line` or count), and which plan fixes it (2, 5, 6 or 7). End with the target numbers from spec §8.2.

- [ ] **Step 5: Commit**

```bash
git add docs/audits/2026-10-smoothness-baseline.md
git commit -m "docs(audit): smoothness baseline before the consistency sweep"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/design-tokens.git HEAD:refs/heads/feat/icon-registry-feedback
```

---

## After Plan 1

- **Owner gates:**
  - Merge the backend PR (Task 4).
  - Approve the glyphs (Task 6).
  - Merge and publish `design-tokens` 0.7.0 (Task 5).
- **Deploy the backend:** `git pull origin master && pm2 reload Uprise`.
- **Write Plans 2, 3 and 7.** Their inputs now exist: the baseline, the published package and the approved glyphs.
