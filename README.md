# @upriseedu-tech/design-tokens

The design tokens the Uprise apps share: `teacher`, `mobile` and `dashboard`.

## What is in here, and what is not

**In:** the brand palette — `Colors`, `rebrandScreenCanvas`, `androidElevatedCardSurface`.

**Not in, deliberately:**

- `PlatformColorsIOS` / `PlatformColorsAndroid` — platform system colour names,
  used only by the React Native apps. They stay in each app's own
  `core/theme/colors.ts`.
- Anything that imports `react-native`. The dashboard consumes this package, so
  a `Platform.select` in here would break its build. `navigationShell`'s `get*`
  helpers stay in the apps and read the shared data.
- `commonSizes` — the two RN apps' copies differ **by design**: `teacher` is
  `mobile` × 1.96 for tablet scaling.
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
