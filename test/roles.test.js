// The role table is what dark mode stands on (spec 2026-10-26): one name per
// colour job, a light and a dark value each. These guards keep the two tables
// the same shape, keep every text role at AA in BOTH schemes, and pin the
// derived dark values to the rule that produced them, so a hand edit can't
// drift from scripts/derive-dark-roles.mjs without failing here.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Roles,
  LightRoles,
  DarkRoles,
  BrandFamilies,
  Colors,
  contrastRatio,
  compositeOver,
} = require('../dist/cjs');

const AA = 4.5;
const NEUTRAL_GROUNDS = ['canvas', 'surface', 'surfaceSunken', 'surfaceRaised', 'surfaceElevatedAndroid'];
const STATUS_GROUNDS = ['canvas', 'surface', 'surfaceSunken', 'surfaceElevatedAndroid'];

const assertAA = (roles, textRole, groundRoles, scheme) => {
  for (const ground of groundRoles) {
    const ratio = contrastRatio(roles[textRole], roles[ground]);
    assert.ok(
      ratio >= AA,
      `${scheme} ${textRole} ${roles[textRole]} on ${ground} ${roles[ground]} is ${ratio.toFixed(2)}:1`,
    );
  }
};

test('light and dark have exactly the same role names', () => {
  assert.deepEqual(Object.keys(DarkRoles).sort(), Object.keys(LightRoles).sort());
});

test('Roles.light and Roles.dark are the two tables', () => {
  assert.equal(Roles.light, LightRoles);
  assert.equal(Roles.dark, DarkRoles);
});

test('contrastRatio: white on black is 21, a colour on itself is 1', () => {
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21);
  assert.equal(contrastRatio('#1A1732', '#1A1732'), 1);
});

test('contrastRatio throws on anything but #RRGGBB, naming the value', () => {
  for (const bad of ['rgba(0,0,0,0.1)', 'transparent', '#FFF']) {
    assert.throws(
      () => contrastRatio(bad, '#FFFFFF'),
      (err) => err instanceof Error && err.message.includes(bad),
    );
    assert.throws(
      () => contrastRatio('#FFFFFF', bad),
      (err) => err instanceof Error && err.message.includes(bad),
    );
  }
});

test('compositeOver: primary100 at 0.16 over #1C1C1F is #2D2C43', () => {
  assert.equal(compositeOver(Colors.primary100, 0.16, '#1C1C1F'), '#2D2C43');
});

for (const scheme of ['light', 'dark']) {
  const roles = Roles[scheme];

  test(`${scheme}: text and textMuted reach AA on every neutral ground`, () => {
    assertAA(roles, 'text', NEUTRAL_GROUNDS, scheme);
    assertAA(roles, 'textMuted', NEUTRAL_GROUNDS, scheme);
  });

  test(`${scheme}: <family>Text reaches AA on its Tint, TintStrong and surface`, () => {
    for (const f of BrandFamilies) {
      assertAA(roles, `${f}Text`, [`${f}Tint`, `${f}TintStrong`, 'surface'], scheme);
    }
  });

  test(`${scheme}: successText and dangerText reach AA on canvas, surface, surfaceSunken, surfaceElevatedAndroid`, () => {
    assertAA(roles, 'successText', STATUS_GROUNDS, scheme);
    assertAA(roles, 'dangerText', STATUS_GROUNDS, scheme);
  });
}

test('light brand roles are the Colors values, unchanged', () => {
  for (const f of BrandFamilies) {
    assert.equal(LightRoles[f], Colors[`${f}100`], f);
    assert.equal(LightRoles[`${f}Tint`], Colors[`${f}10`], `${f}Tint`);
    assert.equal(LightRoles[`${f}TintStrong`], Colors[`${f}20`], `${f}TintStrong`);
    assert.equal(LightRoles[`${f}Text`], Colors[`${f}Text`], `${f}Text`);
  }
});

test('dark brand roles keep the family value', () => {
  for (const f of BrandFamilies) assert.equal(DarkRoles[f], Colors[`${f}100`], f);
});

test('dark tints are the family composited over dark surface (0.16 / 0.24)', () => {
  for (const f of BrandFamilies) {
    assert.equal(DarkRoles[`${f}Tint`], compositeOver(Colors[`${f}100`], 0.16, DarkRoles.surface), `${f}Tint`);
    assert.equal(
      DarkRoles[`${f}TintStrong`],
      compositeOver(Colors[`${f}100`], 0.24, DarkRoles.surface),
      `${f}TintStrong`,
    );
  }
});
