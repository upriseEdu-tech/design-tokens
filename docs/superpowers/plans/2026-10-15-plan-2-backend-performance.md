# Plan 2: Backend performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the endpoints behind the apps' main screens back toward the ~100 ms budget by removing the work that stalls every request, not by tuning queries that are already fast.

**Architecture:**
- On the 2026-10-11 snapshot, the SQL behind each slow endpoint runs in 0.2–10 ms. The time goes elsewhere.
- **Notifications** returns a user's entire history unpaged. The busiest user has 26,423 rows, a 4 MB response, and a 600 ms disk sort.
- **The request log** then deep-copies and stringifies every response body on the event loop. That stalls every concurrent request.
- **`authenticateReq`** rewrites `users.app_version` on every request.
- **Photo confirm-upload** builds a new Google Cloud Storage client for every request.
- **Bulk schedule** checks duplicates, looks up push tokens and auto-marks attendance one row at a time, in sequence.

Each fix below has a `scripts/verify/*` check, because the backend has no test runner.

**Tech Stack:** Node 22, Express 4, Knex + Objection on Postgres, Joi, `@google-cloud/storage`.

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md` §8 (smoothness), §8.2 (targets), §9 Wave 1 (slow endpoints). The baseline is `docs/audits/2026-10-smoothness-baseline.md` §4.

## Global Constraints

- **Layering:** queries live in `models/` only. Services orchestrate. Controllers do HTTP. Validators are Joi files. No `knex` or `Model.query()` outside `models/`.
- **Schema changes go through a new migration.** Indexes on live tables are built `CONCURRENTLY`, in a migration with `exports.config = { transaction: false }` (house pattern: `migrations/20260531140936_performance_indexes_and_cleanup.js`).
- **Response contracts:**
  - Existing fields never change meaning.
  - New fields are additive.
  - Error codes follow backend#140: 4xx carries `code`, refusals use `HttpError(message, code, status)` or set `err.code`.
- **No production access.** Data checks run on the local snapshot `uprise_prod_1011` only, read-only or inside a transaction that is always rolled back.
- **Work** in the worktree `../.worktrees/backend-perf` on branch `perf/main-screens`, off `origin/master`. Never touch another session's checkout.
- **Commits:** Conventional Commits, authored by Fady Shawky, with no AI attribution. The PR carries `## Verification` and `## Deploy` sections.
- **Deploy is by hand:** `git pull origin master && pm2 reload Uprise`, after `npx knex migrate:latest` because Task 4 adds a migration. Merging deploys nothing.

## Review Focus

1. **The notifications cursor points at another user's row,** or at a deleted one. It must return an empty page, never someone else's rows. Pinned in Task 4, Step 1.
2. **Old app builds that send no `limit`.** They must get the newest 50 notifications, in the same `notifications` array, newest first. The badge count must come from `unread_count`, not from counting the page. Pinned in Task 4.
3. **A response with no `Content-Length`** (a streamed or `res.send` string body). The request log must fall back to today's redact-and-cap path, so sensitive keys stay redacted. Pinned in Task 1.
4. **A bulk schedule row with no `from_time` or an unparsable date.** It is never a duplicate, exactly as `findDuplicate` behaved. Pinned in Task 5.
5. **Two schedule rows for the same student and day in one batch.** Attendance must be auto-marked once, not twice, and a failure on one student must not stop the others. Pinned in Task 5.

---

### Task 1: The request log stops copying bodies it would truncate anyway

**Files:**
- Modify: `middlewares/request_log_middleware.js`. Add `logResponseBody` after `capField`, use it in the finish handler, and add it to `module.exports`.
- Create: `scripts/verify/check-request-log-cap.js`

**Interfaces:**
- Produces: `logResponseBody(body, contentLength) → object | null`, exported.

- [ ] **Step 1: Set up the worktree**

```bash
cd /Users/fadyshawky/Dev/uprise/backend
git fetch origin
git worktree add -b perf/main-screens ../.worktrees/backend-perf origin/master
cd ../.worktrees/backend-perf
ln -s /Users/fadyshawky/Dev/uprise/backend/node_modules node_modules
ln -s /Users/fadyshawky/Dev/uprise/backend/.env .env
```

The `.env` link points the verify scripts at the local database. Confirm it names the snapshot: `grep -c '^DB_NAME=uprise_prod_1011' .env` must print `1`. If it doesn't, prefix each DB-backed command below with `DB_NAME=uprise_prod_1011`.

- [ ] **Step 2: Write the failing check**

Create `scripts/verify/check-request-log-cap.js`:

```js
// Usage: node scripts/verify/check-request-log-cap.js
//
// The request log deep-copied (redactDeep) and stringified (capField) every
// response body after it was sent, on the event loop. For one user's
// notifications that is 26,423 rows / 4 MB (2026-10-11 snapshot), which
// stalled every request in flight behind it. A body over the cap is now
// recorded by size alone, without being walked.
const { logResponseBody } = require("../../middlewares/request_log_middleware");

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` -> ${detail}`}`);
}

// A body that throws if anything walks it.
const trap = new Proxy(
  {},
  {
    get() { throw new Error("walked"); },
    ownKeys() { throw new Error("walked"); },
  },
);
let r;
try {
  r = logResponseBody(trap, "10000000");
  check("an oversized body is recorded by size, not walked", r.__truncated === true && r.bytes === 10000000, JSON.stringify(r));
} catch (e) {
  check("an oversized body is recorded by size, not walked", false, e.message);
}

r = logResponseBody({ status: "success", data: { name: "Mona", password: "hunter2" } }, "60");
check("a small body is still redacted", r.data.name === "Mona" && r.data.password !== "hunter2", JSON.stringify(r));

r = logResponseBody({ data: { token: "abc" } }, undefined);
check("no Content-Length falls back to redact-and-cap", r.data.token !== "abc", JSON.stringify(r));

// Cost of the old path on a notifications-sized body, for the PR.
const rows = Array.from({ length: 26423 }, (_, i) => ({
  id: i, user_id: 1, type: "schedule", title: "Daily schedule updated",
  message: "Your child's schedule for today was updated.", read: i % 3 === 0,
  created_at: "2026-10-01T08:00:00.000Z", updated_at: "2026-10-01T08:00:00.000Z",
  icon: "calendar", background_color: "#F4F3FF", color: "#8481FD",
}));
const body = { status: "success", notifications: rows };
const bytes = Buffer.byteLength(JSON.stringify(body));
let t = process.hrtime.bigint();
logResponseBody(body, undefined);
const oldMs = Number(process.hrtime.bigint() - t) / 1e6;
t = process.hrtime.bigint();
logResponseBody(body, String(bytes));
const newMs = Number(process.hrtime.bigint() - t) / 1e6;
console.log(`      ${bytes} bytes: walked ${oldMs.toFixed(1)} ms, skipped ${newMs.toFixed(3)} ms`);
check("skipping is at least 100x cheaper", newMs * 100 < oldMs, `${oldMs} vs ${newMs}`);

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node scripts/verify/check-request-log-cap.js`
Expected: crash with `TypeError: logResponseBody is not a function`.

- [ ] **Step 4: Implement**

In `middlewares/request_log_middleware.js`, directly after the `capField` function, add:

```js
/**
 * The response body as the log stores it. A body the cap would truncate
 * anyway is recorded by size alone: redactDeep walks every node and capField
 * stringifies the copy, synchronously, after the response has gone, so one
 * user's notifications (26,423 rows, 4 MB on the 2026-10-11 snapshot) stalled
 * every request in flight behind it. res.json sets Content-Length, so the
 * size costs nothing. Without it (a streamed body) we redact and cap as before.
 */
function logResponseBody(body, contentLength) {
  const bytes = Number(contentLength);
  if (Number.isFinite(bytes) && bytes > MAX_FIELD_BYTES) {
    return { __truncated: true, bytes };
  }
  return capField(redactDeep(normalizeResponseBody(body)));
}
```

In the finish handler, replace the response-body assignment:

```js
        entry.response_body = omitPayloads
          ? { __omitted: "personal data" }
          : capField(redactDeep(normalizeResponseBody(capturedResponseBody)));
```

with:

```js
        entry.response_body = omitPayloads
          ? { __omitted: "personal data" }
          : logResponseBody(capturedResponseBody, res.getHeader?.("content-length"));
```

Add `logResponseBody,` to `module.exports`.

- [ ] **Step 5: Run the checks to verify they pass**

```bash
node scripts/verify/check-request-log-cap.js
node scripts/verify/check-whatsapp-request-log.js
node scripts/verify/check-routes-load.js
```

Expected:
- `all checks passed`. Note the printed "walked … ms" figure for the PR.
- The existing WhatsApp request-log check still passes.
- `all route files load`.

- [ ] **Step 6: Commit**

```bash
git add middlewares/request_log_middleware.js scripts/verify/check-request-log-cap.js
git commit -m "perf(request-log): record an oversized body by size instead of copying it"
```

---

### Task 2: `authenticateReq` writes `app_version` only when it changed

**Files:**
- Modify: `middlewares/auth_middleware.js`. Add `shouldRecordAppVersion`, use it after the `Promise.all` that loads `user`, and export it.
- Create: `scripts/verify/check-app-version-write.js`

**Interfaces:**
- Produces: `shouldRecordAppVersion(user, appVersion) → boolean`, exported.

- [ ] **Step 1: Write the failing check**

Create `scripts/verify/check-app-version-write.js`:

```js
// Usage: node scripts/verify/check-app-version-write.js
//
// authenticateReq rewrote users.app_version on every request that sent a
// `version` header: a dozen UPDATEs of one row when the parent app's Home
// loads, each holding a pool connection. It now writes only on a change.
const { shouldRecordAppVersion } = require("../../middlewares/auth_middleware");

let failures = 0;
function check(label, ok) {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

check("same version: no write", shouldRecordAppVersion({ app_version: "6.0.2" }, "6.0.2") === false);
check("new version: write", shouldRecordAppVersion({ app_version: "6.0.1" }, "6.0.2") === true);
check("first version: write", shouldRecordAppVersion({ app_version: null }, "6.0.2") === true);
check("no header: no write", shouldRecordAppVersion({ app_version: "6.0.2" }, undefined) === false);
check("no user: no write", shouldRecordAppVersion(undefined, "6.0.2") === false);

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-app-version-write.js`
Expected: crash with `TypeError: shouldRecordAppVersion is not a function`.

- [ ] **Step 3: Implement**

In `middlewares/auth_middleware.js`, above `authenticateReq`, add:

```js
// The version header rides on every request. Writing it every time meant a
// dozen UPDATEs of the same users row whenever an app screen loaded, each
// holding a pool connection; the row only needs it when the version moves.
function shouldRecordAppVersion(user, appVersion) {
  return Boolean(appVersion) && Boolean(user) && user.app_version !== appVersion;
}
```

Replace:

```js
    if (appVersion) {
      userModel.setAppVersion(result.decoded.id, appVersion).catch(() => {});
    }
```

with:

```js
    if (shouldRecordAppVersion(user, appVersion)) {
      userModel.setAppVersion(result.decoded.id, appVersion).catch(() => {});
    }
```

Add `shouldRecordAppVersion` to the `module.exports` object, next to `authenticateReq`.

- [ ] **Step 4: Run the checks to verify they pass**

```bash
node scripts/verify/check-app-version-write.js
node scripts/verify/check-routes-load.js
```

Expected: `all checks passed`, then `all route files load`.

- [ ] **Step 5: Commit**

```bash
git add middlewares/auth_middleware.js scripts/verify/check-app-version-write.js
git commit -m "perf(auth): write users.app_version only when the version changes"
```

---

### Task 3: One Google Cloud Storage client per process

**Files:**
- Modify: `services/gallery_services/google_cloud_storage.js`. Add a module-level `sharedStorage`; the constructor uses it.
- Create: `scripts/verify/check-gcs-client-shared.js`

**Interfaces:**
- Produces: every `CloudStorage` instance has the same `.storage` object. The public API is unchanged.

- [ ] **Step 1: Write the failing check**

Create `scripts/verify/check-gcs-client-shared.js`:

```js
// Usage: node scripts/verify/check-gcs-client-shared.js
//
// A Storage client fetches an OAuth access token on first use and caches it.
// Building one per request (11 call sites) paid that exchange on every upload:
// POST /photo/confirm-upload p50 751 ms on the 2026-10-11 snapshot. No network
// is touched here; constructing clients is local.
const CloudStorage = require("../../services/gallery_services/google_cloud_storage");

const a = new CloudStorage();
const b = new CloudStorage("utils");
const ok = a.storage === b.storage;
console.log(`${ok ? "PASS" : "FAIL"}  every CloudStorage shares one Storage client`);
process.exit(ok ? 0 : 1);
```

Check the export name before running: `grep -n "module.exports" services/gallery_services/google_cloud_storage.js`. If it exports an object (for example `{ CloudStorage }`), change the require line to destructure it.

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-gcs-client-shared.js`
Expected: `FAIL  every CloudStorage shares one Storage client`, exit 1.

- [ ] **Step 3: Implement**

In `services/gallery_services/google_cloud_storage.js`, above `class CloudStorage`, add:

```js
// One client for the process. A Storage client exchanges the service account
// for an OAuth token on first use and caches it; a client per request paid
// that round-trip on every upload (confirm-upload p50 751 ms, 2026-10-11).
const sharedStorage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_STORAGE_PROJECT_ID,
  credentials: serviceAccount,
});
```

and replace the constructor body's client creation:

```js
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_STORAGE_PROJECT_ID,
      credentials: serviceAccount,
    });
```

with:

```js
    this.storage = sharedStorage;
```

- [ ] **Step 4: Run the checks to verify they pass**

```bash
node scripts/verify/check-gcs-client-shared.js
node scripts/verify/check-media-keys.js
node scripts/verify/check-routes-load.js
```

Expected: `PASS …`, `all checks passed`, `all route files load`.

- [ ] **Step 5: Commit**

```bash
git add services/gallery_services/google_cloud_storage.js scripts/verify/check-gcs-client-shared.js
git commit -m "perf(gallery): share one Storage client so uploads stop re-authenticating"
```

---

### Task 4: Notifications come in pages, with the unread count alongside

**Files:**
- Create: `migrations/20261016090000_notifications_unread_index.js`
- Modify: `models/notification.js`. Add `getNotificationsPage` and `countUnread`, and keep `getNotifications` for any other caller.
- Modify: `services/notification_services/notification_service.js`. `getNotifications` returns `{ notifications, unread_count, has_more }`.
- Modify: `validators/notification_validator.js`. Add `validateListNotifications`.
- Modify: `routes/notification_routes.js`. Use it on `GET /notifications`.
- Modify: `controllers/notification_controller.js`. Send `unread_count` and `has_more` alongside `notifications`.
- Create: `scripts/verify/check-notifications-page.js`

**Interfaces:**
- Produces:
  - `GET /api/notifications?limit=1..100&before_id=<id>` → `{ status: "success", notifications: Notification[] (newest first, ≤ limit, default 50), unread_count: number, has_more: boolean }`.
  - `before_id` is the `id` of the last notification the client holds.
  - Plans 5 and 6 page the apps' notification screens with this, and the staff app's badge reads `unread_count`.

- [ ] **Step 1: Write the failing check**

Create `scripts/verify/check-notifications-page.js`:

```js
// Usage: node scripts/verify/check-notifications-page.js   (DB_NAME=uprise_prod_1011)
//
// GET /notifications returned a user's entire history: p90 user 3,748 rows,
// busiest 26,423 (4 MB, a 600 ms on-disk sort). It now returns pages of 50
// with the unread count beside them. Read-only.
const { Model } = require("objection");
const { knex, done } = require("./_knex");
Model.knex(knex);
const service = require("../../services/notification_services/notification_service");

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` -> ${detail}`}`);
}

(async () => {
  const [{ user_id, n }] = (
    await knex.raw("SELECT user_id, count(*)::int AS n FROM notifications GROUP BY 1 ORDER BY 2 DESC LIMIT 1")
  ).rows;
  const unread = (await knex.raw("SELECT count(*)::int AS c FROM notifications WHERE user_id = ? AND read = false", [user_id])).rows[0].c;

  let t = Date.now();
  const first = await service.getNotifications({ user_id });
  const firstMs = Date.now() - t;
  check("default page is 50", first.notifications.length === 50, first.notifications.length);
  check("has_more on a long history", first.has_more === true);
  check("unread_count counts the whole history", first.unread_count === unread, `${first.unread_count} vs ${unread}`);
  const sorted = first.notifications.every((x, i, a) => i === 0 || new Date(a[i - 1].created_at) >= new Date(x.created_at));
  check("newest first", sorted);
  console.log(`      busiest user (${n} rows): first page in ${firstMs} ms`);

  const last = first.notifications[first.notifications.length - 1];
  const second = await service.getNotifications({ user_id, limit: 50, before_id: last.id });
  const overlap = second.notifications.some((x) => first.notifications.some((y) => y.id === x.id));
  check("the second page continues without overlap", second.notifications.length === 50 && !overlap);
  check("the second page is older", new Date(second.notifications[0].created_at) <= new Date(last.created_at));

  const [{ id: foreignId }] = (await knex.raw("SELECT id FROM notifications WHERE user_id <> ? LIMIT 1", [user_id])).rows;
  const foreign = await service.getNotifications({ user_id, limit: 50, before_id: foreignId });
  check("a cursor from another user's row returns nothing", foreign.notifications.length === 0 && foreign.has_more === false);

  const none = await service.getNotifications({ user_id: -1 });
  check("a user with no notifications", none.notifications.length === 0 && none.unread_count === 0 && none.has_more === false);

  console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
  await done(failures === 0);
})().catch(async (e) => {
  console.error(e);
  await done(false);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-notifications-page.js`
Expected: `FAIL  default page is 50 -> undefined`. Today the service returns a bare array, so `.notifications` is undefined. The run exits 1.

- [ ] **Step 3: Write the migration**

Create `migrations/20261016090000_notifications_unread_index.js`:

```js
// The unread badge counts a user's unread notifications on every list call
// now that the list is paged. A partial index keeps that count to the unread
// rows only. CONCURRENTLY so the live table isn't locked while it builds.
exports.config = { transaction: false };

exports.up = (knex) =>
  knex.raw(
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read = false",
  );

exports.down = (knex) =>
  knex.raw("DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_user_unread");
```

- [ ] **Step 4: Implement the model**

In `models/notification.js`, below `getNotifications`, add:

```js
  /**
   * One page, newest first. `before_id` is the last row the client holds; the
   * subquery is bound to the same user, so another user's id yields no rows.
   * One extra row is read to know whether a further page exists.
   */
  static getNotificationsPage({ user_id, limit, before_id }) {
    const query = Notification.query()
      .select("*")
      .where("user_id", user_id)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .limit(limit + 1);
    if (before_id) {
      query.whereRaw(
        "(created_at, id) < (SELECT created_at, id FROM notifications WHERE id = ? AND user_id = ?)",
        [before_id, user_id],
      );
    }
    return query;
  }

  static countUnread(user_id) {
    return Notification.query().where({ user_id, read: false }).resultSize();
  }
```

- [ ] **Step 5: Implement the service**

In `services/notification_services/notification_service.js`, replace `getNotifications`:

```js
/**
 * Gets notifications for a user with pagination
 * @param {Object} params - Query parameters
 */
async function getNotifications(params) {
  try {
    return await Notification.getNotifications(params);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
```

with:

```js
/**
 * One page of a user's notifications, newest first, with the unread count for
 * the whole history (the staff app's badge counted the full list it used to
 * receive). Old app builds send no limit and get the newest 50.
 */
async function getNotifications({ user_id, limit = 50, before_id = null }) {
  const [rows, unread_count] = await Promise.all([
    Notification.getNotificationsPage({ user_id, limit, before_id }),
    Notification.countUnread(user_id),
  ]);
  return {
    notifications: rows.slice(0, limit),
    unread_count,
    has_more: rows.length > limit,
  };
}
```

Before moving on, confirm there is no other caller: `grep -rn "getNotifications(" services controllers helpers jobs`. The only callers should be the controller and this service. If another appears, keep the old array-returning function under a new name for it.

- [ ] **Step 6: Validator, route and controller**

In `validators/notification_validator.js`, add, and export it in the existing `module.exports`:

```js
const validateListNotifications = (req, res, next) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    before_id: Joi.number().integer().positive(),
  });
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: error.details[0].message,
    });
  }
  req.notificationsQuery = value;
  next();
};
```

In `routes/notification_routes.js`:
- Add `validateListNotifications` to the destructured import from `../validators/notification_validator`.
- Make the `GET /notifications` route:

```js
router.get(
  "/notifications",
  authenticateReq,
  validateListNotifications,
  notificationController.getNotifications
);
```

In `controllers/notification_controller.js`, replace the body of `getNotifications`'s `try`:

```js
    const notifications = await notificationService.getNotifications({
      user_id: req.user.id,
    });

    return res.status(200).json({
      status: "success",
      notifications: notifications,
    });
```

with:

```js
    const { notifications, unread_count, has_more } =
      await notificationService.getNotifications({
        user_id: req.user.id,
        ...req.notificationsQuery,
      });

    return res.status(200).json({
      status: "success",
      notifications,
      unread_count,
      has_more,
    });
```

- [ ] **Step 7: Apply the migration to the snapshot and run the checks**

```bash
npx knex migrate:latest
node scripts/verify/check-notifications-page.js
psql -d uprise_prod_1011 -X -A -t -c "explain analyze select * from notifications where user_id = (select user_id from notifications group by 1 order by count(*) desc limit 1) order by created_at desc, id desc limit 51" | grep -E "Execution|Sort Method"
node scripts/verify/check-routes-load.js
```

Expected:
- The migration reports `Batch N run: 1 migrations`.
- `all checks passed`. The first page of the busiest user prints well under 50 ms. Note the figure for the PR.
- `Execution Time` is under 5 ms, with no `external merge`. Before this plan it was 600 ms with `Sort Method: external merge`.
- `all route files load`.

- [ ] **Step 8: Commit**

```bash
git add migrations/20261016090000_notifications_unread_index.js models/notification.js services/notification_services/notification_service.js validators/notification_validator.js routes/notification_routes.js controllers/notification_controller.js scripts/verify/check-notifications-page.js
git commit -m "perf(notifications): page the list and send the unread count beside it"
```

---

### Task 5: Bulk schedule batches its lookups

**Files:**
- Create: `helpers/map_with_limit.js`
- Modify: `models/schedule.js`. Add `findExistingKeys`.
- Modify: `services/report_services/schedule_service.js`. In `createSchedule`, replace step 1's per-row `findDuplicate` loop with one lookup, and replace step 4's per-row auto-mark loop with one call per student and day, four at a time. Add a `scheduleDay` helper next to `scheduleKey`.
- Modify: `helpers/notification_helper.js`. In `notifyNewSchedule`, replace the per-parent `User.query().findById(...)` with one lookup before the loop.
- Create: `scripts/verify/check-bulk-schedule.js`

**Interfaces:**
- Produces:
  - `Schedule.findExistingKeys(lookups: {student_id, activity_id, date}[]) → Promise<Set<string>>`. Keys are in `scheduleKey`'s format, `student|activity|YYYY-MM-DD|HH:MM`.
  - `mapWithLimit(items, limit, fn) → Promise<results[]>`.
  - The responses of `POST /api/bulk-schedule` and `POST /api/schedule` are unchanged.

- [ ] **Step 1: Write the failing check**

Create `scripts/verify/check-bulk-schedule.js`:

```js
// Usage: node scripts/verify/check-bulk-schedule.js   (DB_NAME=uprise_prod_1011)
//
// POST /bulk-schedule (p95 728 ms) looked up duplicates one row at a time,
// fetched each parent's push token one at a time, and auto-marked attendance
// once per created row, in sequence. Runs the real service on a real class in
// one transaction that is always rolled back; push sending is stubbed.
const { Model } = require("objection");
const { knex, done } = require("./_knex");

const notificationService = require("../../services/notification_services/notification_service");
notificationService.queueNotification = () => {};
const { mapWithLimit } = require("../../helpers/map_with_limit");
const scheduleService = require("../../services/report_services/schedule_service");

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` -> ${detail}`}`);
}

(async () => {
  const order = [];
  await mapWithLimit([3, 1, 2], 2, async (ms) => { await new Promise((r) => setTimeout(r, ms)); order.push(ms); });
  check("mapWithLimit runs every item", order.length === 3);

  const ROLLBACK = new Error("rollback");
  await knex.transaction(async (trx) => {
    Model.knex(trx);
    let queries = 0;
    trx.on("query", () => { queries += 1; });

    const [{ class_id }] = (await trx.raw(
      "SELECT class_id FROM student WHERE deleted_at IS NULL AND class_id IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC LIMIT 1")).rows;
    const students = (await trx.raw("SELECT id FROM student WHERE class_id = ? AND deleted_at IS NULL ORDER BY id LIMIT 20", [class_id])).rows;
    const activities = (await trx.raw("SELECT id FROM activity ORDER BY id LIMIT 2")).rows;
    const date = "2026-10-14"; // a Wednesday after the snapshot's last day: no existing rows, a working day
    const items = students.flatMap((s) => activities.map((a, i) => ({
      student_id: s.id, activity_id: a.id, date, from_time: i === 0 ? "09:00" : "10:00",
    })));
    items.push({ student_id: students[0].id, activity_id: activities[0].id, date, from_time: null });

    queries = 0;
    const t = Date.now();
    const first = await scheduleService.createSchedule(items, null);
    const firstQueries = queries;
    console.log(`      ${items.length} rows: ${firstQueries} queries, ${Date.now() - t} ms`);
    check("every row created (no from_time is never a duplicate)", first.schedule.length === items.length, first.schedule.length);
    check("at most 160 queries for 41 rows", firstQueries <= 160, firstQueries);

    const marked = (await trx.raw(
      "SELECT count(*)::int AS c FROM student_attendance WHERE date = ? AND student_id = ANY(?)", [date, students.map((s) => s.id)])).rows[0].c;
    check("attendance auto-marked once per student", marked === students.length, `${marked} vs ${students.length}`);

    queries = 0;
    const again = await scheduleService.createSchedule(items.filter((i) => i.from_time), null);
    check("a repeat batch is all duplicates", again.schedule.length === 0 && again.skipped_duplicates === items.length - 1, JSON.stringify({ c: again.schedule.length, s: again.skipped_duplicates }));
    check("the duplicate check is one query", queries <= 8, queries);

    throw ROLLBACK;
  }).catch((e) => { if (e.message !== "rollback") throw e; });

  console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
  await done(failures === 0);
})().catch(async (e) => { console.error(e); await done(false); });
```

2026-10-14 has no rows on the snapshot (its last day is 2026-10-11) and is a working day, so auto-marking runs; the transaction is rolled back regardless. If the class's branch has a special day then, pick the next Wednesday and record the ruling.

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-bulk-schedule.js`
Expected: crash with `Cannot find module '../../helpers/map_with_limit'`.

Then, so the before figure can be recorded, temporarily comment out the `mapWithLimit` require and the first `check`, and run again. Expected: `FAIL  at most 160 queries for 41 rows`. Note the printed query count and milliseconds (the before figure). A failure on "the duplicate check is one query" also confirms the per-row lookup. Restore both lines.

- [ ] **Step 3: Write `mapWithLimit`**

Create `helpers/map_with_limit.js`:

```js
"use strict";

/**
 * Run fn over items with at most `limit` in flight. Writes that each touch
 * their own rows (one student's attendance) are safe to overlap; the pool
 * (max 25) is shared with every other request, so the bound stays small.
 */
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

module.exports = { mapWithLimit };
```

- [ ] **Step 4: Add `findExistingKeys` to the model**

In `models/schedule.js`, below `findDuplicate`, add:

```js
  /**
   * Which of these (student, activity, day) rows already exist, as
   * scheduleKey strings ("student|activity|YYYY-MM-DD|HH:MM"). One query for
   * a whole batch; findDuplicate is kept for the single-row path, which
   * returns the duplicate itself.
   */
  static async findExistingKeys(lookups) {
    if (lookups.length === 0) return new Set();
    const rows = await Schedule.query()
      .select("student_id", "activity_id")
      .select(Schedule.raw("to_char(date, 'YYYY-MM-DD') AS day"))
      .select(Schedule.raw("substring(from_time::text, 1, 5) AS hhmm"))
      .whereIn(
        ["student_id", "activity_id", "date"],
        lookups.map((l) => [l.student_id, l.activity_id, l.date]),
      )
      .whereNull("deleted_at");
    return new Set(rows.map((r) => `${r.student_id}|${r.activity_id}|${r.day}|${r.hhmm}`));
  }
```

- [ ] **Step 5: Use it in the service, and auto-mark once per student and day**

In `services/report_services/schedule_service.js`:
- Add `const { mapWithLimit } = require("../../helpers/map_with_limit");` with the other requires.
- Below `scheduleKey`, add:

```js
/** A schedule row's day as YYYY-MM-DD, or null — the same parse findDuplicate uses. */
function scheduleDay(d) {
  if (typeof d === "string") return (d.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  if (d instanceof Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}
```

Replace step 1, from `// Step 1: Detect duplicates (both in-batch and database)` through the end of its `for` loop, with:

```js
  // Step 1: Detect duplicates (in-batch and database). One query for the
  // whole batch: the per-row lookup ran a query per row, one after another.
  // A row with no from_time or no parsable date is never a duplicate, as
  // findDuplicate decided.
  const dbKeys = await scheduleModel.findExistingKeys(
    items
      .filter((i) => i.from_time && scheduleDay(i.date))
      .map((i) => ({ student_id: i.student_id, activity_id: i.activity_id, date: scheduleDay(i.date) })),
  );
  for (const item of items) {
    const key = scheduleKey(item);
    if (seenInBatch.has(key)) {
      existing.push(null);
      continue;
    }
    if (item.from_time && scheduleDay(item.date) && dbKeys.has(key)) {
      // The single-row endpoint returns the duplicate itself; a bulk call only counts it.
      existing.push(
        isBulk
          ? true
          : await scheduleModel.findDuplicate(item.student_id, item.activity_id, item.date, item.from_time),
      );
    } else {
      seenInBatch.add(key);
      toCreate.push(item);
    }
  }
```

Replace step 4, from `// Step 4: Auto-mark attendance for each created schedule (non-blocking)` through the end of its `for` loop, with:

```js
    // Step 4: Auto-mark attendance once per student and day (non-blocking).
    // A class's bulk schedule has a row per student per activity, and each
    // re-ran the same lookups for the same attendance row, in sequence.
    const studentDays = new Map();
    for (const schedule of createdList) {
      const date = scheduleDay(schedule.date) ?? schedule.date;
      studentDays.set(`${schedule.student_id}|${date}`, { student_id: schedule.student_id, date });
    }
    await mapWithLimit([...studentDays.values()], 4, async (day) => {
      try {
        // Only pass marked_by if we have a staff_id (don't pass null)
        await StudentAttendanceService.autoMarkFromSchedule(
          markedByStaffId ? { ...day, marked_by: markedByStaffId } : day,
        );
      } catch (error) {
        console.error("Error auto-marking attendance from schedule:", error);
        // Don't fail schedule creation if attendance marking fails
      }
    });
```

- [ ] **Step 6: One push-token lookup per batch**

In `helpers/notification_helper.js`, in `notifyNewSchedule`, directly before `for (const parent of parentRecords) {`, add:

```js
    // Every parent's push token in one query, not one query per parent.
    const parentUserIds = parentRecords.map((p) => p.user_id).filter(Boolean);
    const fcmTokens = new Map(
      (parentUserIds.length
        ? await User.query().whereIn("id", parentUserIds).select("id", "fcm_token")
        : []
      ).map((u) => [u.id, u.fcm_token]),
    );
```

Inside the loop, replace:

```js
      const user = await User.query()
        .findById(parent.user_id)
        .select("fcm_token");
```

with:

```js
      const fcm_token = fcmTokens.get(parent.user_id);
```

In the `notificationData` literal and the `queueNotification` call, replace `fcm_token: user?.fcm_token,` with `fcm_token,`, and replace `!!user?.fcm_token` with `!!fcm_token`.

- [ ] **Step 7: Run the checks to verify they pass**

```bash
node scripts/verify/check-bulk-schedule.js
node scripts/check_schedule_class_scope.js
node scripts/check_schedule_class_scope_edges.js
node scripts/verify/check-error-codes.js
node scripts/verify/check-routes-load.js
```

Expected:
- `all checks passed`. Note the printed query count and milliseconds against Step 2's before figure.
- `All checks passed.` and `All edge checks passed.`
- `all user-facing errors carry a status and a code`.
- `all route files load`.

- [ ] **Step 8: Commit**

```bash
git add helpers/map_with_limit.js models/schedule.js services/report_services/schedule_service.js helpers/notification_helper.js scripts/verify/check-bulk-schedule.js
git commit -m "perf(schedule): check a bulk schedule's duplicates and push tokens in one query each"
```

---

### Task 6: A refresh deactivates only the sessions that are still active

**Files:**
- Modify: `models/session.js`. `cleanupExpiredSessions` adds `is_active = true`.
- Create: `scripts/verify/check-session-cleanup.js`

**Interfaces:**
- Produces: the same behaviour: expired sessions end inactive. Fewer rows are rewritten per refresh.

- [ ] **Step 1: Write the failing check**

Create `scripts/verify/check-session-cleanup.js`:

```js
// Usage: node scripts/verify/check-session-cleanup.js   (DB_NAME=uprise_prod_1011)
//
// Every login and refresh ran UPDATE sessions SET is_active=false for ALL of
// the user's expired sessions, including the ones already inactive, so each
// refresh rewrote the user's whole expired history. Rolled back.
const { Model } = require("objection");
const { knex, done } = require("./_knex");
const Session = require("../../models/session");

(async () => {
  let ok = false;
  await knex.transaction(async (trx) => {
    Model.knex(trx);
    const [{ user_id }] = (await trx.raw(
      "SELECT user_id FROM sessions WHERE expires_at < now() GROUP BY 1 ORDER BY count(*) DESC LIMIT 1")).rows;
    const stillActive = (await trx.raw(
      "SELECT count(*)::int AS c FROM sessions WHERE user_id = ? AND expires_at < now() AND is_active", [user_id])).rows[0].c;
    const touched = await Session.cleanupExpiredSessions(user_id, trx);
    const left = (await trx.raw(
      "SELECT count(*)::int AS c FROM sessions WHERE user_id = ? AND expires_at < now() AND is_active", [user_id])).rows[0].c;
    ok = touched === stillActive && left === 0;
    console.log(`${ok ? "PASS" : "FAIL"}  rewrote ${touched} rows; ${stillActive} were still active; ${left} left active`);
    throw new Error("rollback");
  }).catch((e) => { if (e.message !== "rollback") throw e; });
  await done(ok);
})().catch(async (e) => { console.error(e); await done(false); });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify/check-session-cleanup.js`
Expected: `FAIL  rewrote <many> rows; <fewer> were still active; 0 left active`.

- [ ] **Step 3: Implement**

In `models/session.js`, replace:

```js
    return await Session.query(trx)
      .where({ user_id })
      .where("expires_at", "<", new Date())
      .update({ is_active: false });
```

with:

```js
    // Only the expired sessions still marked active: the rest are already
    // inactive, and rewriting them on every login and refresh was pure churn.
    return await Session.query(trx)
      .where({ user_id, is_active: true })
      .where("expires_at", "<", new Date())
      .update({ is_active: false });
```

- [ ] **Step 4: Run the checks to verify they pass**

```bash
node scripts/verify/check-session-cleanup.js
node scripts/verify/check-routes-load.js
```

Expected: `PASS  rewrote N rows; N were still active; 0 left active`, then `all route files load`.

- [ ] **Step 5: Commit**

```bash
git add models/session.js scripts/verify/check-session-cleanup.js
git commit -m "perf(auth): a refresh deactivates only the expired sessions still marked active"
```

---

### Task 7: The before/after query, and the PR

**Files:**
- Create: `scripts/verify/endpoint-latency.sql`

**Interfaces:**
- Produces: the query that compares p50, p90 and p95 per endpoint shape for any period of `request_logs`. The same shapes as the baseline are used here and in Plans 5–7.

- [ ] **Step 1: Write the query**

Create `scripts/verify/endpoint-latency.sql`:

```sql
-- p50/p90/p95 per endpoint and query shape, from request_logs.
-- Usage: psql -d <db> -v since="'2026-10-20'" -v until="'2026-10-27'" -f scripts/verify/endpoint-latency.sql
-- Run on a snapshot (or a read replica), never as a write. Compare a week
-- before the deploy with a week after; the shapes match the 2026-10 baseline
-- (docs/audits/2026-10-smoothness-baseline.md in design-tokens).
WITH r AS (
  SELECT method,
         regexp_replace(split_part(request_url, '?', 1), '/[0-9]+(?=/|$)', '/:id', 'g') AS route,
         regexp_replace(split_part(request_url, '?', 2), '=[^&]*', '', 'g') AS params,
         duration_ms
  FROM request_logs
  WHERE duration_ms IS NOT NULL
    AND response_status < 400
    AND created_at >= :since::timestamptz
    AND created_at < :until::timestamptz
)
SELECT method, route, params, count(*) AS n,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms)::int AS p50,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY duration_ms)::int AS p90,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::int AS p95
FROM r
GROUP BY 1, 2, 3
HAVING count(*) >= 15
ORDER BY p95 DESC
LIMIT 30;
```

- [ ] **Step 2: Run it on the snapshot as the "before"**

Run: `psql -d uprise_prod_1011 -v since="'2026-09-28'" -v until="'2026-10-12'" -f scripts/verify/endpoint-latency.sql`
Expected: a table led by `GET /api/notifications` (p95 730), `GET /api/schedule date&student_id` (657), `GET /api/event month&class_id` (626) and `GET /api/student date&class_id` (573). Paste it into the PR as **Before**.

- [ ] **Step 3: Commit, push, PR**

```bash
git add scripts/verify/endpoint-latency.sql
git commit -m "chore(verify): the per-endpoint latency query for before/after comparisons"
git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/backend.git HEAD:refs/heads/perf/main-screens
```

Write the PR body to the session scratchpad with a quoted heredoc, then `gh pr create -R upriseEdu-tech/backend --base master --head perf/main-screens --title "perf: unstall the main screens (notifications paging, request-log copies, auth writes, uploads, bulk schedule)" --body-file <path>`. The body has:
- `## Why`: the snapshot evidence. The SQL takes about 1 ms. Per-request overhead and event-loop stalls do not. Include the busiest user's 26,423-row, 4 MB notifications.
- `## What`: one line per task.
- `## Verification`: each check's literal output, with Task 1's "walked … ms", Task 4's first-page ms and EXPLAIN, Task 5's before and after queries and ms, and the Before table from Step 2.
- `## Deploy`:

  ```bash
  cd /app/backend && git pull origin master && npx knex migrate:latest && pm2 reload Uprise
  ```

  The migration builds one index `CONCURRENTLY`. Responses only gain fields. Old app builds get the newest 50 notifications.
- `## After`: run `scripts/verify/endpoint-latency.sql` on the next snapshot, a week after deploy, and paste it into Plan 8's release notes.

Don't merge. The owner merges and deploys.

---

## Found while planning, not in this plan

- **`GET /api/event?month=` ignores the year.** `models/event.js` filters `EXTRACT(MONTH FROM date) = ?` only, so October shows every October's events. It's a correctness bug, not a speed one. The fix needs the apps to send `year`. Plan 6 (parent app) and Plan 5 (staff app) carry it when their calendar screens are swept.
- **No pagination defaults on several lists.** Schedule, album, event, activity, pickup, report and video accept no `page`/`limit` and then return every row. Today's data is small (day- or class-scoped), so this plan doesn't cap them. Revisit if `request_logs` shows a list growing.
