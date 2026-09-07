/**
 * The Uprise brand palette.
 *
 * `PlatformColorsIOS` and `PlatformColorsAndroid` deliberately are NOT here:
 * they name platform system colours, only the React Native apps use them, and
 * the dashboard has no business carrying them. They stay in each RN app's own
 * `core/theme/colors.ts` alongside the re-export of this file.
 */
export enum Colors {
  black = '#000000',
  white = '#FFFFFF',
  gray = '#929292',
  gray2 = '#949494',
  gray5 = '#E0E0E0',
  background = '#F9FCFF',
  gray_disabled = '#BDBDBD',
  lightGray = '#BDBDBD',
  darkGray = '#262626',
  green = '#4DAD4A',
  red = '#CE3C3E',
  transparent = 'transparent',
  primary100 = '#8481FD',
  primary50 = '#C1C0FE',
  primary20 = '#E6E6FF',
  primary10 = '#F3F2FF',
  primary5 = '#F9F9FF',
  teal100 = '#1ED3B8',
  teal50 = '#8EE9DB',
  teal20 = '#D2F6F1',
  teal10 = '#E9FBF8',
  teal5 = '#F4FDFB',
  blue100 = '#52BDFF',
  blue50 = '#A8DEFF',
  blue20 = '#DCF2FF',
  blue10 = '#EEF8FF',
  blue5 = '#F6FCFF',
  coral100 = '#F2565E',
  coral50 = '#F9AAAF',
  coral20 = '#FCDDDF',
  coral10 = '#FEF7F7',
  coral5 = '#FEF7F7',
  orange100 = '#F79E69',
  orange50 = '#FBCEB4',
  orange20 = '#FDECE1',
  orange10 = '#FEF5F0',
  orange5 = '#FFFAF8',
  yellow100 = '#FFDF75',
  yellow50 = '#FFEFBA',
  yellow20 = '#FFF8E3',
  yellow10 = '#FFFCF1',
  yellow5 = '#FFFDF8',

  // Text-on-tint. A 100-level brand colour on its own tint is unreadable — on
  // the 10 tint it reaches at best 3.17:1 and usually under 2. Each value
  // below is the family's 100 darkened in HSL to 4.71:1 against that family's
  // **20** tint, the darkest surface any chip uses. Computing against the 20
  // rather than the 10 is what lets ONE token serve every tint level: each
  // then has more headroom on the lighter 10 tint and on white, so the same
  // token is safe on a chip, a card and body text alike.
  //   token        on <fam>20   on <fam>10   on white
  //   primaryText     4.71         5.21         5.77
  //   tealText        4.71         5.08         5.44
  //   blueText        4.71         5.05         5.43
  //   coralText       4.71         5.66         5.98
  //   orangeText      4.71         5.04         5.42
  //   yellowText      4.71         4.87         5.00
  primaryText = '#4C48FC',
  tealText = '#117768',
  blueText = '#006EB1',
  coralText = '#C70F19',
  orangeText = '#B3490A',
  yellowText = '#8B6B00',
  // green/red have no 10 or 20 tint in this palette — they are flat values, so
  // no chip sits on them. Both are measured on white only and are unchanged.
  greenText = '#3A8238',
  // redText is `red` unchanged: it already computes 4.84:1 on white.
  redText = '#CE3C3E',
  // Neutral text on the '#F1F0F6' default-chip surface. subtitleColor
  // (#6F6B8A) measures 4.47:1 there — a marginal fail — but it is a
  // product-wide token, so this is a chip-local replacement: 5.29:1 on
  // #F1F0F6, 5.99:1 on white.
  neutralText = '#63607E',
}

/** Full-screen canvas — low-chroma rebrand background */
export const rebrandScreenCanvas = '#F8F8FA';

/** Opaque card/chrome on Android (frosted white + elevation looks harsh) */
export const androidElevatedCardSurface = '#F5F5F9';
