/**
 * The tokens the Uprise apps share.
 *
 * Data only. Nothing here may import `react-native`, `@mui/material`, or
 * anything else that knows its host — the dashboard consumes this package too,
 * and a `Platform.select` in here would break its build. The helpers that do
 * know their host stay in the app that owns them and read these values.
 *
 * No runtime dependencies, ever: three apps across two React Native versions
 * and one Vite build, so a dependency here is a version conflict in three
 * places.
 */
export { Colors, rebrandScreenCanvas, androidElevatedCardSurface } from './colors';
export { SharedHomeTokens } from './home';
export { NavigationShellTokens } from './navigationShell';
export {
  TabletScale,
  LayoutRhythm,
  Typography,
  LaunchScreen,
  SystemChrome,
  IconTokens,
} from './mobilePlatform';
export {
  IconConcepts,
  IconActions,
  IconStatuses,
  IconFeedback,
  IconSameMeaning,
  solarLinearName,
  iconifyName,
} from './icons';
export type { IconConcept, IconAction, IconStatus, IconFeedbackKind } from './icons';
export {
  FeedbackMessages,
  SessionErrorCodes,
  PermissionErrorCodes,
  fillFeedback,
  feedbackForError,
  feedbackForSuccess,
} from './feedback';
export type {
  FeedbackCatalogue,
  FeedbackLocale,
  FeedbackItem,
  FeedbackAction,
  FeedbackSuccess,
} from './feedback';
