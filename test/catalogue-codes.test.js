// Every code the backend can send reads as a sentence that fits it (spec
// §4.1, §4.3). The list is generated from the backend's source by
// scripts/sync-backend-codes.mjs, not copied by hand: a hand copy of the
// catalogue's own keys could never fail. A new backend code fails this test
// until it has text here, either its own or one of the families'.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FeedbackMessages,
  SessionErrorCodes,
  PermissionErrorCodes,
  AccountSetupErrorCodes,
  ValidationErrorCodes,
} = require('../dist/cjs');
const { codes } = require('./fixtures/backend-codes.json');

const families = [SessionErrorCodes, PermissionErrorCodes, AccountSetupErrorCodes, ValidationErrorCodes];
const worded = (code) =>
  Object.prototype.hasOwnProperty.call(FeedbackMessages.en.errors, code) ||
  families.some((family) => (family || []).includes(code)) ||
  code === 'NOT_FOUND' ||
  code.endsWith('_NOT_FOUND');

test('every backend code is worded by its own entry or a family', () => {
  assert.deepEqual(codes.filter((c) => !worded(c)), []);
});

test('the families never overlap, so a code has one meaning', () => {
  const seen = new Map();
  for (const family of families) {
    for (const code of family || []) {
      assert.ok(!seen.has(code), `${code} is in two families`);
      assert.ok(!(code in FeedbackMessages.en.errors), `${code} has its own entry and a family`);
      seen.set(code, true);
    }
  }
});
