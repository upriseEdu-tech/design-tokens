// Renders the icon registry for the owner's review (spec §4.2, Plan 1 Task 6):
// one card per concept with the proposed glyph and what each app draws today,
// then the action, status and feedback sets. Run after `npm run build`.
//   node scripts/render-icon-review.mjs > /path/to/icon-review.html
// The output is an Artifact page body: the publisher adds the doctype, <html>
// and <body>, so the file starts at <title>.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const solar = require('@iconify-json/solar/icons.json');
const { IconConcepts, IconActions, IconStatuses, IconFeedback, IconSameMeaning } = require('../dist/cjs/index.js');

// What each app draws today for a concept (2026-10-15 icon audit). Empty = none.
const TODAY = {
  home: ['home.png', 'home', 'widget-2 duotone'],
  chat: ['message_square.png / chat-round / chat-round-dots', 'chat-round', 'chat-round-dots duotone; mdi:message-text'],
  notifications: ['notification.png / bell', 'bell', 'bell-bing duotone; mdi:bell'],
  pickup: ['car.png / car', 'car', 'walking (nav) / tag (KPI)'],
  dailySchedule: ['calendar_dots.png / calendar', 'calendar; document-text', 'checklist'],
  events: ['confetti', 'calendar-mark / calendar', 'confetti; mdi:calendar-star'],
  vacation: ['calendar_check.png / umbrella / calendar-mark', '', 'calendar / sun-2 / suitcase'],
  progressReports: ['reports.png / clipboard / Assignment.png / chart', 'chart-square / clipboard', 'graph-up / document-text'],
  learning: ['book.png / book / book-2 / academic-cap', 'book / folder-open / target', 'notebook'],
  staffAttendance: ['checkin.png / reports.png / clock / login', '', 'calendar / clock-circle'],
  accidentReports: ['reports.png', '', 'folder-with-files'],
  assignments: ['reports.png / clipboard / Assignment.png', '', ''],
  medicalAssessments: ['Assignment.png', '', ''],
  birthdays: ['balloon / gift', 'star SVG / gift / confetti', 'cake'],
  classes: ['academic-cap', '', 'book-bookmark / graduation-cap'],
  announcements: ['volume-loud', '', 'letter (nav) / megaphone'],
};

const svg = (glyph, size = 28) => {
  const icon = solar.icons[`${glyph}-linear`];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${icon.body}</svg>`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const shared = new Set(IconSameMeaning.flat());
const card = (group, key, glyph, today) => `
  <article class="card" id="${group}-${key}">
    <div class="glyph">${svg(glyph)}</div>
    <div class="meta"><strong>${esc(key)}</strong><code>${esc(glyph)}</code>
    ${shared.has(`${group}.${key}`) ? '<span class="pair">Shared, same meaning</span>' : ''}
    ${today ? `<dl><dt>Staff</dt><dd>${esc(today[0] || '—')}</dd><dt>Parent</dt><dd>${esc(today[1] || '—')}</dd><dt>Dashboard</dt><dd>${esc(today[2] || '—')}</dd></dl>` : ''}
    </div>
  </article>`;
const section = (group, title, blurb, map, withToday) => `
  <section aria-labelledby="h-${group}"><h2 id="h-${group}">${title} <span>${Object.keys(map).length}</span></h2>
  <p class="blurb">${blurb}</p>
  <div class="grid">${Object.entries(map).map(([k, g]) => card(group, k, g, withToday ? TODAY[k] : null)).join('')}</div></section>`;

const total = [IconConcepts, IconActions, IconStatuses, IconFeedback].reduce((n, m) => n + Object.keys(m).length, 0);

process.stdout.write(`<title>Uprise Icon Registry</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kumbh+Sans:wght@400;600;700&display=swap">
<style>
/* Layout: a review sheet. Four registries in order, each a wrapping grid of glyph cards. */
:root{--canvas:#F8F8FA;--card:#FFFFFF;--title:#1A1732;--sub:#6F6B8A;--border:rgba(132,129,253,.18);--accent:#6461E0;--tint:rgba(132,129,253,.12);--pair:#0E8F7C;
  --font:"Kumbh Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--canvas:#14121F;--card:#1D1A2C;--title:#F4F3FA;--sub:#A9A5C2;--border:rgba(132,129,253,.30);--accent:#A6A4FF;--tint:rgba(132,129,253,.18);--pair:#3FE0C6;color-scheme:dark;}}
:root[data-theme="dark"]{--canvas:#14121F;--card:#1D1A2C;--title:#F4F3FA;--sub:#A9A5C2;--border:rgba(132,129,253,.30);--accent:#A6A4FF;--tint:rgba(132,129,253,.18);--pair:#3FE0C6;color-scheme:dark;}
body{background:var(--canvas);color:var(--title);font:15px/1.5 var(--font);}
main{max-width:1200px;margin:0 auto;padding-inline:16px;padding-block:32px 64px;display:flex;flex-direction:column;gap:8px;}
h1{font-size:30px;line-height:1.2;margin:0;text-wrap:balance;}
p.lead{color:var(--sub);margin:0;max-width:65ch;}
.rules{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:0;list-style:none;}
.rules li{font-size:13px;color:var(--sub);background:var(--card);border:1px solid var(--border);border-radius:999px;padding:4px 12px;}
section{display:flex;flex-direction:column;gap:12px;margin-top:28px;}
h2{font-size:19px;margin:0;} h2 span{color:var(--sub);font-weight:400;font-variant-numeric:tabular-nums;}
.blurb{margin:-6px 0 0;color:var(--sub);font-size:14px;max-width:65ch;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
.card{display:flex;gap:12px;align-items:flex-start;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;}
.glyph{color:var(--accent);flex:none;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:var(--tint);}
.meta{min-width:0;display:flex;flex-direction:column;gap:2px;}
.meta strong{font-weight:600;}
.meta code{color:var(--sub);font:12px/1.4 var(--mono);overflow-wrap:anywhere;}
.pair{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--pair);font-weight:600;}
dl{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin:6px 0 0;font-size:12px;}
dt{color:var(--sub);} dd{margin:0;overflow-wrap:anywhere;}
</style>
<main>
<h1>Uprise icon registry</h1>
<p class="lead">One Solar Linear glyph per concept, used the same way in the staff app, the parent app and the dashboard. ${total} glyphs, proposed on 15 October 2026 for your approval. Concept cards show what each app draws for that concept today.</p>
<ul class="rules">
  <li>One concept, one glyph</li><li>One glyph, one meaning</li><li>Apps name the concept, never the glyph</li><li>Solar Linear only</li>
</ul>
${section('concepts', 'Concepts', 'The things people navigate to and talk about. A concept never borrows an action or status glyph.', IconConcepts, true)}
${section('actions', 'Actions', 'Buttons and controls. An action glyph never stands for a concept.', IconActions, false)}
${section('statuses', 'Statuses', 'Reserved for state: attendance, requests and approvals.', IconStatuses, false)}
${section('feedback', 'Feedback', 'The glyph on a toast or banner.', IconFeedback, false)}
</main>
`);
