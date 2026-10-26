import { colourSourcesOf, resolveTokens } from './colourSource.js';
import type { TokenDefinition } from './colourSource.js';
import type { ColorScheme } from './roles.js';

/**
 * The navigation shell's DATA. Both RN apps declared this identically — the
 * only differences between their two copies were one comment and one line
 * wrap — so it lives here now.
 *
 * The helpers that read these values do NOT live here. `getTabBarSurfaceColor`
 * and its siblings call `Platform.select`, and the dashboard consumes this
 * package: importing react-native here would break it. Each RN app keeps its
 * own helpers and imports this object.
 *
 * Colours are sources resolved per scheme by `navigationShellTokens(scheme)`
 * (see colourSource.ts). Three light values moved with the owner's
 * consolidation (2026-10-26): the inactive tab colour #929292 (3.11:1 on white)
 * became `textMuted`, and the two shadow colours became `shadow`.
 */
const definition = {
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
    activeColor: 'primary',
    inactiveColor: 'textMuted',
    iosBackground: { light: 'rgba(255,255,255,0.72)', dark: 'surfaceFrosted' },
    androidBackground: 'surfaceElevatedAndroid',
    borderColor: { same: 'rgba(132,129,253,0.14)' },
    shadowColor: 'shadow',
    activePill: { same: 'rgba(132,129,253,0.10)' },
    activePillBorder: { same: 'rgba(132,129,253,0.18)' },
  },
  header: {
    containerHeight: 104,
    horizontalPadding: 14,
    iosTopPadding: 34,
    androidTopPadding: 12,
    titleFontSize: 20,
    titleLineHeight: 26,
    titleColor: 'text',
    iconButtonSize: 42,
    iconSize: 20,
    iosBackground: { same: 'transparent' },
    androidBackground: { same: 'transparent' },
    borderColor: { same: 'transparent' },
    backButtonBgIOS: { light: 'rgba(255,255,255,0.90)', dark: 'surfaceFrosted' },
    backButtonBgAndroid: 'surfaceElevatedAndroid',
    backButtonBorder: { same: 'rgba(132,129,253,0.20)' },
    iconTint: 'primary',
    pillHeight: 56,
    pillRadius: 22,
    pillHorizontalPadding: 12,
    /** Aligned with home rebrand priority-pair surfaces */
    pillBackgroundIOS: 'surfaceFrosted',
    pillBackgroundAndroid: 'surfaceElevatedAndroid',
    pillBorderColor: { same: 'rgba(132,129,253,0.2)' },
    pillShadowColor: 'shadow',
    pillShadowOpacityIOS: 0.1,
    pillShadowOpacityAndroid: 0.16,
  },
} as const satisfies TokenDefinition;

/** Where each colour key comes from, for the tests and the swatch sheet. */
export const NavigationShellColourSources = colourSourcesOf(definition);

export function navigationShellTokens(scheme: ColorScheme) {
  return resolveTokens(definition, scheme);
}

/** The light scheme, under the name every 0.7.x consumer reads. */
export const NavigationShellTokens = navigationShellTokens('light');
