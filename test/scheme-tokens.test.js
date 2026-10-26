// The screen-named tokens now come in two schemes (dark-mode spec 2026-10-26).
// Consumers read them by key and pin exact versions, so these guards hold the
// light side to 0.7.2 except for the owner's one-time consolidation, keep
// every key present, and make sure dark is built from roles only.
const test = require('node:test');
const assert = require('node:assert/strict');
const OLD = require('./fixtures/tokens-0.7.2.json');
const t = require('../dist/cjs');

// The consolidation, and nothing else, may change light (owner, 2026-10-26:
// one value per job). Each entry is the new value.
const CONSOLIDATED = {
  'SharedHomeTokens.priorityPairIconShellBg': '#F1F0F6',
  'SharedHomeTokens.calmGhostSurface': '#F1F0F6',
  'SharedHomeTokens.foodEmptyTitle': '#1A1732',
  'SharedHomeTokens.subtitleColor': '#63607E',
  'SharedHomeTokens.foodEmptySubtitle': '#63607E',
  'SharedHomeTokens.foodFlatMealEyebrow': '#63607E',
  'SharedHomeTokens.chatMetaText': '#63607E',
  'SharedHomeTokens.foodEmptyIconBg': '#F3F2FF',
  'SharedHomeTokens.chatMetaBg': '#F3F2FF',
  'SharedHomeTokens.welcomeBrandSurface': 'rgba(255,255,255,0.94)',
  'NavigationShellTokens.tabBar.inactiveColor': '#63607E',
  'NavigationShellTokens.tabBar.shadowColor': '#17142A',
  'NavigationShellTokens.header.pillShadowColor': '#17142A',
};

const leaves = (obj, prefix) =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leaves(v, `${prefix}.${k}`) : [[`${prefix}.${k}`, v]],
  );
const current = () =>
  Object.fromEntries(
    ['SharedHomeTokens', 'NavigationShellTokens', 'SystemChrome', 'LaunchScreen'].flatMap((name) =>
      leaves(t[name], name),
    ),
  );
const isColour = (v) => typeof v === 'string' && /^(#|rgba?\(|transparent$)/.test(v);

// A source map flattened to `path -> source`, so nested tabBar/header work too.
const sources = (map, prefix) =>
  Object.entries(map).flatMap(([k, v]) =>
    typeof v === 'string' || 'light' in v || 'same' in v ? [[`${prefix}.${k}`, v]] : sources(v, `${prefix}.${k}`),
  );
const SOURCES = Object.fromEntries([
  ...sources(t.SharedHomeColourSources, 'SharedHomeTokens'),
  ...sources(t.NavigationShellColourSources, 'NavigationShellTokens'),
]);
const darkOf = (source) =>
  typeof source === 'string' ? t.Roles.dark[source] : 'same' in source ? source.same : t.Roles.dark[source.dark];

const DARK = Object.fromEntries([
  ...leaves(t.sharedHomeTokens('dark'), 'SharedHomeTokens'),
  ...leaves(t.navigationShellTokens('dark'), 'NavigationShellTokens'),
]);
const LIGHT = Object.fromEntries([
  ...leaves(t.sharedHomeTokens('light'), 'SharedHomeTokens'),
  ...leaves(t.navigationShellTokens('light'), 'NavigationShellTokens'),
]);

test('light: every value equals 0.7.2 unless it is in CONSOLIDATED, which it then equals', () => {
  const now = current();
  for (const [path, old] of leaves(OLD, '').map(([p, v]) => [p.slice(1), v])) {
    if (path in CONSOLIDATED) assert.equal(now[path], CONSOLIDATED[path], path);
    else assert.equal(now[path], old, path);
  }
});

test('every CONSOLIDATED entry really changed, so the list carries nothing stale', () => {
  const old = Object.fromEntries(leaves(OLD, '').map(([p, v]) => [p.slice(1), v]));
  for (const [path, value] of Object.entries(CONSOLIDATED)) assert.notEqual(old[path], value, path);
});

test("key sets are exactly 0.7.2's: nothing dropped, nothing added", () => {
  assert.deepEqual(
    Object.keys(current()).sort(),
    leaves(OLD, '').map(([p]) => p.slice(1)).sort(),
  );
});

test('the constant exports are the light scheme', () => {
  assert.deepEqual(t.SharedHomeTokens, t.sharedHomeTokens('light'));
  assert.deepEqual(t.NavigationShellTokens, t.navigationShellTokens('light'));
  assert.deepEqual(t.SystemChrome, t.systemChrome('light'));
});

test('dark: every colour key resolves to a Roles.dark value, or to its { same } value', () => {
  for (const [path, source] of Object.entries(SOURCES)) {
    const expected = darkOf(source);
    assert.ok(expected, `${path}: source ${JSON.stringify(source)} names no dark role`);
    assert.equal(DARK[path], expected, path);
  }
});

test('dark: no colour value outside the source maps (a literal left behind would stay light)', () => {
  for (const [path, value] of Object.entries(DARK)) {
    if (isColour(value)) assert.ok(path in SOURCES, `${path} = ${value} has no colour source`);
  }
});

test('non-colour values are identical in light and dark', () => {
  for (const [path, value] of Object.entries(LIGHT)) {
    if (!(path in SOURCES)) assert.equal(DARK[path], value, path);
  }
});

// The dashboard is plain JS: a mistyped role name gets no compile error, so it
// must fail loudly here instead of painting `undefined` (invisible text).
test('resolveColour throws on an unknown role, naming it', () => {
  for (const scheme of ['light', 'dark']) {
    assert.throws(() => t.resolveColour('surfaceSunkn', scheme), /surfaceSunkn/);
    // Checked in light too, so a typo shows up whichever scheme the developer runs.
    assert.throws(() => t.resolveColour({ light: '#FFFFFF', dark: 'nope' }, scheme), /nope/);
  }
  assert.equal(t.resolveColour('canvas', 'dark'), '#121214');
});

test('systemChrome: dark is { colorScheme: "dark", statusBar: "light-content" }', () => {
  assert.deepEqual(t.systemChrome('dark'), { colorScheme: 'dark', statusBar: 'light-content' });
  assert.deepEqual(t.systemChrome('light'), { colorScheme: 'light', statusBar: 'dark-content' });
});

test('launchScreenBackground: light #F8F8FA, dark #121214', () => {
  assert.equal(t.launchScreenBackground('light'), '#F8F8FA');
  assert.equal(t.launchScreenBackground('dark'), '#121214');
  assert.equal(t.LaunchScreen.background, '#F8F8FA');
});
