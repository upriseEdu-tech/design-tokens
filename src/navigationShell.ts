import { Colors, androidElevatedCardSurface } from './colors';

/**
 * The navigation shell's DATA. Both RN apps declared this identically — the
 * only differences between their two copies were one comment and one line
 * wrap — so it lives here now.
 *
 * The helpers that read these values do NOT live here. `getTabBarSurfaceColor`
 * and its siblings call `Platform.select`, and the dashboard consumes this
 * package: importing react-native here would break it. Each RN app keeps its
 * own helpers and imports this object.
 */
export const NavigationShellTokens = {
  android: {
    bottomSystemInsetFloor: 16,
  },
  tabBar: {
    minHeight: 72,
    borderRadius: 22,
    horizontalPadding: 14,
    itemVerticalPadding: 6,
    itemHorizontalPadding: 6,
    iosIconSize: 19,
    androidIconSize: 20,
    iosLabelFontSize: 11,
    androidLabelFontSize: 12,
    labelLineHeight: 14,
    activeColor: Colors.primary100,
    inactiveColor: Colors.gray,
    iosBackground: 'rgba(255,255,255,0.72)',
    androidBackground: androidElevatedCardSurface,
    borderColor: 'rgba(132,129,253,0.14)',
    shadowColor: Colors.black,
    activePill: 'rgba(132,129,253,0.10)',
    activePillBorder: 'rgba(132,129,253,0.18)',
  },
  header: {
    containerHeight: 104,
    horizontalPadding: 14,
    iosTopPadding: 34,
    androidTopPadding: 12,
    titleFontSize: 20,
    titleLineHeight: 26,
    titleColor: '#1A1732',
    iconButtonSize: 42,
    iconSize: 20,
    iosBackground: 'transparent',
    androidBackground: 'transparent',
    borderColor: 'transparent',
    backButtonBgIOS: 'rgba(255,255,255,0.90)',
    backButtonBgAndroid: androidElevatedCardSurface,
    backButtonBorder: 'rgba(132,129,253,0.20)',
    iconTint: Colors.primary100,
    pillHeight: 56,
    pillRadius: 22,
    pillHorizontalPadding: 12,
    /** Aligned with home rebrand priority-pair surfaces */
    pillBackgroundIOS: 'rgba(255,255,255,0.94)',
    pillBackgroundAndroid: androidElevatedCardSurface,
    pillBorderColor: 'rgba(132,129,253,0.2)',
    pillShadowColor: '#1A1732',
    pillShadowOpacityIOS: 0.1,
    pillShadowOpacityAndroid: 0.16,
  },
} as const;
