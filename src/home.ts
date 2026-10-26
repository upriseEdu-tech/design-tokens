import { colourSourcesOf, resolveTokens } from './colourSource.js';
import type { TokenDefinition } from './colourSource.js';
import type { ColorScheme } from './roles.js';

/**
 * The home/rebrand tokens both React Native apps share.
 *
 * Two siblings are deliberately absent: `priorityPairSurface` and `heroSurface`
 * pick their value from `Platform.OS`, and nothing here may import
 * `react-native` — the dashboard consumes this package too. Each app composes
 * those two, and its own app-specific tokens, on top of this object.
 *
 * Colours are sources (a role, `{ light, dark }` or `{ same }`, see
 * colourSource.ts), resolved per scheme by `sharedHomeTokens(scheme)`. Light
 * changed once, on purpose (owner, 2026-10-26: one value per job): the greys
 * and inks that did the same job as `titleColor` / `subtitleColor` became
 * `text` / `textMuted`, and the near-equal chip greys became `surfaceSunken`.
 * test/scheme-tokens.test.js lists every value that moved.
 */
const definition = {
  screenBackground: 'canvas',
  screenGlowTopOpacity: 0.28,
  screenGlowBottomOpacity: 0.22,
  screenAmbientGlowTop: { light: '#E6E6EA', dark: 'surfaceSunken' },
  screenAmbientGlowBottom: { light: '#EBEBEF', dark: 'surfaceSunken' },
  pageHorizontalPadding: 18,
  pageTopPadding: 14,
  sectionGap: 14,
  priorityClusterGap: 10,
  priorityPairBorder: { same: 'rgba(132,129,253,0.2)' },
  priorityPairIconShellBg: 'surfaceSunken',
  priorityPairIconShellBorder: { same: 'rgba(132,129,253,0.14)' },
  priorityPairShadowOpacity: 0.075,
  sectionHeaderGap: 8,
  cardRadius: 20,
  cardInnerRadius: 16,
  chipRadius: 12,
  cardBorderColor: { same: 'rgba(132,129,253,0.14)' },
  mutedBorder: 'border',
  cardShadowColor: 'shadow',
  titleColor: 'text',
  subtitleColor: 'textMuted',
  calmGhostSurface: 'surfaceSunken',
  playfulTint: 'primaryTint',
  playfulTintStrong: 'primaryTintStrong',
  playfulAccent: 'primary',
  /**
   * Readable counterpart to `playfulAccent`. `playfulAccent` is
   * `Colors.primary100`, which measures 2.90:1 on light `playfulTint` — text or
   * icons on a tinted ground must use this instead (light: 5.21:1 on
   * `playfulTint`, 4.71:1 on `playfulTintStrong`; dark: 5.46 and 4.79). Reserve `playfulAccent`
   * for borders, dots and solid fills, which carry no contrast duty.
   */
  playfulAccentText: 'primaryText',
  foodEmptyIconBg: 'primaryTint',
  foodEmptyIconTint: 'primaryText',
  foodEmptyTitle: 'text',
  foodEmptySubtitle: 'textMuted',
  foodFlatMealEyebrow: 'textMuted',
  /**
   * The two chat tokens more than one app reads. `mobile` and the dashboard
   * both had them, at the same values, in their own files — two copies of one
   * hex is what this package exists to stop.
   *
   * The name is narrower than the use and stays that way on purpose: `mobile`
   * reads this pair on its Learnings screen, not in chat. Renaming would
   * touch five dashboard call sites for no behaviour, so the pair keeps the
   * name its consumers already know.
   *
   * The other four `chat*` tokens are not here. `chatSurface`, `chatIconBg`
   * and `chatIconTint` belong to the dashboard's admin chat and nothing else
   * uses them; `chatBorder` was dead in both apps and is gone. The staff app
   * has no chat tokens at all and needs none — its chat screens are styled
   * from the general card family, which is what the rest of that app uses.
   */
  chatMetaBg: 'primaryTint',
  chatMetaText: 'textMuted',
  welcomeBrandSurface: 'surfaceFrosted',
  welcomeBrandBorder: 'border',
  // The welcome screen's nursery name keeps its own violet in light; no role is
  // that colour, and the owner didn't ask for it to move.
  welcomeNurseryText: { light: '#5E58A6', dark: 'primaryText' },
} as const satisfies TokenDefinition;

/** Where each colour key comes from, for the tests and the swatch sheet. */
export const SharedHomeColourSources = colourSourcesOf(definition);

export function sharedHomeTokens(scheme: ColorScheme) {
  return resolveTokens(definition, scheme);
}

/** The light scheme, under the name every 0.7.x consumer reads. */
export const SharedHomeTokens = sharedHomeTokens('light');
