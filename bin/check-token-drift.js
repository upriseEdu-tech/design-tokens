#!/usr/bin/env node
/**
 * Fail when a colour literal in an app's source duplicates a value this
 * package already exports.
 *
 * A shared package stops drift only while everyone uses it, and the way it
 * stops being used is not a dramatic fork — it is one hex typed inline
 * because reaching for the token was two keystrokes more. This is the check
 * that notices.
 *
 * It lives in the package rather than in each app on purpose: three copies of
 * a drift checker is the same problem the package exists to solve, and all
 * three apps already depend on this.
 *
 * Bounded to EXACT matches, the same bound the audit sweep used. A literal
 * that merely resembles a token is a judgement about what its author meant,
 * and a check cannot make that call.
 *
 * Usage:
 *   check-token-drift [dir] [--allow <path-substring>]...
 *
 * `--allow` takes a path fragment, not a glob: the places where naming a hex
 * is correct are few and specific (a CSS file that cannot import JS, a colour
 * picker whose hexes are user-facing data), so listing them by path is
 * clearer than a pattern language.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const tokens = require('../dist/cjs/index.js');

const EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.css', '.scss',
]);

/**
 * The generic neutrals are deliberately NOT part of the comparison set.
 *
 * `#FFFFFF` in a web app is not a copy of `Colors.white`; it is white. Same
 * for black, the utility greys and the pre-rebrand `background`. Flagging
 * them produces a page of findings whose only honest fix is a suppression
 * comment, and a check people suppress by reflex stops being a check. What
 * this gate is for is a *brand* value retyped — a hue, a tint, one of the
 * computed text-on-tint tokens — where the literal really is a second copy.
 */
const GENERIC_NEUTRALS = new Set([
  'black', 'white', 'gray', 'gray2', 'gray5', 'gray_disabled',
  'lightGray', 'darkGray', 'background',
]);

/** Every hex this package exports, however deeply nested. */
function collectHexes(value, into) {
  if (typeof value === 'string') {
    const m = /^#[0-9A-Fa-f]{6}$/.exec(value.trim());
    if (m) into.add(value.trim().toUpperCase());
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectHexes(v, into);
  }
  return into;
}

/**
 * Return the line with comments blanked out, plus whether a block comment is
 * still open. A hex in a comment is documentation — the contrast tables in
 * these theme files quote the very values they compute — and flagging prose
 * would train people to ignore this check.
 */
function stripComments(line, inBlockComment) {
  let out = '';
  let inBlock = inBlockComment;
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const two = line.slice(i, i + 2);
    if (inBlock) {
      if (two === '*/') { inBlock = false; i += 1; }
      continue;
    }
    if (!quote && two === '/*') { inBlock = true; i += 1; continue; }
    if (!quote && two === '//') break;
    const c = line[i];
    if (quote) {
      if (c === '\\') { out += c + (line[i + 1] || ''); i += 1; continue; }
      if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') {
      quote = c;
    }
    out += c;
  }
  return [out, inBlock];
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function main(argv) {
  const allow = [];
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--allow') {
      allow.push(argv[i + 1]);
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  const root = path.resolve(positional[0] || 'src');
  if (!fs.existsSync(root)) {
    console.error(`check-token-drift: ${root} does not exist`);
    return 2;
  }

  const brand = { ...tokens };
  brand.Colors = Object.fromEntries(
    Object.entries(tokens.Colors).filter(([k]) => !GENERIC_NEUTRALS.has(k)),
  );
  const generic = new Set(
    [...GENERIC_NEUTRALS].map(k => String(tokens.Colors[k]).toUpperCase()),
  );
  const shared = new Set(
    [...collectHexes(brand, new Set())].filter(hex => !generic.has(hex)),
  );
  const findings = [];

  for (const file of walk(root)) {
    const rel = path.relative(process.cwd(), file);
    if (allow.some(a => rel.includes(a))) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let inBlockComment = false;
    lines.forEach((line, n) => {
      // A line may opt out where restating the value is the point.
      if (line.includes('token-drift-ok')) return;
      const [code, stillInComment] = stripComments(line, inBlockComment);
      inBlockComment = stillInComment;
      for (const m of code.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
        const hex = m[0].toUpperCase();
        if (shared.has(hex)) findings.push({ rel, line: n + 1, hex, text: line.trim() });
      }
    });
  }

  if (!findings.length) {
    console.log(
      `check-token-drift: clean — no literal in ${path.relative(process.cwd(), root)} ` +
      `duplicates any of the ${shared.size} values @upriseedu-tech/design-tokens exports.`,
    );
    return 0;
  }

  console.error(
    `check-token-drift: ${findings.length} literal(s) duplicate a shared token.\n` +
    'Import it from @upriseedu-tech/design-tokens (or through this app\'s theme\n' +
    'module) instead. If restating the value is genuinely correct here, add a\n' +
    '`token-drift-ok` comment on the line and say why.\n',
  );
  for (const f of findings) {
    console.error(`  ${f.rel}:${f.line}  ${f.hex}\n      ${f.text}`);
  }
  return 1;
}

process.exit(main(process.argv.slice(2)));
