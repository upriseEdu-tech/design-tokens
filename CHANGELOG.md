# Changelog

## [0.8.0] - 2026-10-27

Dark mode's foundation (spec `docs/superpowers/specs/2026-10-26-dark-mode-design.md`). Every existing export keeps its name; consumers pin exact versions, so nothing moves until an app bumps.

### Added
- `Roles` (`LightRoles`, `DarkRoles`), with `ColorScheme`, `RoleName` and `BrandFamilies`: 41 colour roles, each with a light value and a graphite dark value. Every text role reaches AA (4.5:1) on its grounds in both schemes.
- `sharedHomeTokens(scheme)`, `navigationShellTokens(scheme)`, `systemChrome(scheme)` and `launchScreenBackground(scheme)`. `SharedHomeColourSources`, `NavigationShellColourSources`, `resolveColour` and `ColourSource` say where each colour comes from.
- `contrastRatio(foreground, background)` and `compositeOver(foreground, alpha, background)`: the WCAG maths behind every ratio in this package, for opaque `#RRGGBB` only.

### Changed (light)
The owner chose one value per job (2026-10-26). These light values move; everything else in light is unchanged, and `test/scheme-tokens.test.js` fails on any other light change.

| Token | 0.7.2 | 0.8.0 |
|---|---|---|
| `SharedHomeTokens.priorityPairIconShellBg` | `#F0EFF5` | `#F1F0F6` |
| `SharedHomeTokens.calmGhostSurface` | `#EEEFF2` | `#F1F0F6` |
| `SharedHomeTokens.foodEmptyTitle` | `#3D3958` | `#1A1732` |
| `SharedHomeTokens.subtitleColor` | `#6F6B8A` | `#63607E` |
| `SharedHomeTokens.foodEmptySubtitle` | `#8A869E` | `#63607E` |
| `SharedHomeTokens.foodFlatMealEyebrow` | `#6B6788` | `#63607E` |
| `SharedHomeTokens.chatMetaText` | `#57527A` | `#63607E` |
| `SharedHomeTokens.foodEmptyIconBg` | `rgba(132,129,253,0.10)` | `#F3F2FF` |
| `SharedHomeTokens.chatMetaBg` | `rgba(132,129,253,0.10)` | `#F3F2FF` |
| `SharedHomeTokens.welcomeBrandSurface` | `rgba(255,255,255,0.96)` | `rgba(255,255,255,0.94)` |
| `NavigationShellTokens.tabBar.inactiveColor` | `#929292` | `#63607E` |
| `NavigationShellTokens.tabBar.shadowColor` | `#000000` | `#17142A` |
| `NavigationShellTokens.header.pillShadowColor` | `#1A1732` | `#17142A` |

The `successText` and `dangerText` roles are darker than `Colors.greenText` and `Colors.redText` (`#357733` and `#C63234`). Those two measured 4.47:1 on the canvas and 4.27:1 on the chip surface. The `Colors` enum itself is unchanged.

## Earlier versions

Before 0.8.0 the version was recorded in commit subjects only (`git log --oneline`).
