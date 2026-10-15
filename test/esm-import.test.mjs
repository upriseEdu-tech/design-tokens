// The package's "import" entry must load in plain Node, not only in bundlers:
// the dashboard's node --test suites import it (Plan 7). tsc copies import
// specifiers verbatim, so './colors' (no extension) loaded in Vite and Metro
// but threw ERR_MODULE_NOT_FOUND in Node (0.7.0).
import test from 'node:test';
import assert from 'node:assert/strict';

test('the ESM build loads in plain Node', async () => {
  const esm = await import('../dist/esm/index.js');
  assert.equal(typeof esm.feedbackForError, 'function');
  assert.equal(esm.IconConcepts.pickup, 'car');
});

test('the dashboard items, actions and success kinds exist in both languages', async () => {
  const { FeedbackMessages, feedbackForSuccess } = await import('../dist/esm/index.js');
  for (const locale of ['en', 'ar']) {
    const m = FeedbackMessages[locale];
    for (const item of ['appVersion', 'qrCode', 'role', 'policy', 'specialDay', 'payment', 'apiKey', 'booking']) {
      assert.ok(m.items[item], `${locale}.items.${item}`);
    }
    for (const action of ['generate', 'restore', 'assign']) assert.ok(m.actions[action], `${locale}.actions.${action}`);
  }
  assert.equal(feedbackForSuccess('en', 'restored', 'role'), 'Role restored.');
  assert.equal(feedbackForSuccess('ar', 'generated', 'payment'), 'تم توليد الدفعة.');
});
