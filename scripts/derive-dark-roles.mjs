// Derives the computed values in src/roles.ts (dark-mode spec 2026-10-26,
// Plan 1 Task 1): the dark tints, the dark text roles, and the two light
// status texts. Run after `npm run build`:
//   node scripts/derive-dark-roles.mjs
// The output is pasted into roles.ts with its ratios; test/roles.test.js then
// holds every value to AA, so a hand edit that breaks contrast fails the build.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Colors, LightRoles, DarkRoles, BrandFamilies, contrastRatio, compositeOver } = require('../dist/cjs/index.js');

// 4.71:1 is the margin the light *Text tokens were computed to (colors.ts),
// a little over AA's 4.5 so a rounding step never lands a value under it.
const TARGET = 4.71;

const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const fromHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function rgbToHsl([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map((v) => v * 255);
}

// Walks HSL lightness from `base` in 0.5% steps (direction +1 lightens, -1
// darkens) until the colour reaches TARGET on every ground. Hue and saturation
// stay, so the result still reads as the same family.
function shiftUntilReadable(base, grounds, direction) {
  const [h, s, start] = rgbToHsl(fromHex(base));
  for (let l = start; l >= 0.05 && l <= 0.95; l += direction * 0.005) {
    const hex = toHex(hslToRgb([h, s, l]));
    if (grounds.every((g) => contrastRatio(hex, g) >= TARGET)) return hex;
  }
  throw new Error(`${base} cannot reach ${TARGET}:1 on ${grounds.join(', ')}`);
}

const ratios = (hex, grounds) => grounds.map((g) => `${contrastRatio(hex, g).toFixed(2)} on ${g}`).join(', ');

console.log('Dark families (tints over dark surface %s):', DarkRoles.surface);
for (const f of BrandFamilies) {
  const base = Colors[`${f}100`];
  const tint = compositeOver(base, 0.16, DarkRoles.surface);
  const tintStrong = compositeOver(base, 0.24, DarkRoles.surface);
  const grounds = [tintStrong, DarkRoles.surfaceSunken, DarkRoles.surfaceRaised];
  const text = shiftUntilReadable(base, grounds, +1);
  console.log(`  ${f}: Tint ${tint}  TintStrong ${tintStrong}  Text ${text}  (${ratios(text, [tint, tintStrong, DarkRoles.surface])})`);
}

const darkGrounds = [DarkRoles.surface, DarkRoles.surfaceSunken, DarkRoles.surfaceRaised];
const lightGrounds = [LightRoles.canvas, LightRoles.surface, LightRoles.surfaceSunken, LightRoles.surfaceElevatedAndroid];
console.log('Status texts:');
for (const [name, base, lightBase] of [
  ['successText', Colors.green, Colors.greenText],
  ['dangerText', Colors.red, Colors.redText],
]) {
  const dark = shiftUntilReadable(base, darkGrounds, +1);
  const light = shiftUntilReadable(lightBase, lightGrounds, -1);
  console.log(`  ${name}: light ${light} (${ratios(light, lightGrounds)})`);
  console.log(`  ${name}: dark  ${dark} (${ratios(dark, darkGrounds)})`);
}
