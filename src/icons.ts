/**
 * One concept, one glyph, on every platform (spec 2026-10-15 §6).
 *
 * Values are Solar base names. The renderers add the style: the RN apps look
 * up `solarLinearName(glyph)` in their generated SOLAR_GLYPHS, the dashboard
 * passes `iconifyName(glyph)` to Iconify. Apps name a concept, an action or a
 * status — never a glyph — so a glyph change here moves all three apps.
 *
 * The first values were proposed on 2026-10-15 and are confirmed on the glyph
 * review page (Plan 1 Task 6). The audit that motivated them: `reports.png`
 * drew Assignments, Accident Reports and Staff Attendance in the staff app;
 * the dashboard drew five nav items with one folder; Pickup was a car in both
 * apps and a walking person on the dashboard.
 */

export const IconConcepts = {
  home: 'home-smile',
  dashboard: 'widget-2',
  students: 'users-group-rounded',
  parents: 'user-heart-rounded',
  pickupContacts: 'user-check-rounded',
  staff: 'user-id',
  staffRoles: 'shield-user',
  classes: 'square-academic-cap',
  studentAttendance: 'clipboard-check',
  staffAttendance: 'clipboard-clock',
  checkIn: 'scanner',
  branchQr: 'qr-code',
  vacation: 'suitcase',
  pickup: 'car',
  lateCheckout: 'clock-square',
  orientation: 'hand-shake',
  events: 'confetti',
  calendar: 'calendar',
  food: 'chef-hat',
  dailySchedule: 'checklist',
  learning: 'notebook',
  materials: 'book-2',
  assignments: 'clipboard-list',
  progressReports: 'graph-up',
  accidentReports: 'danger-triangle',
  medicalAssessments: 'stethoscope',
  medicalInfo: 'heart-pulse',
  gallery: 'gallery',
  videos: 'videocamera',
  chat: 'chat-round-dots',
  announcements: 'volume-loud',
  notifications: 'bell',
  reviews: 'star',
  websiteMessages: 'inbox-in',
  nurseries: 'buildings-2',
  branches: 'map-point-school',
  analytics: 'chart-square',
  invoices: 'bill-list',
  quotations: 'clipboard-text',
  documentTemplates: 'documents',
  requestLogs: 'server-square',
  deletedData: 'archive',
  nurseryPolicy: 'document',
  nurserySettings: 'tuning-2',
  systemSettings: 'server',
  appVersions: 'smartphone-update',
  settings: 'settings',
  profile: 'user-circle',
  more: 'widget-4',
  birthdays: 'gift',
  language: 'global',
  password: 'lock-password',
} as const;

/** Generic UI actions. Never used for a concept. */
export const IconActions = {
  back: 'alt-arrow-left',
  forward: 'alt-arrow-right',
  expand: 'alt-arrow-down',
  close: 'close',
  add: 'add',
  edit: 'pen-new-square',
  delete: 'trash-bin-minimalistic',
  search: 'magnifier',
  filter: 'filter',
  sort: 'sort',
  share: 'share',
  more: 'menu-dots',
  menu: 'hamburger-menu',
  download: 'download',
  upload: 'upload',
  send: 'plain',
  camera: 'camera',
  refresh: 'refresh',
  login: 'login-2',
  logout: 'logout-2',
  pickDate: 'calendar-minimalistic',
  view: 'eye',
  copy: 'copy',
  call: 'phone',
  email: 'letter',
  location: 'map-point',
  attach: 'paperclip',
  play: 'play',
  pause: 'pause',
} as const;

/** Reserved status glyphs (spec §6.1 rule 2). */
export const IconStatuses = {
  done: 'check-circle',
  pending: 'hourglass',
  rejected: 'close-circle',
  late: 'clock-circle',
  halfDay: 'sunset',
  vacation: 'suitcase',
  sickLeave: 'hand-pills',
} as const;

/** Toast and banner glyphs (spec §5). */
export const IconFeedback = {
  success: 'check-circle',
  error: 'danger-circle',
  info: 'info-circle',
  // Not danger-triangle: that is the accident-reports concept, and a glyph means one thing.
  warning: 'danger',
  offline: 'cloud-cross',
} as const;

/**
 * The only glyphs allowed to appear twice: each pair means one thing.
 * "On vacation" is the vacation concept; a successful action is "done".
 */
export const IconSameMeaning: readonly (readonly string[])[] = [
  ['concepts.vacation', 'statuses.vacation'],
  ['statuses.done', 'feedback.success'],
];

export type IconConcept = keyof typeof IconConcepts;
export type IconAction = keyof typeof IconActions;
export type IconStatus = keyof typeof IconStatuses;
export type IconFeedbackKind = keyof typeof IconFeedback;

/** Key in the RN apps' generated SOLAR_GLYPHS. */
export function solarLinearName(glyph: string): string {
  return `${glyph}-linear`;
}

/** Iconify name for the dashboard. */
export function iconifyName(glyph: string): string {
  return `solar:${glyph}-linear`;
}
