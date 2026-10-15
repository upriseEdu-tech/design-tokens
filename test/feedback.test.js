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

test('a code named like an Object.prototype key is not a known code', () => {
  const text = feedbackForError('en', { code: 'constructor', status: 400 }, 'save', 'album');
  assert.equal(text, "Couldn't save the album. Try again.");
});

test('code families: *_NOT_FOUND, session and permission codes', () => {
  const en = FeedbackMessages.en;
  assert.equal(feedbackForError('en', { code: 'PICKUP_NOT_FOUND', status: 404 }, 'save', 'pickupRequest'), en.error.notFound);
  assert.equal(feedbackForError('en', { code: 'TOKEN_EXPIRED', status: 401 }, 'save', 'album'), en.error.sessionEnded);
  assert.equal(feedbackForError('en', { code: 'STAFF_ID_MISMATCH', status: 403 }, 'save', 'album'), en.error.permission);
});

// Review I4: this runs on the error path (an axios interceptor), so a throw
// here means no message at all. Bad input degrades to English and to whole
// sentences, never to an exception or a sentence with a hole in it.
test('feedbackForError never throws and never leaves a hole', () => {
  const en = FeedbackMessages.en;
  assert.equal(feedbackForError('en-US', { status: 403 }, 'save', 'album'), en.error.permission);
  assert.equal(feedbackForError(undefined, {}, 'save', 'album'), "Couldn't save the album. Try again.");
  assert.equal(feedbackForError('en', { code: 42, status: 409 }, 'save', 'album'), "Couldn't save the album. Try again.");
  assert.equal(feedbackForError('en', { code: 'BRAND_NEW' }, 'frobnicate', 'album'), en.error.unknown);
  assert.equal(feedbackForError('en', { code: 'BRAND_NEW' }, 'save', 'widget'), en.error.unknown);
  assert.equal(feedbackForError('en', undefined, 'save', 'album'), "Couldn't save the album. Try again.");
});

test('feedbackForSuccess never throws and never leaves a hole', () => {
  assert.equal(feedbackForSuccess('fr', 'saved', 'album'), 'Album saved.');
  assert.equal(feedbackForSuccess('en', 'saved', 'widget'), FeedbackMessages.en.success.done);
  assert.equal(feedbackForSuccess('en', 'frobnicated', 'album'), FeedbackMessages.en.success.done);
});
