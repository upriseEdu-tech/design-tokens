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
