# @upriseedu-tech/design-tokens

The design tokens the Uprise apps share: `teacher`, `mobile` and `dashboard`.

## What is in here, and what is not

**In:** the brand palette — `Colors`, `rebrandScreenCanvas`,
`androidElevatedCardSurface` — plus `SharedHomeTokens`, `NavigationShellTokens`,
and the ADR 0001 values: `LayoutRhythm`, `Typography`, `LaunchScreen`,
`SystemChrome`, `IconTokens` and `TabletScale`.

`LayoutRhythm` holds spacing BETWEEN components, in mobile points. The rule it
serves is the half a token cannot hold: gaps belong to the parent. A component
never margins itself away from its siblings — the screen or stack that owns
them sets `gap` and pads once. Mobile's list gutters reached 38 because a
wrapper added its own 20 under the screen's 18.

`Typography.arabicFamily` is Cairo, and `latinFamily` stays Kumbh Sans. Cairo
ships Latin glyphs of its own, so selecting it per *screen direction* rather
than per *string's script* silently restyles every Latin word on an Arabic
screen. Order the web stack Kumbh Sans first.

**Not in, deliberately:**

- `PlatformColorsIOS` / `PlatformColorsAndroid` — platform system colour names,
  used only by the React Native apps. They stay in each app's own
  `core/theme/colors.ts`.
- Anything that imports `react-native`. The dashboard consumes this package, so
  a `Platform.select` in here would break its build. `navigationShell`'s `get*`
  helpers stay in the apps and read the shared data.
- `commonSizes` — the sizes are one scale for both RN apps (ADR 0001 §1, closed
  2026-10-21: the Staff ×1.96 tablet multiplier is gone), and they live in
  `@upriseedu-tech/rn-ui`'s `CommonSizes`, not here and not in the apps.
- MUI's palette shape and typography. The dashboard maps these values onto its
  own structure.

**No runtime dependencies, ever.** Three apps across two React Native versions
and one Vite build; a dependency here is a version conflict in three places.

## Consuming it

```
@upriseedu-tech:registry=https://npm.pkg.github.com
```

in the app's `.npmrc`, then `npm install @upriseedu-tech/design-tokens`.

**Both RN apps need `--legacy-peer-deps`** on any install: they carry a
pre-existing ESLint 10 peer conflict that predates this package and also breaks
`npm run lint`.

## Publishing

`npm publish` runs the build first. Needs a token with `write:packages` on the
`upriseEdu-tech` org.

## The rule this package exists to enforce

A value lives here or in exactly one app, never in both. Each app has a drift
check that fails when a colour literal duplicates a token — see the shared
tokens plan in `teacher/docs/superpowers/plans/`.

## check-token-drift

Ships as a bin. Each app runs it over its own `src/` and fails when a colour
literal duplicates a brand value this package exports:

```sh
check-token-drift src [--allow <path fragment>]...
```

Bounded to exact matches, and to *brand* values — the generic neutrals
(white, black, the utility greys, `background`) are excluded, because
`#FFFFFF` in an app is white rather than a copy of `Colors.white`, and a
check whose findings can only be suppressed stops being read.

Hexes inside comments are ignored: the contrast tables in these theme files
quote the very values they compute. A single line can opt out with a
`token-drift-ok` comment; `--allow` takes a path fragment for the few places
where naming a hex is the point — a stylesheet that cannot import JS, a colour
picker whose hexes are user-facing data.

## Feedback and icons (spec 2026-10-15)

- **Icons:** apps name a concept, action or status — `IconConcepts.pickup`, never a glyph. One concept, one Solar Linear glyph, on every platform; `npm test` fails on a glyph with two meanings or one Solar doesn't have. RN renders `solarLinearName(glyph)`, the dashboard `iconifyName(glyph)`.
- **Feedback:** every toast, inline error and confirmation comes from `FeedbackMessages` (en/ar). Failed writes use `feedbackForError(locale, { code, status }, action, item)` — a known code, else its family, else the HTTP status, else the action message; the server's `message` is never shown. Successful writes use `feedbackForSuccess`. One report per failure; a failed load is the screen's error state, never a toast.
- **Backend codes:** `test/fixtures/backend-codes.json` lists every code the backend can send. After a backend change adds one, run `node scripts/sync-backend-codes.mjs <path to backend>` and commit the result; `npm test` then names any code with no entry and no family.
