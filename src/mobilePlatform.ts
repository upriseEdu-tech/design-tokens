import { rebrandScreenCanvas } from './colors';

/**
 * The values ADR 0001 decided (docs/adr/0001-mobile-platform-design-rules.md).
 *
 * Data only, like everything else here. The rules these encode that are not
 * values — which icons mirror under RTL, where gaps may be declared — live in
 * the ADR, because a check cannot enforce them and a token cannot express
 * them.
 */

/**
 * The factor `teacher` scales `mobile`'s values by for tablets. It lives here
 * because two values below are already derived from it (the tablet launch
 * mark, the tablet icon sizes), and a scale that disagrees with the numbers
 * derived from it is worse than no scale at all.
 *
 * `commonSizes` itself stays per-app — see the README.
 */
export const TabletScale = 1.96;

/**
 * Spacing BETWEEN components, in mobile points. Measured from what the two
 * apps already do rather than invented: every value below was the dominant
 * one in its role on `main` at the time of the ADR.
 *
 * The rule these serve is the part a token cannot hold: **gaps belong to the
 * parent.** A component never pads or margins itself away from its siblings;
 * the screen or stack that owns them sets `gap` and pads once. Mobile's list
 * gutters sat at 38 and its gallery at 60 because a wrapper added its own 20
 * under the screen's 18, which is what happens when both sides think the gap
 * is theirs.
 *
 * `teacher` applies TabletScale where a tablet layout pass says it should;
 * today it adopts these only where its current value already matches.
 */
export const LayoutRhythm = {
  gutter: 18,
  gutterAuth: 20,
  screenBottom: 20,
  section: 14,
  sectionLoose: 24,
  stack: 12,
  list: 12,
  related: 6,
  titleToBody: 8,
  field: 6,
  cardPadding: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  rowMinHeight: 52,
};

/**
 * Type faces and the rules that change under RTL.
 *
 * `arabicFamily` is Cairo (ADR §2, amended 2026-09-21): Arabic is the dominant
 * reading language for these nurseries, so the Arabic face is the product's
 * primary voice rather than a companion to the Latin one.
 *
 * **Cairo ships Latin glyphs of its own, and they are not ours.** Setting
 * Cairo as "the RTL font" wholesale silently restyles every Latin word on an
 * Arabic screen — a product name, an address, a phone number. Keep
 * `latinFamily` for Latin: order the web stack Kumbh Sans first, and in RN
 * select the family per string's script rather than per screen direction.
 *
 * The two `rtl` values are corrections, not preferences. Latin tracking pulls
 * apart Arabic's joined letterforms, and uppercase means nothing in a script
 * with no case — an eyebrow that leans on caps for hierarchy must lean on
 * weight or colour instead.
 */
export const Typography = {
  latinFamily: 'Kumbh Sans',
  arabicFamily: 'Cairo',
  rtl: {
    letterSpacing: 0,
    textTransform: 'none',
  },
};

/**
 * The native launch screen, and the JS splash that has to match it.
 *
 * The mark is centred ignoring safe areas so it does not shift between
 * devices, and the background is the screen canvas in BOTH appearances: the
 * product is light-only, so a dark launch screen would flash dark and snap to
 * a light app.
 *
 * Anything else a splash wants to show — progress, an OTA status, a tagline —
 * hangs below the mark and never moves it. That is what makes the handoff from
 * the native screen to the JS one invisible.
 *
 * The Android values are the platform's own splash geometry (API 31+): the
 * icon sits inside a 192dp circle on a 288dp canvas.
 */
const phoneMarkSize = 96;

export const LaunchScreen = {
  markSize: {
    phone: phoneMarkSize,
    // Derived, not typed out: a tablet mark that disagrees with the scale is
    // a discrepancy nobody would notice by reading either number alone.
    tablet: Math.round(phoneMarkSize * TabletScale),
  },
  background: rebrandScreenCanvas,
  android: {
    splashCanvas: 288,
    splashIconDiameter: 192,
  },
};

/**
 * System chrome — the status bar, native dialogs, pickers, the keyboard.
 *
 * The product is light-only, so chrome is pinned to light regardless of the
 * device setting. Android's `DayNight` theme is why a native picker could go
 * dark inside a light app.
 *
 * A screen with a dark or coloured header overrides `statusBar` at the
 * navigator level, never through a global call: the app-wide iOS status bar
 * API is a no-op from iOS 27 on.
 *
 * If a dark theme is ever added, a manual theme choice has to override the
 * system appearance (`Appearance.setColorScheme`), not just the React tree —
 * otherwise the keyboard and alerts stay on the device's setting.
 */
export const SystemChrome = {
  colorScheme: 'light',
  statusBar: 'dark-content',
};

/**
 * Icon geometry, in mobile points. Solar Linear (ADR §6), drawn as SVG.
 *
 * Sizes are named by the role they serve rather than by number, because the
 * sizes in use before this were 12, 14, 16, 18, 20 and 28 — six values for
 * four jobs, which is what happens when the call site picks a number.
 *
 * `strokeWidth` and `grid` are Solar's own: a stroke tuned for a different
 * grid reads as a different icon set.
 *
 * Colour is not here on purpose: an icon inherits the text colour of its role,
 * and only the single per-screen accent may tint one.
 */
export const IconTokens = {
  size: {
    inline: 16,
    action: 20,
    navigation: 24,
    feature: 32,
  },
  strokeWidth: 1.5,
  grid: 24,
};
