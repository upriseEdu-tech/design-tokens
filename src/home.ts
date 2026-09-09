import { Colors, rebrandScreenCanvas } from './colors';

/**
 * The home/rebrand tokens both React Native apps share.
 *
 * Two siblings are deliberately absent: `priorityPairSurface` and `heroSurface`
 * pick their value from `Platform.OS`, and nothing here may import
 * `react-native` — the dashboard consumes this package too. Each app composes
 * those two, and its own app-specific tokens, on top of this object.
 */
export const SharedHomeTokens = {

  screenBackground: rebrandScreenCanvas,
  screenGlowTopOpacity: 0.28,
  screenGlowBottomOpacity: 0.22,
  screenAmbientGlowTop: '#E6E6EA',
  screenAmbientGlowBottom: '#EBEBEF',
  pageHorizontalPadding: 18,
  pageTopPadding: 14,
  sectionGap: 14,
  priorityClusterGap: 10,
  priorityPairBorder: 'rgba(132,129,253,0.2)',
  priorityPairIconShellBg: '#F0EFF5',
  priorityPairIconShellBorder: 'rgba(132,129,253,0.14)',
  priorityPairShadowOpacity: 0.075,
  sectionHeaderGap: 8,
  cardRadius: 20,
  cardInnerRadius: 16,
  chipRadius: 12,
  cardBorderColor: 'rgba(132,129,253,0.14)',
  mutedBorder: 'rgba(26,23,50,0.08)',
  cardShadowColor: '#17142A',
  titleColor: '#1A1732',
  subtitleColor: '#6F6B8A',
  calmGhostSurface: '#EEEFF2',
  playfulTint: Colors.primary10,
  playfulTintStrong: Colors.primary20,
  playfulAccent: Colors.primary100,
  /**
   * Readable counterpart to `playfulAccent`. `playfulAccent` is
   * `Colors.primary100`, which measures 2.90:1 on `playfulTint` — text or
   * icons on a tinted ground must use this instead (5.21:1 on
   * `playfulTint`, 4.71:1 on `playfulTintStrong`). Reserve `playfulAccent`
   * for borders, dots and solid fills, which carry no contrast duty.
   */
  playfulAccentText: Colors.primaryText,
  foodEmptyIconBg: 'rgba(132,129,253,0.10)',
  foodEmptyIconTint: Colors.primaryText,
  foodEmptyTitle: '#3D3958',
  foodEmptySubtitle: '#8A869E',
  foodFlatMealEyebrow: '#6B6788',
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
  chatMetaBg: 'rgba(132,129,253,0.10)',
  chatMetaText: '#57527A',
  welcomeBrandSurface: 'rgba(255,255,255,0.96)',
  welcomeBrandBorder: 'rgba(26,23,50,0.08)',
  welcomeNurseryText: '#5E58A6',
} as const;
