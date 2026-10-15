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
