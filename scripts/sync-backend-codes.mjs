// Collects every error code the backend can send, for the catalogue parity
// test (test/catalogue-codes.test.js). Run it whenever the backend gains a
// code, and commit what it writes:
//   node scripts/sync-backend-codes.mjs ../backend
// A code is any quoted SCREAMING_SNAKE literal with an underscore in the
// backend's services, middlewares, controllers and helpers. The few that
// aren't error codes, or never reach the apps, are listed below with why.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NOT_FOR_THE_APPS = {
  ATTENDANCE_CHECK_IN: 'notification type',
  ATTENDANCE_CHECK_OUT: 'notification type',
  EVENT_RECEIVED: 'WhatsApp webhook acknowledgement',
  PARTIALLY_PAID: 'invoice status',
  LIMIT_FILE_SIZE: 'upload-limit name the controllers compare against',
  FETCH_SESSIONS_ERROR: 'sent with a 500, which reads as a server error',
  LOGOUT_ERROR: 'sent with a 500',
  SESSION_TERMINATION_ERROR: 'sent with a 500',
  QR_GEOFENCE_MISCONFIGURED: 'sent with a 500',
  INVALID_API_KEY: 'public website API: its own documented contract',
  MISSING_API_KEY: 'public website API',
  ORIGIN_NOT_ALLOWED: 'public website API',
  NURSERY_UNAVAILABLE: 'public website API',
  NO_ACTIVE_KEY: 'public website API key lookup',
};

const backend = process.argv[2];
if (!backend) {
  console.error('usage: node scripts/sync-backend-codes.mjs <path to the backend checkout>');
  process.exit(2);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return name.endsWith('.js') ? [path] : [];
  });

const codes = new Set();
for (const dir of ['services', 'middlewares', 'controllers', 'helpers']) {
  for (const file of walk(join(backend, dir))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/(?<![\w.])["'`]([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)["'`]/g)) {
      if (!(m[1] in NOT_FOR_THE_APPS)) codes.add(m[1]);
    }
  }
}

const head = execFileSync('git', ['-C', backend, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const out = { source: `upriseEdu-tech/backend@${head}`, codes: [...codes].sort() };
writeFileSync(new URL('../test/fixtures/backend-codes.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${out.codes.length} codes from ${out.source}`);
