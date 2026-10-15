# Plan 3: React Native foundations (staff and parent apps) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give both phone apps the shared foundations every later screen sweep uses:
- one `<Icon concept|action|status|feedback>` drawn from the registry;
- one toast;
- one API error policy that reports a failed write once, in the catalogue's words;
- one `ConfirmSheet`;
- the staff navigation's icons from the registry;
- guards that stop regressions.

**Architecture:**
- **Pure logic is unit-tested with Jest** and lives in modules with no React: `src/core/feedback/feedback.ts`, `src/core/api/errorPolicy.ts` and the icon resolver.
- **Components are thin.** `Icon`, `ConfirmSheet` and `SnackbarProvider` render what the pure layer decides.
- **Shared code is identical in both apps.** Files that are byte-identical today (`solarIconMap.ts`, `snackbarService.ts`, `generate-solar-glyphs.js`) stay identical. Every new shared file is written once and copied, and `cmp` confirms it in each task.
- **Uncertain icon meanings stay put.** Call sites whose meaning depends on the screen stay on `IconPlatform`, counted per file in a baseline the screen sweeps (Plans 5 and 6) shrink to zero.

**Tech Stack:** React Native 0.87.1, React 19.2, TypeScript 6, Redux Toolkit 2.12, Jest 30 (`@react-native/jest-preset`), `react-native-svg` 15, `react-native-actions-sheet` 10.1.2, `@upriseedu-tech/design-tokens` ^0.7.1.

**Spec:** `docs/superpowers/specs/2026-10-15-cross-app-design-consistency-design.md`:
- §5 and §5.1 (feedback, phone apps)
- §6 (icons) and §6.2 (RN icon component, staff navigation, guards)
- §8.1–§8.3 (smoothness groundwork and baselines)
- §10 (verification)

The roadmap note says the RN runtime baselines are taken at the start of this plan. The static baseline is `docs/audits/2026-10-smoothness-baseline.md` §1–§2.

## Global Constraints

- **Icons:** Solar Linear only, resolved through `IconConcepts` / `IconActions` / `IconStatuses` / `IconFeedback`. Sizes come from `IconTokens.size` (16/20/24/32). A selected tab may use the Bold variant of the same glyph. No PNGs, emoji or text characters as icons. Activity artwork is content.
- **Feedback:**
  - Text comes from `FeedbackMessages`; the server's `message` is never shown.
  - A failed GET is the screen's error state, never a toast.
  - A failed write gets exactly one error toast, from the API layer, unless the request opts out with `skipErrorToast` and the screen reports through `notifyError`.
  - `Alert.alert` survives only for OS permission rationale.
- **`ConfirmSheet`** uses `react-native-actions-sheet`, the library both apps already ship and use for every sheet (17 files in mobile, `AddMediaSheet` in teacher). This is a deliberate deviation from spec §5.1, which says `@gorhom/bottom-sheet` "as the parent app's sheets already are". That premise is false: `@gorhom/bottom-sheet` 5.2.14 is in mobile's `package.json` but has 0 imports. Using actions-sheet adds no native dependency to the staff app.
- **i18n:** every new string is in en and ar. `npm run check:i18n` passes in both apps.
- **RTL:** native RTL owns direction. Use `Start`/`End` and `RTLAware*` components; never JS-side flipping. Directional glyphs mirror in `Icon`, once.
- **Versions stay frozen** at Staff 6.0.2 and Parent 3.0.0.
- **Native dependencies:** the staff app loses `react-native-snackbar` (Task 4) and gains none. That's a native change: rebuild, then `cd ios && bundle exec pod install`.
- **Work in worktrees** `../.worktrees/teacher-foundations` and `../.worktrees/mobile-foundations`, both on branch `feat/rn-foundations`, off `origin/main`. Never touch another session's checkout.
- **Commits:** Conventional Commits, authored by Fady Shawky, with no AI attribution. Each repo gets one PR with `## Verification`.
- **CI:** both repos' CI fails `npm ci` with a 403 on the private package. Run the CI steps locally and report them literally.

## Review Focus

1. **A failed write while a token refresh is in flight.** The request is retried after the refresh. If the retry fails, exactly one toast, never one for the 401 and one for the retry. Pinned in Task 5 (the interceptor test).
2. **A refused refresh with three requests queued** (staff app on a flaky tablet). One "Your session ended" toast, then the login screen, not three toasts. Pinned in Task 5 (`notifySessionEnded` dedupe).
3. **Arabic with a directional icon.** `back` must point right in RTL, and `forward` left. `send` (paper plane) mirrors too. Pinned in Task 1 (`resolveIcon` mirror).
4. **A confirm sheet dismissed by swiping down or tapping the backdrop.** It must resolve `false`, never leave the caller's promise hanging. Pinned in Task 6.
5. **A screen that already toasts its own error and calls a write without `skipErrorToast`.** That's two reports. The guard can't see this, so Task 5 Step 6 lists the known self-reporting call sites and sets `skipErrorToast` on each.

---

### Task 0: Runtime baselines on release builds

**Files:**
- Create: `docs/audits/2026-10-rn-runtime-baseline.md` in `design-tokens`, on a branch `docs/rn-runtime-baseline` off `origin/main`.

**Interfaces:**
- Produces: the before numbers that Plans 5 and 6 compare against (spec §8.2: main lists average at least 55 fps under Flashlight on the Android emulator).

- [ ] **Step 1: Build release APKs of both apps at `origin/main`**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/$app && git fetch origin
  git worktree add --detach ../.worktrees/$app-baseline origin/main
  cd ../.worktrees/$app-baseline && npm ci --legacy-peer-deps
  cd android && ./gradlew assembleRelease && cd ..
  ls -la android/app/build/outputs/apk/release/
done
```

The release signing reads the upload keystore passwords from `~/.gradle/gradle.properties`. Never print them. The private package install needs `UPRISE_NPM_TOKEN` from `~/.zshrc`.

Expected: one `app-release.apk` per app.

- [ ] **Step 2: Measure the main lists with Flashlight**

Install Flashlight per its documentation. This is a third-party CLI download, so ask the owner before installing it. Then, on one Android emulator (Pixel 6, API 34), against a local backend on the snapshot with local test accounts:
- **Staff app:** Students list, Gallery (album grid), Notifications, Attendance history.
- **Parent app:** Home feed, Album gallery, Notifications.

For each list, run `flashlight measure` while scrolling top to bottom three times (`adb shell input swipe 540 1600 540 400 300`, ten swipes). Record the average FPS, the minimum FPS and the JS-thread CPU.

- [ ] **Step 3: Record React Profiler render counts on the slowest screens**

In debug builds, open React DevTools (`npx react-devtools`) and record:
- Staff Home, from cold open to idle
- Parent Home, from cold open to idle

Record the commit count and the slowest commit's duration.

- [ ] **Step 4: Write the report and commit**

Write `docs/audits/2026-10-rn-runtime-baseline.md`, with one table per app (screen, average fps, minimum fps, JS CPU, commit count, slowest commit ms), the device, the build commit, and the date. Then:

```bash
git add docs/audits/2026-10-rn-runtime-baseline.md
git commit -m "docs(audit): RN runtime baseline before the foundations"
```

Remove the two baseline worktrees afterwards: `git worktree remove ../.worktrees/<app>-baseline`.

---

### Task 1: `<Icon>` from the registry (both apps)

**Files** (both apps; the shared files are identical):
- Modify: `package.json`. Set `@upriseedu-tech/design-tokens` to `^0.7.1`.
- Create: `src/common/components/icons/Icon.tsx` (shared)
- Modify: `scripts/generate-solar-glyphs.js` (shared). Also emit every registry glyph.
- Regenerate: `src/common/components/icons/solarGlyphs.ts` (shared, generated)
- Create: `__tests__/iconRegistry.test.ts` (shared)

**Interfaces:**
- Produces:
  - `type IconRef = { concept: IconConcept } | { action: IconAction } | { status: IconStatus } | { feedback: IconFeedbackKind }`
  - `resolveIcon(ref: IconRef): { name: string; xml: string | undefined; mirror: boolean }`. `mirror` is true in RTL for a directional glyph.
  - `<Icon {...ref} size? color? style? testID? />`. The default size is `IconTokens.size.navigation`.

- [ ] **Step 1: Set up both worktrees**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/$app && git fetch origin
  git worktree add -b feat/rn-foundations ../.worktrees/$app-foundations origin/main
  cd ../.worktrees/$app-foundations
  npm install --legacy-peer-deps @upriseedu-tech/design-tokens@^0.7.1
done
```

If the install returns 401, load the token for the command only: `eval "$(grep '^export UPRISE_NPM_TOKEN=' ~/.zshrc)"`.

- [ ] **Step 2: Write the failing test**

Create `__tests__/iconRegistry.test.ts` in the teacher worktree:

```ts
/**
 * Every icon is a registry concept, action, status or feedback kind, drawn
 * from the generated Solar Linear set (spec 2026-10-15 §6). A glyph missing
 * from SOLAR_GLYPHS renders as nothing — the failure this guards against.
 */
import { I18nManager } from 'react-native';
import {
  IconActions,
  IconConcepts,
  IconFeedback,
  IconStatuses,
  solarLinearName,
} from '@upriseedu-tech/design-tokens';
import { resolveIcon } from '../src/common/components/icons/Icon';
import { SOLAR_GLYPHS } from '../src/common/components/icons/solarGlyphs';

describe('icon registry', () => {
  it('has a glyph for every registry entry', () => {
    const all = [IconConcepts, IconActions, IconStatuses, IconFeedback].flatMap(m => Object.values(m));
    const missing = all.map(solarLinearName).filter(name => !SOLAR_GLYPHS[name]);
    expect(missing).toEqual([]);
  });

  it('resolves each kind of reference', () => {
    expect(resolveIcon({ concept: 'pickup' }).name).toBe('car-linear');
    expect(resolveIcon({ action: 'close' }).name).toBe('close-linear');
    expect(resolveIcon({ status: 'pending' }).name).toBe('hourglass-linear');
    expect(resolveIcon({ feedback: 'offline' }).xml).toBe(SOLAR_GLYPHS['cloud-cross-linear']);
  });

  it('mirrors directional glyphs in RTL only', () => {
    const rtl = jest.replaceProperty(I18nManager, 'isRTL', true);
    expect(resolveIcon({ action: 'back' }).mirror).toBe(true);
    expect(resolveIcon({ action: 'send' }).mirror).toBe(true);
    expect(resolveIcon({ concept: 'home' }).mirror).toBe(false);
    rtl.restore();
    expect(resolveIcon({ action: 'back' }).mirror).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- __tests__/iconRegistry.test.ts`
Expected: FAIL. `Cannot find module '../src/common/components/icons/Icon'`.

- [ ] **Step 4: Write `Icon.tsx`**

Create `src/common/components/icons/Icon.tsx`:

```tsx
import React, { FC, memo } from 'react';
import { ColorValue, I18nManager, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  IconActions,
  IconConcepts,
  IconFeedback,
  IconStatuses,
  IconTokens,
  solarLinearName,
  type IconAction,
  type IconConcept,
  type IconFeedbackKind,
  type IconStatus,
} from '@upriseedu-tech/design-tokens';
import { SOLAR_GLYPHS } from './solarGlyphs';

/**
 * One concept, one glyph, on every platform (spec 2026-10-15 §6). Screens
 * name what the icon means — `concept="pickup"`, `action="close"` — and the
 * registry in @upriseedu-tech/design-tokens decides what is drawn, so a glyph
 * change there moves all three apps at once.
 */
export type IconRef =
  | { concept: IconConcept; action?: never; status?: never; feedback?: never }
  | { action: IconAction; concept?: never; status?: never; feedback?: never }
  | { status: IconStatus; concept?: never; action?: never; feedback?: never }
  | { feedback: IconFeedbackKind; concept?: never; action?: never; status?: never };

export type IconProps = IconRef & {
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Glyphs that point along the reading direction, mirrored once here instead of
 * at call sites. Vertical chevrons, media controls and checkmarks never belong
 * here (ADR 0001 §2).
 */
const DIRECTIONAL = new Set<string>([
  'alt-arrow-left-linear',
  'alt-arrow-right-linear',
  'arrow-left-linear',
  'arrow-right-linear',
  'login-2-linear',
  'logout-2-linear',
  'plain-linear',
]);

function glyphOf(ref: IconRef): string | undefined {
  if (ref.concept) return IconConcepts[ref.concept];
  if (ref.action) return IconActions[ref.action];
  if (ref.status) return IconStatuses[ref.status];
  if (ref.feedback) return IconFeedback[ref.feedback];
  return undefined;
}

export function resolveIcon(ref: IconRef): { name: string; xml: string | undefined; mirror: boolean } {
  const glyph = glyphOf(ref);
  const name = glyph ? solarLinearName(glyph) : '';
  return {
    name,
    xml: name ? SOLAR_GLYPHS[name] : undefined,
    mirror: I18nManager.isRTL && DIRECTIONAL.has(name),
  };
}

const styles = StyleSheet.create({ mirror: { transform: [{ scaleX: -1 }] } });

export const Icon: FC<IconProps> = memo(props => {
  const { size = IconTokens.size.navigation, color, style, testID } = props;
  const { name, xml, mirror } = resolveIcon(props);
  if (!xml) {
    if (__DEV__) console.warn(`Icon: no glyph for ${JSON.stringify(props)} (${name})`);
    return null;
  }
  const icon = <SvgXml xml={xml} width={size} height={size} color={color} style={style} testID={testID} />;
  return mirror ? <View style={styles.mirror}>{icon}</View> : icon;
});
```

- [ ] **Step 5: Make the generator emit the registry**

In `scripts/generate-solar-glyphs.js`, replace `iconNamesFromMap()`'s return so it also adds every registry glyph:

```js
function iconNamesFromMap() {
  const src = fs.readFileSync(MAP, 'utf8');
  // The map is data, so reading it as text beats importing TypeScript from a
  // plain node script just to enumerate its values.
  const legacy = [...src.matchAll(/'([a-z0-9-]+-linear)'/g)].map(m => m[1]);
  // Every glyph the design-tokens registry names, so <Icon concept=…> can
  // draw any of them (spec 2026-10-15 §6).
  const {
    IconConcepts,
    IconActions,
    IconStatuses,
    IconFeedback,
    solarLinearName,
  } = require('@upriseedu-tech/design-tokens');
  const registry = [IconConcepts, IconActions, IconStatuses, IconFeedback]
    .flatMap(m => Object.values(m))
    .map(solarLinearName);
  return [...new Set([...legacy, ...registry])].sort();
}
```

Then regenerate and copy both shared files to mobile:

```bash
cd /Users/fadyshawky/Dev/uprise/.worktrees/teacher-foundations
npm run icons:generate
for f in scripts/generate-solar-glyphs.js src/common/components/icons/solarGlyphs.ts src/common/components/icons/Icon.tsx __tests__/iconRegistry.test.ts; do
  cp "$f" ../mobile-foundations/"$f"; cmp "$f" ../mobile-foundations/"$f" && echo "same: $f"
done
```

Expected: `wrote N glyphs` with N about 130 (81 legacy plus the registry, minus the overlap), then four `same:` lines.

- [ ] **Step 6: Run the tests to verify they pass, in both apps**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  npm test -- __tests__/iconRegistry.test.ts __tests__/solarIcons.test.ts && npm run typecheck
done
```

Expected: both suites pass in each app, and `tsc --noEmit` is clean.

- [ ] **Step 7: Commit in each app**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  git add package.json package-lock.json scripts/generate-solar-glyphs.js src/common/components/icons/Icon.tsx src/common/components/icons/solarGlyphs.ts __tests__/iconRegistry.test.ts
  git commit -m "feat(icons): <Icon concept|action|status|feedback> drawn from the shared registry"
done
```

---

### Task 2: Move the unambiguous icons, and guard the rest

**Files** (both apps; the scripts are identical):
- Create: `scripts/codemods/icon-platform-to-icon.js`. One-off, kept for the sweeps.
- Create: `scripts/check-consistency.mjs` (the guard)
- Create: `scripts/consistency-baseline.json` (generated)
- Modify: `package.json`. Add `"check:consistency": "node scripts/check-consistency.mjs"`.
- Modify: `.github/workflows/ci.yml`. Add a `npm run check:consistency` step after `check:tokens`.
- Modify: the call sites the codemod rewrites.

**Interfaces:**
- Consumes: Task 1's `Icon`.
- Produces:
  - `npm run check:consistency` fails when a file's `IconPlatform`, icon-PNG or `Alert.alert` count rises above `scripts/consistency-baseline.json`, or when a new file appears with any.
  - `node scripts/check-consistency.mjs --write-baseline` rewrites the baseline and refuses if any count rose.

- [ ] **Step 1: Write the guard (the failing check)**

Create `scripts/check-consistency.mjs`:

```js
#!/usr/bin/env node
// Spec 2026-10-15 §6.2 and §5.1: every icon goes through <Icon> from the
// registry, and Alert.alert is kept only for OS permission rationale. The
// sites the screen sweeps (Plans 5, 6) haven't decided yet are counted per
// file in scripts/consistency-baseline.json; a count may only go down.
//   node scripts/check-consistency.mjs                   # check
//   node scripts/check-consistency.mjs --write-baseline  # after a sweep removes sites
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(root, 'scripts/consistency-baseline.json');

// Raster icons in the staff app (resources/images); artwork such as logos,
// splash and PickupBackground is content and not listed.
const ICON_PNGS = [
  'Assignment', 'Send', 'Setting', 'arrow_left', 'book', 'calendar_check', 'calendar_dots', 'camera', 'car',
  'checkin', 'checkout', 'child', 'close', 'correct', 'delete', 'downArrow', 'edit', 'gallery', 'home', 'logout',
  'message_square', 'notification', 'profile', 'report_right', 'reports', 'retake', 'students_side',
];
const RULES = {
  iconPlatform: /<IconPlatform\b/g,
  iconPng: new RegExp(`ImageResources\\.(${ICON_PNGS.join('|')})\\b`, 'g'),
  // A permission rationale is allowed when the line above says so.
  alert: /Alert\.alert\s*\(/g,
};

const files = [];
const walk = dir => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(name) && !name.endsWith('.g.ts')) files.push(p);
  }
};
walk(path.join(root, 'src'));

const counts = Object.fromEntries(Object.keys(RULES).map(k => [k, {}]));
for (const file of files) {
  const rel = path.relative(root, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const [key, re] of Object.entries(RULES)) {
    let n = 0;
    lines.forEach((line, i) => {
      const hits = line.match(re)?.length ?? 0;
      if (key === 'alert' && hits && /alert-ok: permission rationale/.test(lines[i - 1] ?? '')) return;
      n += hits;
    });
    if (n) counts[key][rel] = n;
  }
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
const rose = [];
for (const key of Object.keys(RULES)) {
  for (const [file, n] of Object.entries(counts[key])) {
    const allowed = baseline[key]?.[file] ?? 0;
    if (n > allowed) rose.push(`${key}  ${file}: ${n} (baseline ${allowed})`);
  }
}

if (process.argv.includes('--write-baseline')) {
  if (rose.length && Object.keys(baseline).length) {
    console.error(`refusing to raise the baseline:\n  ${rose.join('\n  ')}`);
    process.exit(1);
  }
  fs.writeFileSync(BASELINE, `${JSON.stringify(counts, null, 2)}\n`);
  console.log('baseline written');
  process.exit(0);
}

const total = key => Object.values(counts[key]).reduce((a, b) => a + b, 0);
if (rose.length) {
  console.error(rose.join('\n'));
  console.error('\nUse <Icon concept|action|status|feedback> and the feedback helpers; see the spec §5–6.');
  process.exit(1);
}
console.log(`consistency OK — IconPlatform ${total('iconPlatform')}, icon PNGs ${total('iconPng')}, Alert.alert ${total('alert')} left for the sweeps`);
```

Add `"check:consistency": "node scripts/check-consistency.mjs",` to `package.json` `scripts`.

Run: `npm run check:consistency`
Expected: FAIL. With no baseline yet, every file with an `IconPlatform`, icon PNG or `Alert.alert` is reported as above baseline 0.

- [ ] **Step 2: Write the codemod**

Create `scripts/codemods/icon-platform-to-icon.js`:

```js
#!/usr/bin/env node
/**
 * One-off (Plan 3 Task 2): rewrite <IconPlatform … androidName="x" …/> to
 * <Icon action|concept|status|feedback="…" …/> for the names whose meaning
 * doesn't depend on the screen. Everything else — people, person, event,
 * schedule, assignment, label, lock, tag, check, school, … — stays on
 * IconPlatform for the screen sweeps (Plans 5, 6), which know what the icon
 * means there or remove it (spec §6.1 rule 4).
 *   node scripts/codemods/icon-platform-to-icon.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ICON_MODULE = path.join(ROOT, 'src/common/components/icons/Icon');
const TABLE = {
  close: ['action', 'close'],
  'play-arrow': ['action', 'play'],
  'arrow-back': ['action', 'back'],
  'chevron-left': ['action', 'back'],
  'chevron-right': ['action', 'forward'],
  'expand-more': ['action', 'expand'],
  add: ['action', 'add'],
  'add-circle': ['action', 'add'],
  edit: ['action', 'edit'],
  delete: ['action', 'delete'],
  refresh: ['action', 'refresh'],
  send: ['action', 'send'],
  'photo-camera': ['action', 'camera'],
  'file-upload': ['action', 'upload'],
  'cloud-upload': ['action', 'upload'],
  'filter-list': ['action', 'filter'],
  'more-horiz': ['action', 'more'],
  menu: ['action', 'menu'],
  phone: ['action', 'call'],
  email: ['action', 'email'],
  mail: ['action', 'email'],
  place: ['action', 'location'],
  'my-location': ['action', 'location'],
  videocam: ['concept', 'videos'],
  collections: ['concept', 'gallery'],
  'photo-library': ['concept', 'gallery'],
  chat: ['concept', 'chat'],
  forum: ['concept', 'chat'],
  notifications: ['concept', 'notifications'],
  'notifications-none': ['concept', 'notifications'],
  'directions-car': ['concept', 'pickup'],
  'menu-book': ['concept', 'learning'],
  'qr-code-scanner': ['concept', 'checkIn'],
  settings: ['concept', 'settings'],
  'beach-access': ['concept', 'vacation'],
  campaign: ['concept', 'announcements'],
  'bar-chart': ['concept', 'progressReports'],
  assessment: ['concept', 'progressReports'],
  cake: ['concept', 'birthdays'],
  'card-giftcard': ['concept', 'birthdays'],
  'medical-services': ['concept', 'medicalAssessments'],
  'local-hospital': ['concept', 'medicalInfo'],
  'report-problem': ['concept', 'accidentReports'],
  'system-update': ['concept', 'appVersions'],
  'check-circle': ['status', 'done'],
  'wifi-off': ['feedback', 'offline'],
  'error-outline': ['feedback', 'error'],
  info: ['feedback', 'info'],
};
const PROP = name => new RegExp(`\\s*${name}=(?:"[^"]*"|'[^']*'|\\{[^}]*\\})`);

const files = [];
const walk = dir => {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.tsx$/.test(n)) files.push(p);
  }
};
walk(path.join(ROOT, 'src'));

let changedFiles = 0;
let changedSites = 0;
for (const file of files) {
  if (file.endsWith('IconPlatform.tsx')) continue;
  const before = fs.readFileSync(file, 'utf8');
  let src = before.replace(/<IconPlatform\b([\s\S]*?)\/>/g, (all, attrs) => {
    const m = attrs.match(/androidName=(?:"([a-z-]+)"|'([a-z-]+)'|\{'([a-z-]+)'\}|\{"([a-z-]+)"\})/);
    const name = m && (m[1] || m[2] || m[3] || m[4]);
    const ref = name && TABLE[name];
    if (!ref) return all;
    changedSites += 1;
    const rest = attrs.replace(PROP('androidName'), '').replace(PROP('iosName'), '');
    return `<Icon ${ref[0]}="${ref[1]}"${rest}/>`;
  });
  if (src === before) continue;

  if (!/import \{[^}]*\bIcon\b[^}]*\} from '[^']*icons\/Icon'/.test(src)) {
    let rel = path.relative(path.dirname(file), ICON_MODULE).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    const lastImport = [...src.matchAll(/^import [\s\S]*?;$/gm)].pop();
    const at = lastImport ? lastImport.index + lastImport[0].length : 0;
    src = `${src.slice(0, at)}\nimport { Icon } from '${rel}';${src.slice(at)}`;
  }
  if (!/<IconPlatform\b/.test(src)) {
    src = src.replace(/^import \{ IconPlatform \} from '[^']*';\n/m, '');
  }
  if ((src.match(/\bSFSymbols\b/g) || []).length === 1) {
    src = src.replace(/^import \{ SFSymbols \} from '[^']*';\n/m, '');
  }
  fs.writeFileSync(file, src);
  changedFiles += 1;
}
console.log(`rewrote ${changedSites} IconPlatform sites in ${changedFiles} files`);
```

Copy the guard and the codemod to mobile, and confirm they're identical:

```bash
cd /Users/fadyshawky/Dev/uprise/.worktrees/teacher-foundations
for f in scripts/check-consistency.mjs scripts/codemods/icon-platform-to-icon.js; do
  mkdir -p ../mobile-foundations/$(dirname $f)
  cp $f ../mobile-foundations/$f
  cmp $f ../mobile-foundations/$f && echo "same: $f"
done
```

- [ ] **Step 3: Run the codemod, format what it touched, and write the baseline**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  node scripts/codemods/icon-platform-to-icon.js
  git diff --name-only -- src | xargs npx prettier --write
  npm run typecheck
  node scripts/check-consistency.mjs --write-baseline
  npm run check:consistency
done
```

Expected, per app:
- `rewrote N IconPlatform sites in M files`; teacher N is about 45, mobile about 40.
- `tsc` is clean. If a rewritten element fails to typecheck, for example a `size` passed as a string, fix that call site by hand.
- `baseline written`.
- `consistency OK — IconPlatform …, icon PNGs …, Alert.alert … left for the sweeps`.

- [ ] **Step 4: Look at each app once**

Run each app on a simulator against a local backend and open the screens the codemod touched most. In both apps:
- in teacher: Albums, Chat list, Home, Check-in
- in mobile: Pickup, Settings, Home

Each rewritten icon draws at the same size and colour as before. Switch to Arabic and confirm the back chevrons point right. Take a screenshot of Home in each language for the PR.

- [ ] **Step 5: Add the guard to CI and commit**

In `.github/workflows/ci.yml`, after the `npm run check:tokens` step, add:

```yaml
      # Icons through the registry and no new Alert.alert (spec 2026-10-15 §6.2, §5.1).
      - name: Consistency guard
        run: npm run check:consistency
```

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  git add -A scripts .github package.json src
  git commit -m "refactor(icons): move unambiguous icons to <Icon> and guard the rest"
done
```

---

### Task 3: Staff navigation draws registry concepts (teacher)

**Files** (teacher only):
- Modify: `src/navigation/navigationRegistry.tsx`.
  - `NavEntry.icon: ImageSourcePropType` → `concept: IconConcept`.
  - Remove `iconStyle` and `registryStyles`.
  - `drawerIcon(concept)` renders `<Icon>`.
- Modify: `src/navigation/MainStack.tsx`, the `drawerIcon(...)` call.
- Modify: `src/navigation/PhoneTabsNavigation.tsx`. `tabBarIconSource` → `tabBarIconConcept`, and More gets `'more'`.
- Modify: `src/navigation/TabBar.tsx`. Render `<Icon>`.
- Modify: `src/screens/More/More.tsx`. Rows render `<Icon>`.
- Create: `__tests__/navigationIcons.test.ts`
- Modify: `scripts/consistency-baseline.json`. Lower it with `--write-baseline`.

**Interfaces:**
- Consumes: Task 1's `Icon` and `IconConcept`.
- Produces: `NavEntry.concept: IconConcept`; `drawerIcon(concept: IconConcept)`; the tab option `tabBarIconConcept?: IconConcept`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/navigationIcons.test.ts`:

```ts
/**
 * The staff navigation drew 24 raster PNGs; `reports.png` stood for
 * Assignments, Accident Reports and Staff Attendance at once (spec §2). Every
 * entry now names a registry concept, each a different one.
 */
import { NAVIGATION_REGISTRY } from '../src/navigation/navigationRegistry';
import { resolveIcon } from '../src/common/components/icons/Icon';

describe('navigation icons', () => {
  it('every entry names a concept that draws', () => {
    const missing = NAVIGATION_REGISTRY.filter(e => !resolveIcon({ concept: e.concept }).xml).map(e => e.id);
    expect(missing).toEqual([]);
  });

  it('no two entries share a concept', () => {
    const concepts = NAVIGATION_REGISTRY.map(e => e.concept);
    expect(new Set(concepts).size).toBe(concepts.length);
  });
});
```

Run: `npm test -- __tests__/navigationIcons.test.ts`
Expected: FAIL. `e.concept` is undefined, so `resolveIcon({ concept: undefined })` yields no xml, and the first test lists every entry id.

- [ ] **Step 2: Entries name concepts**

In `src/navigation/navigationRegistry.tsx`:
- Replace `icon: ImageSourcePropType;` and `iconStyle?: StyleProp<ImageStyle>;` in `NavEntry` with:

```ts
  /** The registry concept the drawer, the phone tab bar and More all draw. */
  concept: IconConcept;
```

- Import `type IconConcept` from `@upriseedu-tech/design-tokens` and `{ Icon }` from `'../common/components/icons/Icon'`.
- Remove the `ImageResources` import and `registryStyles`.

In `NAVIGATION_REGISTRY`, replace each entry's `icon: …` and `iconStyle: …` with its concept:

| `id` | `concept` |
|---|---|
| Home | `'home'` |
| DailySchedule | `'dailySchedule'` |
| Students | `'students'` |
| Gallery | `'gallery'` |
| Learning | `'learning'` |
| Assignments | `'assignments'` |
| Vacations | `'vacation'` |
| ChatList | `'chat'` |
| Notifications | `'notifications'` |
| Pickup | `'pickup'` |
| AccidentReports | `'accidentReports'` |
| CheckIn | `'checkIn'` |
| StaffAttendance | `'staffAttendance'` |
| MedicalAssessments | `'medicalAssessments'` |
| StaffProfile | `'profile'` |

If the registry holds an entry not in this table, `grep -n "id: '" src/navigation/navigationRegistry.tsx` lists it. Give it the registry concept that names it. If none fits, stop and ask the owner: a new concept is a `design-tokens` change.

Replace `drawerIcon`:

```tsx
/** The drawer icon: the entry's registry concept, accent when focused. */
export function drawerIcon(concept: IconConcept) {
  return ({ focused }: { focused: boolean }) => (
    <Icon
      concept={concept}
      size={IconTokens.size.action}
      color={focused ? HomeRebrandTokens.playfulAccent : HomeRebrandTokens.subtitleColor}
    />
  );
}
```

`IconTokens` comes from `@upriseedu-tech/design-tokens`.

In `src/navigation/MainStack.tsx`, change the call `drawerIcon(entry.icon, entry.iconStyle)` to `drawerIcon(entry.concept)`.

- [ ] **Step 3: The tab bar and More**

In `src/navigation/PhoneTabsNavigation.tsx`:
- `type TabOptions = BottomTabNavigationOptions & { tabBarIconConcept?: IconConcept };`
- `tabBarIconSource: entry.icon` → `tabBarIconConcept: entry.concept`.
- Where the hidden More route's `Tab.Screen` is declared, add `tabBarIconConcept: 'more'` to its options. Until now More had no icon at all.

In `src/navigation/TabBar.tsx`:
- Read `const concept = (options as { tabBarIconConcept?: IconConcept }).tabBarIconConcept;` in place of `tabBarIconSource`.
- Replace the `<Image source={icon} …/>` block with:

```tsx
            {concept ? (
              <Icon
                concept={concept}
                size={getTabBarIconSize()}
                color={isFocused ? T.activeColor : T.inactiveColor}
              />
            ) : null}
```

- Remove the now-unused `Image` and `ImageSourcePropType` imports.

In `src/screens/More/More.tsx`, replace `<Image source={entry.icon} style={styles.icon} />` with `<Icon concept={entry.concept} size={IconTokens.size.action} color={HomeRebrandTokens.subtitleColor} />`, and delete the `icon` style if nothing else uses it.

- [ ] **Step 4: Run the tests, the typecheck and the guard**

```bash
npm test -- __tests__/navigationIcons.test.ts
npm test
npm run typecheck
node scripts/check-consistency.mjs --write-baseline && npm run check:consistency
```

Expected:
- both new tests pass;
- the full suite passes (update any existing test that read `entry.icon` to read `entry.concept`);
- `tsc` is clean;
- the baseline is written with the icon-PNG count down by the navigation's sites, and `consistency OK`.

- [ ] **Step 5: Look at it on a phone and a tablet**

On an iPhone simulator, check that the tab bar shows distinct line glyphs, and that More now has its icon. On an iPad simulator, check that the drawer shows 15 distinct glyphs, with the accent colour on the focused one. Switch to Arabic and check both again. Take screenshots for the PR.

- [ ] **Step 6: Commit**

```bash
git add src/navigation src/screens/More __tests__/navigationIcons.test.ts scripts/consistency-baseline.json
git commit -m "feat(navigation): staff drawer, tabs and More draw one registry concept each"
```

---

### Task 4: Feedback helpers and one toast (both apps)

**Files** (both apps; the shared files are identical):
- Create: `src/core/feedback/feedback.ts` (shared; pure)
- Create: `src/core/feedback/notify.ts` (shared)
- Modify: `src/common/components/SnackbarProvider.tsx`. Use token colours and the feedback glyph.
- Modify: `App.tsx`. Call `setFeedbackLanguage(() => store.getState().app.language)`.
- Create: `__tests__/feedback.test.ts` (shared)
- Teacher only:
  - Modify: `src/core/api/responseHandlers.ts` and the 6 other files calling `Snackbar.show` (`HomeTopTabs`, `MaterialModal`, `DailySchedule`, `ProgressReport`, `useForegroundChatNotifications`, `useGlobalChatListener`). Move them to `showSnackbar`.
  - `npm uninstall react-native-snackbar`, and remove its mock from `jest.setup.js`.

**Interfaces:**
- Produces:
  - `feedbackLocale(language: unknown): 'en' | 'ar'`
  - `errorFields(error: unknown): { code: string | null; status: number | null }`
  - `errorText(language: unknown, error: unknown, action?: FeedbackAction, item?: FeedbackItem): string`
  - `successText(language: unknown, kind: FeedbackSuccess, item: FeedbackItem): string`
  - `feedbackText(language: unknown, path: string, vars?: Record<string, string>): string`
  - `confirmText(language: unknown, kind: 'delete' | 'logout' | 'discard', item?: FeedbackItem): { title: string; body: string; confirm: string; cancel: string }`
  - `setFeedbackLanguage(source: () => unknown)`, `currentFeedbackLanguage()`
  - `notifySuccess(kind, item)`, `notifyError(action, item, error)`, `notifyInfo(text)`, `notifySessionEnded()`

- [ ] **Step 1: Write the failing test**

Create `__tests__/feedback.test.ts`:

```ts
/**
 * The only path from a failure to the words on screen (spec §5.1). Both apps
 * showed the server's English `message` from their global interceptors.
 */
import { FeedbackMessages } from '@upriseedu-tech/design-tokens';

jest.mock('../src/common/components/snackbarService', () => ({ showSnackbar: jest.fn() }));
import { showSnackbar } from '../src/common/components/snackbarService';
import {
  confirmText,
  errorFields,
  errorText,
  feedbackLocale,
  feedbackText,
  successText,
} from '../src/core/feedback/feedback';
import {
  notifyError,
  notifySessionEnded,
  notifySuccess,
  setFeedbackLanguage,
} from '../src/core/feedback/notify';

const en = FeedbackMessages.en;
const axiosError = (status: number, data: object) => ({ isAxiosError: true, response: { status, data } });

describe('feedback text', () => {
  it('reads a known code and never the server message', () => {
    const err = axiosError(409, { code: 'ALREADY_CHECKED_OUT', message: 'Student already checked out on this date' });
    expect(errorText('en', err, 'save', 'lateCheckout')).toBe(en.errors.ALREADY_CHECKED_OUT);
  });

  it('reads no response as offline', () => {
    expect(errorFields({ isAxiosError: true, request: {} })).toEqual({ code: null, status: 0 });
    expect(errorText('en', { isAxiosError: true }, 'send', 'message')).toBe(en.error.offline);
  });

  it('speaks Arabic, and never leaves a hole', () => {
    expect(feedbackLocale('ar')).toBe('ar');
    expect(errorText('ar', axiosError(400, {}), 'delete', 'album')).toBe('تعذّر حذف الألبوم. حاول مرة أخرى.');
    expect(errorText('ar', axiosError(400, {}))).toBe(FeedbackMessages.ar.error.unknown);
  });

  it('builds success, plain and confirmation text', () => {
    expect(successText('en', 'sent', 'vacationRequest')).toBe('Vacation request sent.');
    expect(feedbackText('en', 'error.sessionEnded')).toBe(en.error.sessionEnded);
    expect(confirmText('en', 'delete', 'contact')).toEqual({
      title: 'Delete the contact?',
      body: en.confirm.deleteBody,
      confirm: en.confirm.deleteConfirm,
      cancel: en.confirm.cancel,
    });
    expect(confirmText('en', 'logout').title).toBe(en.confirm.logoutTitle);
  });
});

describe('notify', () => {
  beforeEach(() => (showSnackbar as jest.Mock).mockClear());

  it('toasts in the current language', () => {
    setFeedbackLanguage(() => 'ar');
    notifySuccess('saved', 'album');
    expect(showSnackbar).toHaveBeenCalledWith({ text: 'تم حفظ الألبوم.', type: 'success' });
    setFeedbackLanguage(() => 'en');
  });

  it('skips an error the API layer already reported', () => {
    notifyError('save', 'album', { reported: true });
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('says the session ended once for a burst', () => {
    notifySessionEnded();
    notifySessionEnded();
    notifySessionEnded();
    expect(showSnackbar).toHaveBeenCalledTimes(1);
  });
});
```

Run: `npm test -- __tests__/feedback.test.ts`
Expected: FAIL. `Cannot find module '../src/core/feedback/feedback'`.

- [ ] **Step 2: Write the helpers**

Create `src/core/feedback/feedback.ts`:

```ts
import {
  FeedbackMessages,
  feedbackForError,
  feedbackForSuccess,
  fillFeedback,
  type FeedbackAction,
  type FeedbackItem,
  type FeedbackLocale,
  type FeedbackSuccess,
} from '@upriseedu-tech/design-tokens';

/**
 * Words for every toast, inline error and confirmation, from the shared
 * catalogue (spec 2026-10-15 §5). Pure: no React, no store. The language is
 * passed in (state.app.language).
 */
export function feedbackLocale(language: unknown): FeedbackLocale {
  return String(language ?? '').startsWith('ar') ? 'ar' : 'en';
}

/**
 * What the catalogue needs from a failure. An axios error with no response
 * (offline, timeout) is status 0, which reads as offline; anything else thrown
 * has neither and reads as the action sentence.
 */
export function errorFields(error: unknown): { code: string | null; status: number | null } {
  const e = error as { isAxiosError?: boolean; response?: { status?: unknown; data?: { code?: unknown } } } | null;
  const response = e?.response;
  if (!response) return { code: null, status: e?.isAxiosError ? 0 : null };
  return {
    code: typeof response.data?.code === 'string' ? response.data.code : null,
    status: typeof response.status === 'number' ? response.status : null,
  };
}

export function errorText(language: unknown, error: unknown, action?: FeedbackAction, item?: FeedbackItem): string {
  return feedbackForError(feedbackLocale(language), errorFields(error), action as FeedbackAction, item as FeedbackItem);
}

export function successText(language: unknown, kind: FeedbackSuccess, item: FeedbackItem): string {
  return feedbackForSuccess(feedbackLocale(language), kind, item);
}

export function feedbackText(language: unknown, path: string, vars: Record<string, string> = {}): string {
  const node = path.split('.').reduce<unknown>(
    (at, key) =>
      at && typeof at === 'object' && Object.prototype.hasOwnProperty.call(at, key)
        ? (at as Record<string, unknown>)[key]
        : undefined,
    FeedbackMessages[feedbackLocale(language)],
  );
  return typeof node === 'string' ? fillFeedback(node, vars) : '';
}

export function confirmText(
  language: unknown,
  kind: 'delete' | 'logout' | 'discard',
  item?: FeedbackItem,
): { title: string; body: string; confirm: string; cancel: string } {
  const m = FeedbackMessages[feedbackLocale(language)];
  const name = item && Object.prototype.hasOwnProperty.call(m.items, item) ? m.items[item] : '';
  const c = m.confirm;
  const byKind = {
    delete: { title: fillFeedback(c.deleteTitle, { item: name }), body: c.deleteBody, confirm: c.deleteConfirm },
    logout: { title: c.logoutTitle, body: c.logoutBody, confirm: c.logoutConfirm },
    discard: { title: c.discardTitle, body: c.discardBody, confirm: c.discardConfirm },
  }[kind];
  return { ...byKind, cancel: c.cancel };
}
```

Create `src/core/feedback/notify.ts`:

```ts
import type { FeedbackAction, FeedbackItem, FeedbackSuccess } from '@upriseedu-tech/design-tokens';
import { showSnackbar } from '../../common/components/snackbarService';
import { errorText, feedbackText, successText } from './feedback';

/**
 * The only way a screen shows feedback (spec §5.1). The API layer reports a
 * failed write itself; a screen calls notifyError only for a request it sent
 * with `skipErrorToast` (it reports its own failure) or for a failure that
 * isn't a request (a camera that won't start).
 *
 * The language comes from a getter App.tsx sets once, so this module needs no
 * store import (the staff app's serverHeaders takes its store by injection to
 * avoid that import cycle).
 */
let languageSource: () => unknown = () => 'en';
let sessionEndedAt = 0;

export function setFeedbackLanguage(source: () => unknown): void {
  languageSource = source;
}

export function currentFeedbackLanguage(): unknown {
  return languageSource();
}

export function notifySuccess(kind: FeedbackSuccess, item: FeedbackItem): void {
  showSnackbar({ text: successText(languageSource(), kind, item), type: 'success' });
}

export function notifyError(action: FeedbackAction, item: FeedbackItem, error: unknown): void {
  if ((error as { reported?: boolean } | null)?.reported) return;
  showSnackbar({ text: errorText(languageSource(), error, action, item), type: 'error' });
}

export function notifyInfo(text: string): void {
  showSnackbar({ text, type: 'default' });
}

/** Once per burst: every request queued behind a refused refresh lands here. */
export function notifySessionEnded(): void {
  const now = Date.now();
  if (now - sessionEndedAt < 5000) return;
  sessionEndedAt = now;
  showSnackbar({ text: feedbackText(languageSource(), 'error.sessionEnded'), type: 'error' });
}
```

In `App.tsx`, after the store is imported, add once at module level:

```ts
// The feedback helpers read the language through this getter (no store import there).
setFeedbackLanguage(() => store.getState().app.language);
```

Import it from `./src/core/feedback/notify`.

Copy the shared files to mobile and confirm they're identical:

```bash
cd /Users/fadyshawky/Dev/uprise/.worktrees/teacher-foundations
for f in src/core/feedback/feedback.ts src/core/feedback/notify.ts __tests__/feedback.test.ts; do
  mkdir -p ../mobile-foundations/$(dirname $f)
  cp $f ../mobile-foundations/$f
  cmp $f ../mobile-foundations/$f && echo "same: $f"
done
```

Add the same `setFeedbackLanguage(...)` line to mobile's `App.tsx`.

- [ ] **Step 3: Run the test to verify it passes, in both apps**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  npm test -- __tests__/feedback.test.ts
done
```

Expected: 7 passing in each app.

- [ ] **Step 4: One toast: token colours and a glyph, and teacher drops `react-native-snackbar`**

In each app's `src/common/components/SnackbarProvider.tsx`, replace the hardcoded `colors` object with token colours:

```ts
// Token colours (design-tokens Colors): the AA text tones read on white text.
const colors = {
  default: Colors.primaryText,
  success: Colors.greenText,
  error: Colors.redText,
  text: Colors.white,
};
```

Then render the feedback glyph before the message, inside the `Animated.View`:

```tsx
            <RTLAwareView style={styles.row}>
              <Icon
                feedback={type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'}
                size={IconTokens.size.action}
                color={colors.text}
              />
              <RTLAwareText style={[styles.text, { color: colors.text }]}>{message}</RTLAwareText>
            </RTLAwareView>
```

Add `row: { flexDirection: 'row', alignItems: 'center', gap: 8 }` to `styles`, and import `Icon`, `IconTokens` and `RTLAwareView` where they live in that app (`RTLAwareView` is a sibling of `RTLAwareText`).

Run `node scripts/check-contrast.mjs` if the app has one. Otherwise confirm white on `Colors.greenText`, `Colors.redText` and `Colors.primaryText` is at least 4.5:1, using the contrast tables in `design-tokens` `src/colors.ts`, and record it.

Teacher only. Move every `Snackbar.show({ text, backgroundColor, … })` to `showSnackbar({ text, type })`:
- `Colors.red` → `'error'`
- `Colors.green` and `Colors.primary100` → `'success'` when the text reports a completed action, otherwise `'default'`

Keep the text as it is; Plan 5 rewords each screen. The sites:
- `src/core/api/responseHandlers.ts` (3)
- `HomeTopTabs` (4)
- `MaterialModal` (3)
- `DailySchedule` (2)
- `ProgressReport` (2)
- `useForegroundChatNotifications` (1)
- `useGlobalChatListener` (1)

Then:

```bash
grep -rn "react-native-snackbar\|Snackbar.show" src App.tsx jest.setup.js
npm uninstall react-native-snackbar
```

Delete the `react-native-snackbar` mock block from `jest.setup.js`. The `grep` must then print nothing. Run `cd ios && bundle exec pod install && cd ..`, and note it in the PR: this is a native change that needs a rebuild.

- [ ] **Step 5: Run everything and commit, in both apps**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  npm run typecheck && npm test -- --ci && npm run check:i18n && npm run check:tokens && npm run check:consistency
  git add -A src App.tsx __tests__/feedback.test.ts package.json package-lock.json jest.setup.js ios/Podfile.lock
  git commit -m "feat(feedback): one toast in the catalogue's words, from shared feedback helpers"
done
```

Expected: all five pass in each app, then the commits land. In mobile, `ios/Podfile.lock` is unchanged; `git add` of an unchanged file is harmless.

---

### Task 5: The API layer reports a failed write once (both apps)

**Files** (both apps):
- Create: `src/core/api/errorPolicy.ts` (shared; pure)
- Modify: `src/core/api/serverHeaders.ts`. Change the axios config augmentation, the error interceptor, and logout. The two apps' files differ; each change is given per app.
- Create: `__tests__/apiErrorPolicy.test.ts` (shared)
- Create: `__tests__/apiErrorReporting.test.ts`, one per app (they differ in how the store is provided)
- Modify, teacher: `src/core/chat/announcementFunctions.ts:60`. `skipErrorSnackbar` → `skipErrorToast`.

**Interfaces:**
- Consumes: Task 4's `errorText`, `currentFeedbackLanguage`, `notifySessionEnded` and `showSnackbar`.
- Produces:
  - `failureReport(error: AxiosError): string | null` returns the toast text for a failed request, or `null` when the API layer must stay quiet: a GET or HEAD, `skipErrorToast`, refresh and logout calls, an error already reported.
  - The axios config fields `skipErrorToast?: boolean` and `feedback?: { action: FeedbackAction; item: FeedbackItem }`.
  - A rejected error carries `reported: true` when the API layer showed it.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/apiErrorPolicy.test.ts`:

```ts
/**
 * Who reports a failed request (spec §5.1): the API layer, once, for writes;
 * never for loads, which are the screen's error state.
 */
import { FeedbackMessages } from '@upriseedu-tech/design-tokens';
import { failureReport } from '../src/core/api/errorPolicy';

const en = FeedbackMessages.en;
const fail = (method: string, status: number | null, data: object = {}, config: object = {}) => ({
  isAxiosError: true,
  config: { method, url: '/api/x', ...config },
  ...(status === null ? {} : { response: { status, data } }),
});

describe('failureReport', () => {
  it('stays quiet for loads', () => {
    expect(failureReport(fail('get', 500) as never)).toBeNull();
    expect(failureReport(fail('head', 404) as never)).toBeNull();
  });

  it('reports a failed write in the catalogue words', () => {
    expect(failureReport(fail('post', 409, { code: 'NOT_PENDING', message: 'x' }) as never)).toBe(en.errors.NOT_PENDING);
    expect(failureReport(fail('put', null) as never)).toBe(en.error.offline);
  });

  it('uses the request feedback hint for an unknown code', () => {
    const err = fail('delete', 400, { code: 'BRAND_NEW' }, { feedback: { action: 'delete', item: 'album' } });
    expect(failureReport(err as never)).toBe("Couldn't delete the album. Try again.");
  });

  it('stays quiet when asked, for refresh and logout, and when already reported', () => {
    expect(failureReport(fail('post', 400, {}, { skipErrorToast: true }) as never)).toBeNull();
    expect(failureReport(fail('post', 401, {}, { url: '/refresh-token' }) as never)).toBeNull();
    expect(failureReport(fail('post', 500, {}, { url: '/logout' }) as never)).toBeNull();
    expect(failureReport({ ...fail('post', 500), reported: true } as never)).toBeNull();
  });
});
```

Run: `npm test -- __tests__/apiErrorPolicy.test.ts`
Expected: FAIL. `Cannot find module '../src/core/api/errorPolicy'`.

- [ ] **Step 2: Write the policy**

Create `src/core/api/errorPolicy.ts`:

```ts
import type { AxiosError } from 'axios';
import { errorText } from '../feedback/feedback';
import { currentFeedbackLanguage } from '../feedback/notify';

// Token plumbing fails silently by design: a refused refresh ends in
// notifySessionEnded, and a logout is best-effort.
const SILENT_URLS = ['/refresh-token', '/logout'];

/**
 * The toast text for a failed request, or null when the API layer must stay
 * quiet (spec 2026-10-15 §5.1): a load (GET/HEAD) is the screen's error state;
 * a request sent with skipErrorToast is reported by its screen; an error
 * already reported (session ended) is not reported twice. A write names what
 * failed through `config.feedback`; without it an unknown code reads "Something
 * went wrong. Try again."
 */
export function failureReport(error: AxiosError & { reported?: boolean }): string | null {
  const config = error.config;
  if (!config || config.skipErrorToast || error.reported) return null;
  const method = (config.method ?? 'get').toLowerCase();
  if (method === 'get' || method === 'head') return null;
  if (SILENT_URLS.some(url => config.url?.includes(url))) return null;
  return errorText(currentFeedbackLanguage(), error, config.feedback?.action, config.feedback?.item);
}
```

Copy it and `__tests__/apiErrorPolicy.test.ts` to mobile, confirming with `cmp`.

- [ ] **Step 3: Wire the teacher interceptor**

In teacher `src/core/api/serverHeaders.ts`, replace the `declare module 'axios'` block with:

```ts
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    /** The screen reports this request's failure itself (notifyError); the API layer stays quiet. */
    skipErrorToast?: boolean;
    /** What a write does, so an unknown error reads "Couldn't <action> the <item>." */
    feedback?: {
      action: import('@upriseedu-tech/design-tokens').FeedbackAction;
      item: import('@upriseedu-tech/design-tokens').FeedbackItem;
    };
  }
}
```

Then:
- Import `{ failureReport }` from `./errorPolicy`, `{ notifySessionEnded }` from `../feedback/notify`, and `{ showSnackbar }` from `../../common/components/snackbarService`. Remove the `handleErrorJsonResponse` import and the `DataErrorEntity` interface if nothing else uses them.
- In `dispatchLogout`, change the `/logout` call's `config: { skipErrorSnackbar: true }` to `config: { skipErrorToast: true }`, and add `notifySessionEnded();` right after the Sentry `try/catch`.
- Replace the whole error interceptor with:

```ts
  async (error: AxiosError & { reported?: boolean }) => {
    const originalRequest = error.config;
    const report = () => {
      const text = failureReport(error);
      if (text) {
        showSnackbar({ text, type: 'error' });
        error.reported = true;
      }
      return Promise.reject(error);
    };

    const url = originalRequest?.url ?? '';
    if (url.includes('/login') || url.includes('/refresh-token') || url.includes('/logout')) {
      return report();
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!refreshingPromise) {
        refreshingPromise = store.dispatch(refreshToken()).finally(() => {
          refreshingPromise = null;
        });
      }
      try {
        const result = await refreshingPromise;
        if (refreshToken.fulfilled.match(result)) {
          const newToken = result.payload?.data?.token;
          if (newToken && originalRequest.headers) {
            persistor.flush().catch(() => {});
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        }
        const rejectionPayload = (result as { payload?: { isNetworkError?: boolean; message?: string } })?.payload;
        if (rejectionPayload?.isNetworkError) return report();
        dispatchLogout(`refresh rejected: ${rejectionPayload?.message ?? 'unknown'}`);
      } catch {
        dispatchLogout('refresh threw unexpectedly');
      }
      error.reported = true;
      return Promise.reject(error);
    }

    if (error.response?.status === 402) {
      dispatchLogout('http 402');
      error.reported = true;
      return Promise.reject(error);
    }

    return report();
  },
```

Change `src/core/chat/announcementFunctions.ts:60`'s `skipErrorSnackbar: true` to `skipErrorToast: true`. Check nothing else uses the old name: `grep -rn skipErrorSnackbar src` must print nothing.

- [ ] **Step 4: Wire the mobile interceptor**

In mobile `src/core/api/serverHeaders.ts`:
- Add the same `declare module 'axios'` block as teacher's.
- Import `failureReport`, `notifySessionEnded` and `showSnackbar` the same way.
- In `forceLogout`, add `notifySessionEnded();` as its first statement after any Sentry call.
- In the error interceptor:
  - Keep the silent 401-without-a-token rejection, the refresh flow, and the early returns after a rejected refresh or a 402. Set `error.reported = true` before each of those `return Promise.reject(error)`s.
  - Keep the `MODULE_DISABLED` dispatch of `modules/markModulesRefreshNeeded`, but drop its `showSnackbar` with the server text.
  - Replace the final `handleErrorResponse(errorData?.message || localization.errors.error)` with the same `report()` as teacher's: `failureReport(error)`, then `showSnackbar({ text, type: 'error' })` and `error.reported = true` when it returns text.

- [ ] **Step 5: Test the interceptor end to end, per app**

Create `__tests__/apiErrorReporting.test.ts` in teacher:

```ts
/**
 * Spec §10: the API layer shows exactly one toast per failed write and none
 * for a failed GET. Drives the real axios instance with a fake adapter.
 */
jest.mock('../src/common/components/snackbarService', () => ({ showSnackbar: jest.fn() }));
import { showSnackbar } from '../src/common/components/snackbarService';
import { FeedbackMessages } from '@upriseedu-tech/design-tokens';
import { AxiosError } from 'axios';

const failWith = (status: number, data: object) => (config: never) =>
  Promise.reject(new AxiosError('fail', String(status), config, {}, { status, data, config, headers: {}, statusText: '' } as never));

describe('API error reporting', () => {
  let instance: import('axios').AxiosInstance;
  beforeAll(() => {
    const headers = require('../src/core/api/serverHeaders');
    headers.injectStore(
      { getState: () => ({ user: { accessToken: 't', refreshToken: 'r' }, app: { language: 'en' } }), dispatch: jest.fn() },
      { flush: () => Promise.resolve() },
    );
    instance = headers.instance ?? headers.default;
  });
  beforeEach(() => (showSnackbar as jest.Mock).mockClear());

  it('one toast for a failed write, in the catalogue words', async () => {
    instance.defaults.adapter = failWith(409, { code: 'NOT_PENDING', message: 'Announcement is not pending review' });
    await expect(instance.post('/api/announcement/approve', {})).rejects.toMatchObject({ reported: true });
    expect(showSnackbar).toHaveBeenCalledTimes(1);
    expect(showSnackbar).toHaveBeenCalledWith({ text: FeedbackMessages.en.errors.NOT_PENDING, type: 'error' });
  });

  it('no toast for a failed load', async () => {
    instance.defaults.adapter = failWith(500, {});
    await expect(instance.get('/api/album')).rejects.toBeTruthy();
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
```

Check how `serverHeaders.ts` exports the axios instance: `grep -n "^export" src/core/api/serverHeaders.ts`. Use that name in `beforeAll`, and delete the `?? headers.default` fallback once known.

For mobile, write the same test, but replace the `injectStore` call. Before requiring `serverHeaders`, mock the store module it imports:

```ts
jest.mock('../src/core/store/store', () => ({
  store: {
    getState: () => ({ user: { accessToken: 't', refreshToken: 'r' }, app: { language: 'en' } }),
    dispatch: jest.fn(),
  },
  persistor: { flush: () => Promise.resolve() },
}));
```

Run in each app: `npm test -- __tests__/apiErrorPolicy.test.ts __tests__/apiErrorReporting.test.ts`
Expected: 4 and 2 passing.

- [ ] **Step 6: Screens that already report their own failure set `skipErrorToast`**

These call sites toast or show their own error after a failed write today (spec §2, "then many screens report again"). Each gets `config: { skipErrorToast: true }` on its request, so the user sees one report:
- teacher `HomeTopTabs`, `MaterialModal`, `DailySchedule`, `ProgressReport`: the `showSnackbar` calls moved in Task 4.
- mobile `usePickup`, `ChangePassword`, `OrientationBooking`: their local reports.

For each, find the request: `grep -n "post(\|put(\|deleteApi(\|patch(" <file>`. Add the flag to that request's config. Then check that the screen's own report reads catalogue text. Where it shows a raw `message`, call `notifyError('<action>', '<item>', error)` instead.

Re-run `npm test -- --ci` in each app.
Expected: all pass.

- [ ] **Step 7: Commit in each app**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  npm run typecheck && npm test -- --ci && npm run check:consistency
  git add -A src __tests__
  git commit -m "feat(api): report a failed write once, in the catalogue's words; loads stay silent"
done
```

---

### Task 6: `ConfirmSheet` (both apps)

**Files** (both apps):
- Create: `src/common/components/ConfirmSheet.tsx` (shared)
- Create: `src/common/components/confirm.ts` (shared)
- Modify, teacher: `App.tsx`. Add `'confirm-sheet': ConfirmSheet` to `<SheetRegister sheets={…}>`.
- Modify, mobile: `src/sheetManager/sheets.tsx`. `registerSheet('confirm-sheet', ConfirmSheet)`, plus the `Sheets` interface entry.
- Create: `__tests__/confirmSheet.test.tsx` (shared)

**Interfaces:**
- Consumes: Task 4's `confirmText` and `currentFeedbackLanguage`.
- Produces: `confirm(kind: 'delete' | 'logout' | 'discard', item?: FeedbackItem): Promise<boolean>`, which resolves `true` only on the destructive button.

- [ ] **Step 1: Write the failing test**

Create `__tests__/confirmSheet.test.tsx`:

```tsx
/**
 * Destructive actions ask once, in the same words on every platform (spec §5,
 * decision D3). Dismissing the sheet is a "no".
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

jest.mock('react-native-actions-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    SheetManager: { show: jest.fn(), hide: jest.fn() },
    registerSheet: jest.fn(),
  };
});
import { SheetManager } from 'react-native-actions-sheet';
import { ConfirmSheet } from '../src/common/components/ConfirmSheet';
import { confirm } from '../src/common/components/confirm';

const payload = { title: 'Delete the contact?', body: "This can't be undone.", confirm: 'Delete', cancel: 'Cancel', destructive: true };

describe('ConfirmSheet', () => {
  it('answers yes on the destructive button and no on Cancel', () => {
    const tree = create(<ConfirmSheet sheetId="confirm-sheet" payload={payload} />);
    act(() => tree.root.findByProps({ testID: 'confirm-sheet-confirm' }).props.onPress());
    expect(SheetManager.hide).toHaveBeenLastCalledWith('confirm-sheet', { payload: true });
    act(() => tree.root.findByProps({ testID: 'confirm-sheet-cancel' }).props.onPress());
    expect(SheetManager.hide).toHaveBeenLastCalledWith('confirm-sheet', { payload: false });
  });

  it('confirm() is true only for a yes; a swipe-away is a no', async () => {
    (SheetManager.show as jest.Mock).mockResolvedValueOnce(true);
    await expect(confirm('delete', 'contact')).resolves.toBe(true);
    (SheetManager.show as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(confirm('logout')).resolves.toBe(false);
    expect((SheetManager.show as jest.Mock).mock.calls[1][1].payload.title).toBe('Log out?');
  });
});
```

Run: `npm test -- __tests__/confirmSheet.test.tsx`
Expected: FAIL. `Cannot find module '../src/common/components/ConfirmSheet'`.

- [ ] **Step 2: Write the sheet and the helper**

Create `src/common/components/ConfirmSheet.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ActionSheet, { SheetDefinition, SheetManager, SheetProps } from 'react-native-actions-sheet';
import { HomeRebrandTokens } from '@design-system';
import { Colors } from '../../core/theme/colors';
import { RTLAwareText } from './RTLAwareText';

export type ConfirmPayload = { title: string; body: string; confirm: string; cancel: string; destructive: boolean };

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'confirm-sheet': SheetDefinition<{ payload: ConfirmPayload; returnValue: boolean }>;
  }
}

/**
 * The one confirmation for destructive actions in the phone apps (spec
 * 2026-10-15 §5, decision D3): title, one line, the destructive action and
 * Cancel. Built on react-native-actions-sheet, which both apps already use
 * for every sheet. Closing it any other way resolves as "no" (see confirm.ts).
 */
export function ConfirmSheet(props: SheetProps<'confirm-sheet'>) {
  const p = props.payload;
  if (!p) return null;
  const answer = (value: boolean) => SheetManager.hide('confirm-sheet', { payload: value });
  return (
    <ActionSheet id={props.sheetId} gestureEnabled containerStyle={styles.container}>
      <View style={styles.handle} />
      <RTLAwareText style={styles.title} accessibilityRole="header">
        {p.title}
      </RTLAwareText>
      <RTLAwareText style={styles.body}>{p.body}</RTLAwareText>
      <Pressable
        testID="confirm-sheet-confirm"
        accessibilityRole="button"
        style={[styles.button, p.destructive ? styles.destructive : styles.primary]}
        onPress={() => answer(true)}
      >
        <RTLAwareText style={styles.buttonText}>{p.confirm}</RTLAwareText>
      </Pressable>
      <Pressable
        testID="confirm-sheet-cancel"
        accessibilityRole="button"
        style={[styles.button, styles.cancel]}
        onPress={() => answer(false)}
      >
        <RTLAwareText style={styles.cancelText}>{p.cancel}</RTLAwareText>
      </Pressable>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: HomeRebrandTokens.heroSurface,
    borderTopStartRadius: HomeRebrandTokens.cardRadius,
    borderTopEndRadius: HomeRebrandTokens.cardRadius,
    paddingHorizontal: HomeRebrandTokens.pageHorizontalPadding,
    paddingBottom: 24,
    gap: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: HomeRebrandTokens.mutedBorder,
  },
  title: { fontSize: 18, fontWeight: '700', color: HomeRebrandTokens.titleColor },
  body: { fontSize: 14, color: HomeRebrandTokens.subtitleColor },
  button: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  destructive: { backgroundColor: Colors.redText },
  primary: { backgroundColor: Colors.primary100 },
  cancel: { backgroundColor: Colors.primary10 },
  buttonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  cancelText: { fontSize: 16, fontWeight: '600', color: Colors.primaryText },
});
```

If `tsc` reports a `HomeRebrandTokens` key missing in one app, use that app's equivalent: open `src/design-system/theme/home.ts` and pick the key with the same role. Record the choice in the commit message. Don't introduce a hex.

Create `src/common/components/confirm.ts`:

```ts
import { SheetManager } from 'react-native-actions-sheet';
import type { FeedbackItem } from '@upriseedu-tech/design-tokens';
import { confirmText } from '../../core/feedback/feedback';
import { currentFeedbackLanguage } from '../../core/feedback/notify';

/**
 * Ask before a destructive action. Resolves true only when the person taps the
 * destructive button; Cancel, a swipe-down or a backdrop tap resolve false.
 *   if (await confirm('delete', 'contact')) { … }
 */
export async function confirm(kind: 'delete' | 'logout' | 'discard', item?: FeedbackItem): Promise<boolean> {
  const answer = await SheetManager.show('confirm-sheet', {
    payload: { ...confirmText(currentFeedbackLanguage(), kind, item), destructive: true },
  });
  return answer === true;
}
```

Copy both files and the test to mobile, and confirm they're identical with `cmp`. Register the sheet:
- **Teacher, `App.tsx`:** import `{ ConfirmSheet }` and add `'confirm-sheet': ConfirmSheet,` inside `<SheetRegister sheets={{ … }}>`.
- **Mobile, `src/sheetManager/sheets.tsx`:** add `registerSheet('confirm-sheet', ConfirmSheet);` with an import from `'../common/components/ConfirmSheet'`. `ConfirmSheet.tsx` already augments the `Sheets` interface, so don't add a second entry there.

- [ ] **Step 3: Run the test to verify it passes, in both apps**

Run in each app: `npm test -- __tests__/confirmSheet.test.tsx && npm run typecheck`
Expected: 2 passing and `tsc` clean.

- [ ] **Step 4: Look at it once**

In a dev build of each app, temporarily call `confirm('delete', 'contact')` from a debug button, or from the React Native debugger console with `require('./src/common/components/confirm').confirm('delete','contact')`. Check:
- English: the title is "Delete the contact?", with a red Delete and Cancel.
- Arabic: the sheet is right-aligned and reads «حذف جهة الاتصال؟».
- Swiping down resolves `false`.

Remove any debug button. Take screenshots for the PR.

- [ ] **Step 5: Commit in each app**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  git add -A src App.tsx __tests__/confirmSheet.test.tsx
  git commit -m "feat(confirm): one branded confirmation sheet for destructive actions"
done
```

---

### Task 7: Groundwork for the sweeps: selectors that don't re-render on every change, and one tap per action

**Files** (both apps):
- Modify, the whole-slice selector sites:
  - teacher: `App.tsx:81`, `src/common/localization/RTLInitializer.tsx:54`, `src/navigation/MainNavigation.tsx:14`, `src/screens/main/Main.tsx:173`, `src/screens/main/components/HomeTeacherAttendance.tsx:174`
  - mobile: `App.tsx:41`, `src/common/localization/LocalizationProvider.tsx:41`, `src/common/localization/RTLInitializer.tsx:50`, `src/core/hooks/useGlobalChat.ts:18`, `src/navigation/MainNavigation.tsx:23`, `src/screens/Settings/ChangePassword.tsx:57`, `src/screens/main/Main.tsx:15`, `src/screens/pickup/components/AddContactComponent.tsx:35`
- Create: `src/common/hooks/useTapOnce.ts` (shared)
- Create: `__tests__/tapOnce.test.ts` (shared)

**Interfaces:**
- Produces:
  - `tapOnce<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => Promise<void>`
  - `useTapOnce(fn)`. Calls made while one is in flight are dropped. Plans 5 and 6 wrap submit and navigate handlers with it (spec §8.2: double taps don't double-act).

- [ ] **Step 1: Write the failing test**

Create `__tests__/tapOnce.test.ts`:

```ts
/** A second tap while the first is still running is dropped (spec §8.2). */
import { tapOnce } from '../src/common/hooks/useTapOnce';

describe('tapOnce', () => {
  it('drops taps while the first is in flight, then accepts the next', async () => {
    let calls = 0;
    let release!: () => void;
    const handler = tapOnce(() => {
      calls += 1;
      return new Promise<void>(r => (release = r));
    });
    const first = handler();
    void handler();
    void handler();
    expect(calls).toBe(1);
    release();
    await first;
    void handler();
    expect(calls).toBe(2);
  });

  it('frees itself after a failure', async () => {
    let calls = 0;
    const handler = tapOnce(async () => {
      calls += 1;
      throw new Error('x');
    });
    await expect(handler()).rejects.toThrow('x');
    await expect(handler()).rejects.toThrow('x');
    expect(calls).toBe(2);
  });
});
```

Run: `npm test -- __tests__/tapOnce.test.ts`
Expected: FAIL. `Cannot find module '../src/common/hooks/useTapOnce'`.

- [ ] **Step 2: Write it**

Create `src/common/hooks/useTapOnce.ts`:

```ts
import { useMemo, useRef } from 'react';

/**
 * Wraps a handler so a second tap while the first is still running is dropped:
 * a double tap on Submit sends one request, a double tap on a row navigates
 * once (spec 2026-10-15 §8.2).
 */
export function tapOnce<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => Promise<void> {
  let busy = false;
  return async (...args: A) => {
    if (busy) return;
    busy = true;
    try {
      await fn(...args);
    } finally {
      busy = false;
    }
  };
}

/** tapOnce for a component: stable across renders, always calls the latest fn. */
export function useTapOnce<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => Promise<void> {
  const latest = useRef(fn);
  latest.current = fn;
  return useMemo(() => tapOnce((...args: A) => latest.current(...args)), []);
}
```

Copy both files to mobile with `cmp`.

Run in each app: `npm test -- __tests__/tapOnce.test.ts`
Expected: 2 passing.

- [ ] **Step 3: Narrow the whole-slice selectors**

At each listed site, a component reads a whole slice, for example `const { language, isRTL } = useAppSelector(state => state.app)`, and so re-renders on any change to that slice. Select only the fields it uses, with `shallowEqual`:

```ts
import { shallowEqual } from 'react-redux';
const { language, isRTL } = useAppSelector(
  state => ({ language: state.app.language, isRTL: state.app.isRTL }),
  shallowEqual,
);
```

When the site reads one field, select that field alone: `const language = useAppSelector(state => state.app.language);`. When a site keeps the slice object and passes it down, select the fields its children read and pass those instead.

Afterwards, this grep must print nothing:

```bash
grep -rnE "useAppSelector\(\s*\(?state\)?\s*=>\s*state\.[a-zA-Z]+\s*\)" src App.tsx
```

- [ ] **Step 4: Run everything and commit, in both apps**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  npm run typecheck && npm test -- --ci && npm run check:i18n && npm run check:tokens && npm run check:consistency
  git add -A src App.tsx __tests__/tapOnce.test.ts
  git commit -m "perf(store): select only the fields a screen reads, and add tap-once for the sweeps"
done
```

Expected: everything passes.

---

### Task 8: Measure, and open the two PRs

**Files:**
- Modify: `docs/audits/2026-10-rn-runtime-baseline.md` in `design-tokens` (from Task 0). Add an "After Plan 3" column.

- [ ] **Step 1: Re-measure Home**

Repeat Task 0 Step 3, the React Profiler commit counts on staff Home and parent Home, on debug builds of the two `feat/rn-foundations` branches. Task 7's selector change targets those screens' re-renders. Record the after figures next to the before. Plan 3 changes no lists, so Flashlight is re-run in Plans 5 and 6, which do.

- [ ] **Step 2: Run the full CI steps locally, literally**

In each worktree:

```bash
npm ci --legacy-peer-deps && npm run typecheck && npm test -- --ci && npm run check:i18n && npm run check:tokens && npm run check:consistency && npm run lint
```

Record each step's result. Lint is advisory in both repos and carries pre-existing errors (teacher 56, mobile about 100). Report the count before and after; it must not rise.

- [ ] **Step 3: Rebuild the staff app's native side**

`react-native-snackbar` is gone, so build a fresh iOS app (`cd ios && bundle exec pod install`, then Xcode or `npm run ios`) and a fresh Android app (`npm run android`). Each must launch, and a toast must show on a failed write: turn the backend off and submit a vacation request.

- [ ] **Step 4: Push and open the PRs**

```bash
for app in teacher mobile; do
  cd /Users/fadyshawky/Dev/uprise/.worktrees/$app-foundations
  git -c credential.helper='!gh auth git-credential' push https://github.com/upriseEdu-tech/$app.git HEAD:refs/heads/feat/rn-foundations
done
```

Open one PR per repo against `main`, titled `feat: icons, feedback and confirmation foundations`. Each has:
- `## Why`: spec §5–6, and the audit counts.
- `## What`: one line per task.
- `## Verification`:
  - the literal CI step results
  - the new tests' counts
  - the `check:consistency` line, with the IconPlatform, icon-PNG and Alert counts left for the sweeps
  - screenshots from Tasks 2, 3 and 6 in English and Arabic
  - the Profiler before and after
- `## Native`: teacher only. `react-native-snackbar` removed, so pod install and a rebuild are needed.
- `## Risk & rollback`: revert the merge commit. In the staff app, also re-add `react-native-snackbar@3.0.1` and pod install.

Don't merge; the owner merges. Versions stay at 6.0.2 and 3.0.0.
