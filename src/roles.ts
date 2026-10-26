import { Colors, androidElevatedCardSurface, rebrandScreenCanvas } from './colors.js';

/**
 * Colour roles: one name per colour job, with a light and a dark value
 * (dark-mode spec 2026-10-26). A screen asks for `text` or `surface`, never for
 * a hex, so the scheme decides the value and dark mode is defined here once
 * instead of once per screen-named token.
 *
 * The light side is today's brand. Two light values moved on purpose:
 * `successText` and `dangerText` (see below). The `Colors` enum is unchanged.
 *
 * The dark side is graphite (owner's pick from three mocked directions): a
 * neutral near-black, with the brand families carrying the identity. Values
 * marked "derived" come from `scripts/derive-dark-roles.mjs`. The tests pin the
 * derived tints to that rule and hold every text role to AA; they do not
 * re-derive the text values, so re-run the script after changing one. All
 * ratios are WCAG 2.x, computed with `contrastRatio`.
 *
 * There is no on-accent text role yet: white measures 1.31–3.35:1 on seven of
 * the eight solid accents, so it can't be one name for all of them. The role
 * for text on a solid accent fill is an owner colour call, settled with the
 * rn-ui plan (Plan 3).
 */

export type ColorScheme = 'light' | 'dark';

export const BrandFamilies = ['primary', 'teal', 'blue', 'coral', 'orange', 'yellow'] as const;

export const LightRoles = {
  // ---- Neutrals
  canvas: rebrandScreenCanvas,
  surface: Colors.white,
  // The default chip / segmented-control ground. Absorbs the three near-equal
  // greys screens used for it (#F0EFF5, #EEEFF2, #F1F0F6).
  surfaceSunken: '#F1F0F6',
  surfaceRaised: Colors.white,
  surfaceElevatedAndroid: androidElevatedCardSurface,
  surfaceFrosted: 'rgba(255,255,255,0.94)',
  border: 'rgba(26,23,50,0.08)',
  borderStrong: 'rgba(26,23,50,0.12)',
  // 17.32:1 on surface, 15.29 on surfaceSunken. Replaces #000 and #262626 as
  // body text (owner, 2026-10-26: one value per job).
  text: '#1A1732',
  // `neutralText`: 5.99:1 on surface, 5.65 on canvas, 5.29 on surfaceSunken.
  // Replaces #929292 (3.11:1 on white) and subtitleColor #6F6B8A (4.47:1 on
  // the chip), which both failed AA.
  textMuted: Colors.neutralText,
  shadow: '#17142A',
  photoScrim: 'transparent',

  // ---- Brand families: today's 100 / 10 / 20 / *Text, unchanged
  primary: Colors.primary100,
  primaryTint: Colors.primary10,
  primaryTintStrong: Colors.primary20,
  primaryText: Colors.primaryText,
  teal: Colors.teal100,
  tealTint: Colors.teal10,
  tealTintStrong: Colors.teal20,
  tealText: Colors.tealText,
  blue: Colors.blue100,
  blueTint: Colors.blue10,
  blueTintStrong: Colors.blue20,
  blueText: Colors.blueText,
  coral: Colors.coral100,
  coralTint: Colors.coral10,
  coralTintStrong: Colors.coral20,
  coralText: Colors.coralText,
  orange: Colors.orange100,
  orangeTint: Colors.orange10,
  orangeTintStrong: Colors.orange20,
  orangeText: Colors.orangeText,
  yellow: Colors.yellow100,
  yellowTint: Colors.yellow10,
  yellowTintStrong: Colors.yellow20,
  yellowText: Colors.yellowText,

  // ---- Status
  success: Colors.green,
  // Derived, darkened from greenText #3A8238, which measured 4.47:1 on canvas.
  // 5.16 on canvas, 5.47 on surface, 4.83 on surfaceSunken, 5.03 on
  // surfaceElevatedAndroid.
  successText: '#357733',
  danger: Colors.red,
  // Derived, darkened from redText #CE3C3E, which measured 4.27:1 on
  // surfaceSunken. 5.07 on canvas, 5.37 on surface, 4.74 on surfaceSunken,
  // 4.94 on surfaceElevatedAndroid.
  dangerText: '#C63234',
} as const;

export type RoleName = keyof typeof LightRoles;

export const DarkRoles: { readonly [K in RoleName]: string } = {
  // ---- Neutrals (graphite)
  canvas: '#121214',
  surface: '#1C1C1F',
  surfaceSunken: '#2A2A30',
  surfaceRaised: '#242428',
  surfaceElevatedAndroid: '#242428',
  surfaceFrosted: 'rgba(36,36,40,0.94)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  // 16.75:1 on canvas, 15.22 on surface, 12.77 on surfaceSunken, 13.84 on
  // surfaceRaised.
  text: '#F2F2F5',
  // 7.30:1 on canvas, 6.63 on surface, 5.57 on surfaceSunken, 6.03 on
  // surfaceRaised.
  textMuted: '#A1A1AA',
  shadow: '#000000',
  // Photo cover cards only, never the full-screen viewer: takes the glare off a
  // bright photo on a dark screen.
  photoScrim: 'rgba(0,0,0,0.12)',

  // ---- Brand families. The 100 stays; Tint / TintStrong are derived (the 100
  // at 0.16 / 0.24 over surface, stored opaque); Text is derived, lightened
  // until it reaches 4.71:1 on TintStrong, surfaceSunken and surfaceRaised.
  primary: Colors.primary100,
  primaryTint: '#2D2C43',
  primaryTintStrong: '#353454',
  primaryText: '#9D9AFD', // 5.46 on Tint, 4.79 on TintStrong, 6.86 on surface
  teal: Colors.teal100,
  tealTint: '#1C3937',
  tealTintStrong: '#1C4844',
  tealText: Colors.teal100, // already readable: 6.55 on Tint, 5.37 on TintStrong, 8.96 on surface
  blue: Colors.blue100,
  blueTint: '#253643',
  blueTintStrong: '#294355',
  blueText: Colors.blue100, // 5.97 on Tint, 4.97 on TintStrong, 8.16 on surface
  coral: Colors.coral100,
  coralTint: '#3E2529',
  coralTintStrong: '#4F2A2E',
  coralText: '#F57C82', // 5.39 on Tint, 4.75 on TintStrong, 6.55 on surface
  orange: Colors.orange100,
  orangeTint: '#3F312B',
  orangeTintStrong: '#513B31',
  orangeText: Colors.orange100, // 5.96 on Tint, 4.98 on TintStrong, 8.14 on surface
  yellow: Colors.yellow100,
  yellowTint: '#403B2D',
  yellowTintStrong: '#524B34',
  yellowText: Colors.yellow100, // 8.54 on Tint, 6.65 on TintStrong, 13.00 on surface

  // ---- Status. red #CE3C3E is only 3.51:1 on surface, so its text is lifted.
  success: Colors.green,
  successText: Colors.green, // 5.98 on surface, 5.02 on surfaceSunken, 5.44 on surfaceRaised
  danger: Colors.red,
  dangerText: '#DD7778', // 5.65 on surface, 4.74 on surfaceSunken, 5.14 on surfaceRaised
};

export const Roles: { readonly light: typeof LightRoles; readonly dark: typeof DarkRoles } = {
  light: LightRoles,
  dark: DarkRoles,
};
