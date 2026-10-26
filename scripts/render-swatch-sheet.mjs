// Renders the dark-mode swatch sheet for the owner's sign-off (dark-mode spec
// 2026-10-26, Plan 1 Task 3): every role in light and dark with its contrast,
// a light/dark preview drawn from the real tokens, and every light value the
// consolidation moved. Run after `npm run build`:
//   node scripts/render-swatch-sheet.mjs > /path/to/swatch-sheet.html
// The output is an Artifact page body: the publisher adds the doctype, <html>
// and <body>, so the file starts at <title>.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const t = require('../dist/cjs/index.js');
const OLD = require('../test/fixtures/tokens-0.7.2.json');

const { Roles, BrandFamilies, contrastRatio } = t;
const AA = 4.5;
const OPAQUE = /^#[0-9A-Fa-f]{6}$/;

// The grounds each text role must read on — the same lists test/roles.test.js holds to AA.
const NEUTRAL_GROUNDS = ['canvas', 'surface', 'surfaceSunken', 'surfaceRaised', 'surfaceElevatedAndroid'];
const STATUS_GROUNDS = ['canvas', 'surface', 'surfaceSunken', 'surfaceElevatedAndroid'];
const groundsFor = (role) => {
  if (role === 'text' || role === 'textMuted') return NEUTRAL_GROUNDS;
  if (role === 'successText' || role === 'dangerText') return STATUS_GROUNDS;
  const family = BrandFamilies.find((f) => role === `${f}Text`);
  return family ? [`${family}Tint`, `${family}TintStrong`, 'surface'] : null;
};

const ratioCell = (role, scheme) => {
  const grounds = groundsFor(role);
  if (!grounds) return '<span class="muted">not text</span>';
  const roles = Roles[scheme];
  const ratios = grounds.map((g) => [g, contrastRatio(roles[role], roles[g])]);
  const worst = Math.min(...ratios.map(([, r]) => r));
  const detail = ratios.map(([g, r]) => `${r.toFixed(2)} on ${g}`).join(' · ');
  return `<span class="pill ${worst >= AA ? 'ok' : 'bad'}">${worst.toFixed(2)}:1 min</span><span class="detail">${detail}</span>`;
};

// A role swatch is drawn on that scheme's own canvas, so translucent values
// (borders, frosted, scrim) show as they will in the app, not over the page.
const swatch = (role, scheme) => {
  const roles = Roles[scheme];
  const value = roles[role];
  const isText = Boolean(groundsFor(role));
  const family = BrandFamilies.find((f) => role === `${f}Text`);
  const ground = !isText ? roles.canvas : family ? roles[`${family}Tint`] : roles.surface;
  const inner = isText
    ? `<span class="sample" style="color:${value}">Aa 12:40</span>`
    : `<span class="chip" style="background:${value}"></span>`;
  return `<div class="sw" style="background:${ground}">${inner}</div><code>${value}</code>`;
};

const GROUPS = [
  ['Neutrals', Object.keys(Roles.light).filter((r) => !BrandFamilies.some((f) => r.startsWith(f)) && !/^(success|danger)/.test(r))],
  ['Brand families', BrandFamilies.flatMap((f) => [f, `${f}Tint`, `${f}TintStrong`, `${f}Text`])],
  ['Status', ['success', 'successText', 'danger', 'dangerText']],
];

const roleRows = GROUPS.map(
  ([label, roles]) => `
  <tr class="group"><th colspan="5">${label}</th></tr>
  ${roles
    .map(
      (r) => `<tr>
    <th scope="row"><code>${r}</code></th>
    <td>${swatch(r, 'light')}</td>
    <td>${swatch(r, 'dark')}</td>
    <td>${ratioCell(r, 'light')}</td>
    <td>${ratioCell(r, 'dark')}</td>
  </tr>`,
    )
    .join('')}`,
).join('');

// A parent Home card and a status row, drawn only from the tokens a screen would read.
const preview = (scheme) => {
  const r = Roles[scheme];
  const h = t.sharedHomeTokens(scheme);
  const nav = t.navigationShellTokens(scheme);
  const chip = (f, label) =>
    `<span class="pchip" style="background:${r[`${f}Tint`]};color:${r[`${f}Text`]}">${label}</span>`;
  return `<figure class="phone" style="background:${h.screenBackground}">
    <figcaption style="color:${r.textMuted}">${scheme === 'light' ? 'Light' : 'Dark · graphite'}</figcaption>
    <div class="pcard" style="background:${r.surface};border-color:${h.mutedBorder}">
      <div class="prow">
        <span class="avatar" style="background:${r.orangeTintStrong}"></span>
        <div><div class="peyebrow" style="color:${h.subtitleColor}">Sunflowers class</div>
        <div class="ptitle" style="color:${h.titleColor}">Lina</div></div>
      </div>
      <div class="pchips">${chip('teal', 'Checked in 08:22')}${chip('primary', 'Nap 12:40')}${chip('coral', 'Fever note')}${chip('yellow', 'Trip Thu')}</div>
    </div>
    <div class="pcard" style="background:${r.surface};border-color:${h.mutedBorder}">
      <div class="peyebrow" style="color:${h.foodFlatMealEyebrow}">MENU</div>
      <div class="ptitle" style="color:${h.foodEmptyTitle}">Chicken &amp; vegetable rice</div>
      <div class="psub" style="color:${h.foodEmptySubtitle}">Lunch · 12:00</div>
      <div class="pstatus"><span style="color:${r.successText}">Paid</span><span style="color:${r.dangerText}">Overdue 2 days</span></div>
    </div>
    <div class="ptabs" style="background:${r.surfaceRaised};border-color:${nav.tabBar.borderColor}">
      <span style="color:${nav.tabBar.activeColor};background:${nav.tabBar.activePill}">Home</span>
      <span style="color:${nav.tabBar.inactiveColor}">Daily</span>
      <span style="color:${nav.tabBar.inactiveColor}">Pickup</span>
      <span style="color:${nav.tabBar.inactiveColor}">Reports</span>
    </div>
  </figure>`;
};

// Every light value that moved: the 0.7.2 fixture against today's light tokens.
const flatten = (obj, prefix) =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v, `${prefix}.${k}`) : [[`${prefix}.${k}`, v]]));
const now = Object.fromEntries([
  ...flatten(t.SharedHomeTokens, 'SharedHomeTokens'),
  ...flatten(t.NavigationShellTokens, 'NavigationShellTokens'),
]);
const moved = [...flatten(OLD.SharedHomeTokens, 'SharedHomeTokens'), ...flatten(OLD.NavigationShellTokens, 'NavigationShellTokens')]
  .filter(([path, old]) => now[path] !== old)
  .map(([path, old]) => [path, old, now[path]]);
const onWhite = (v) => (OPAQUE.test(v) ? `${contrastRatio(v, '#FFFFFF').toFixed(2)}:1` : '—');
const movedRows = moved
  .map(
    ([path, before, after]) => `<tr>
    <th scope="row"><code>${path.replace(/^(SharedHomeTokens|NavigationShellTokens)\./, '')}</code></th>
    <td><div class="sw light-ground"><span class="chip" style="background:${before}"></span></div><code>${before}</code></td>
    <td><div class="sw light-ground"><span class="chip" style="background:${after}"></span></div><code>${after}</code></td>
    <td class="num">${onWhite(before)} → ${onWhite(after)}</td>
  </tr>`,
  )
  .join('');

const roleCount = Object.keys(Roles.light).length;

process.stdout.write(`<title>Uprise Dark Mode Swatches</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kumbh+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  /* Layout: one reading column; wide tables scroll inside their own box. */
  :root {
    --bg: #F8F8FA; --panel: #FFFFFF; --ink: #1A1732; --muted: #63607E; --line: rgba(26,23,50,0.10);
    --accent: #4C48FC; --ok-bg: #D2F6F1; --ok-fg: #117768; --bad-bg: #FCDDDF; --bad-fg: #C70F19;
    --display: "Kumbh Sans", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg: #121214; --panel: #1C1C1F; --ink: #F2F2F5; --muted: #A1A1AA; --line: rgba(255,255,255,0.09);
    --accent: #9D9AFD; --ok-bg: #1C4844; --ok-fg: #1ED3B8; --bad-bg: #4F2A2E; --bad-fg: #F57C82; color-scheme: dark } }
  :root[data-theme="dark"] {
    --bg: #121214; --panel: #1C1C1F; --ink: #F2F2F5; --muted: #A1A1AA; --line: rgba(255,255,255,0.09);
    --accent: #9D9AFD; --ok-bg: #1C4844; --ok-fg: #1ED3B8; --bad-bg: #4F2A2E; --bad-fg: #F57C82; color-scheme: dark }
  body { background: var(--bg); color: var(--ink); font: 15px/1.55 var(--display); }
  main { max-width: 1120px; margin: 0 auto; padding-block: 40px 64px;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
    display: grid; gap: 40px; }
  h1 { font-size: 30px; line-height: 1.2; margin: 0; text-wrap: balance; }
  h2 { font-size: 20px; margin: 0 0 6px; text-wrap: balance; }
  p { margin: 0; max-width: 68ch; color: var(--muted); }
  .eyebrow { font: 600 12px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
  header, section { display: grid; gap: 12px; min-width: 0; }
  .scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
  table { border-collapse: collapse; width: 100%; min-width: 820px; }
  th, td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); vertical-align: middle; }
  thead th { border-top: 0; font: 600 12px var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  tr.group th { font: 700 13px var(--display); color: var(--ink); background: var(--bg); }
  code { font: 12.5px var(--mono); }
  td code { display: block; margin-top: 4px; color: var(--muted); }
  .sw { width: 112px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--line); }
  .light-ground { background: #FFFFFF; }
  .chip { width: 72px; height: 22px; border-radius: 7px; border: 1px solid rgba(128,128,128,.25); }
  .sample { font: 700 16px var(--display); }
  .pill { display: inline-block; font: 600 12px var(--mono); padding: 2px 8px; border-radius: 8px; }
  .pill.ok { background: var(--ok-bg); color: var(--ok-fg); } .pill.bad { background: var(--bad-bg); color: var(--bad-fg); }
  .detail { display: block; margin-top: 4px; font: 11.5px/1.45 var(--mono); color: var(--muted); }
  .muted { color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; font-family: var(--mono); font-size: 12.5px; }
  .phones { display: flex; flex-wrap: wrap; gap: 20px; }
  .phone { margin: 0; flex: 1 1 300px; max-width: 380px; border-radius: 28px; padding: 18px 14px 14px; display: grid; gap: 12px; box-shadow: 0 0 0 6px #0b0b0d; }
  .phone figcaption { font: 600 12px var(--display); letter-spacing: .06em; text-transform: uppercase; }
  .pcard { border: 1px solid; border-radius: 20px; padding: 14px; display: grid; gap: 8px; }
  .prow { display: flex; gap: 10px; align-items: center; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; }
  .peyebrow { font: 600 11px var(--display); letter-spacing: .06em; }
  .ptitle { font: 700 17px var(--display); } .psub { font: 400 13px var(--display); }
  .pchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pchip { font: 600 12px var(--display); padding: 4px 9px; border-radius: 10px; }
  .pstatus { display: flex; gap: 14px; font: 600 13px var(--display); }
  .ptabs { display: flex; justify-content: space-around; border: 1px solid; border-radius: 18px; padding: 8px; font: 500 12px var(--display); }
  .ptabs span { padding: 5px 10px; border-radius: 10px; }
  a:focus-visible, .scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
<main>
  <header>
    <span class="eyebrow">design-tokens 0.8.0 · for sign-off</span>
    <h1>Uprise dark mode: every colour, in both themes</h1>
    <p>${roleCount} colour roles, each with a light and a graphite dark value. Text roles show their worst contrast across the grounds they sit on; AA is 4.5:1. Below the table: the same Home card drawn from the real tokens, then the ${moved.length} light colours that changed with the consolidation you chose.</p>
  </header>

  <section aria-labelledby="roles">
    <h2 id="roles">Roles</h2>
    <p>Swatches sit on their own theme's canvas or tint, so translucent borders and text samples look the way they will in the apps.</p>
    <div class="scroll" tabindex="0">
      <table>
        <thead><tr><th>Role</th><th>Light</th><th>Dark</th><th>Light contrast</th><th>Dark contrast</th></tr></thead>
        <tbody>${roleRows}</tbody>
      </table>
    </div>
  </section>

  <section aria-labelledby="preview">
    <h2 id="preview">Preview</h2>
    <p>A parent Home card, a menu card with paid and overdue status, and the tab bar. Every colour is read from sharedHomeTokens(), navigationShellTokens() and the roles; nothing is typed in.</p>
    <div class="phones">${preview('light')}${preview('dark')}</div>
  </section>

  <section aria-labelledby="moved">
    <h2 id="moved">Light colours that changed</h2>
    <p>One value per job: inks and greys that did the title and subtitle jobs became the text and muted-text roles, near-equal chip greys became one, the inactive tab colour moved off a 3.11:1 grey, and two shadows joined the shadow role. Contrast is measured on white.</p>
    <div class="scroll" tabindex="0">
      <table>
        <thead><tr><th>Token</th><th>0.7.2</th><th>0.8.0</th><th>On white</th></tr></thead>
        <tbody>${movedRows}</tbody>
      </table>
    </div>
  </section>
</main>
`);
