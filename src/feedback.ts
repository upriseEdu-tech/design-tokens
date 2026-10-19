/**
 * Every toast, inline error and confirmation the three apps show, in English
 * and Arabic (spec 2026-10-15 §4.1, §5). Apps wire these into their own i18n;
 * they never show the server's `message` (decision D4: the audit found raw
 * backend text in ~57% of dashboard error toasts and in both RN apps' global
 * interceptors, English-only and sometimes internal, e.g. "Not enough
 * Vacations").
 *
 * Arabic success and error templates use the verbal-noun form ("تم حفظ …",
 * "تعذّر حفظ …"), so one template agrees with every item regardless of gender.
 * English items are lower-case nouns; a template that opens with the item
 * writes `{{Item}}`, and fillFeedback capitalises it.
 */

const en = {
  success: {
    saved: '{{Item}} saved.',
    created: '{{Item}} created.',
    updated: '{{Item}} updated.',
    deleted: '{{Item}} deleted.',
    sent: '{{Item}} sent.',
    approved: '{{Item}} approved.',
    rejected: '{{Item}} rejected.',
    uploaded: '{{Item}} uploaded.',
    submitted: '{{Item}} submitted.',
    generated: '{{Item}} generated.',
    restored: '{{Item}} restored.',
    done: 'Done.',
  },
  error: {
    actionFailed: "Couldn't {{action}} the {{item}}. Try again.",
    unknown: 'Something went wrong. Try again.',
    loadFailed: "Couldn't load this. Try again.",
    offline: "You're offline. Check your connection and try again.",
    server: 'Something went wrong on our side. Try again in a moment.',
    sessionEnded: 'Your session ended. Please log in again.',
    permission: "You don't have access to this.",
    notFound: 'This item no longer exists.',
    accountSetup: "Your account isn't fully set up. Contact your administrator.",
  },
  actions: {
    save: 'save',
    create: 'create',
    update: 'update',
    delete: 'delete',
    send: 'send',
    approve: 'approve',
    reject: 'reject',
    upload: 'upload',
    submit: 'submit',
    load: 'load',
    generate: 'generate',
    restore: 'restore',
    assign: 'assign',
  },
  items: {
    vacationRequest: 'vacation request',
    album: 'album',
    photos: 'photos',
    video: 'video',
    activity: 'activity',
    announcement: 'announcement',
    message: 'message',
    student: 'student',
    attendance: 'attendance',
    checkIn: 'check-in',
    checkOut: 'check-out',
    pickupRequest: 'pickup request',
    contact: 'contact',
    accidentReport: 'accident report',
    medicalAssessment: 'medical assessment',
    assignment: 'assignment',
    progressReport: 'progress report',
    event: 'event',
    schedule: 'schedule',
    menu: 'menu',
    learningPlan: 'learning plan',
    material: 'material',
    class: 'class',
    branch: 'branch',
    nursery: 'nursery',
    invoice: 'invoice',
    quotation: 'quotation',
    template: 'template',
    settings: 'settings',
    profile: 'profile',
    password: 'password',
    review: 'review',
    lateCheckout: 'late checkout',
    staffMember: 'staff member',
    parent: 'parent',
    shift: 'shift',
    note: 'note',
    tags: 'tags',
    appVersion: 'app version',
    qrCode: 'QR code',
    role: 'role',
    policy: 'policy',
    specialDay: 'special day',
    payment: 'payment',
    apiKey: 'API key',
    booking: 'booking',
  },
  confirm: {
    deleteTitle: 'Delete the {{item}}?',
    deleteBody: "This can't be undone.",
    deleteConfirm: 'Delete',
    logoutTitle: 'Log out?',
    logoutBody: "You'll need to log in again to use the app.",
    logoutConfirm: 'Log out',
    discardTitle: 'Discard changes?',
    discardBody: 'Your changes will be lost.',
    discardConfirm: 'Discard',
    cancel: 'Cancel',
  },
  errors: {
    ON_VACATION: "You're on vacation today, so check-in is closed.",
    NOT_ENOUGH_VACATION_DAYS: "You don't have enough vacation days left.",
    NOT_WORKING_DAY: "Today isn't a working day for your branch.",
    LOCATION_REQUIRED: 'Turn on location to check in.',
    DEVICE_ID_REQUIRED: "This device couldn't be identified. Restart the app and try again.",
    QR_NOT_RECOGNIZED: "This QR code isn't recognised. Scan your branch's code.",
    STAFF_CHECKED_IN: 'This staff member is checked in. Check them out before changing their shift.',
    NO_OPEN_CHECKIN: "You haven't checked in yet today.",
    OPEN_SHIFT_NOT_CHECKED_OUT: 'Check out of your current shift before checking in again.',
    SHIFT_ALREADY_COMPLETE: "You've already checked in and out for this shift.",
    SHIFT_ALREADY_RECORDED: 'Attendance for this shift is already recorded.',
    NO_SHIFT_FOR_TIME: 'You have no shift at this time. Contact your administrator.',
    MODULE_DISABLED: "This feature isn't enabled for your branch.",
    NURSERY_SUSPENDED: "This nursery's account is suspended. Please contact the nursery.",
    ACCOUNT_DISABLED: 'Your account is disabled. Contact your administrator.',
    PASSWORD_CHANGED: 'Your password was changed. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Wait a moment and try again.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Wait a moment and try again.',
    NOT_EDITABLE: "This can't be edited anymore.",
    NOT_PENDING: 'This has already been reviewed.',
    CONTENT_TOO_LONG: "That's too long. Shorten it and try again.",
    EMPTY_CONTENT: 'Write something before sending.',
    NO_RECIPIENTS: "This announcement has no recipients, so it can't be sent.",
    DUPLICATE_KEY: 'This already exists.',
    CLASS_FULL: 'This class is full.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: "This student has attendance this month, so they can't be put on hold.",
    VALIDATION_ERROR: 'Some details are missing or invalid. Check the form.',
    OUTSIDE_GEOFENCE: "You're outside the branch. Move closer and scan again.",
    BRANCH_MISMATCH: "This QR code belongs to another branch. Scan your branch's code.",
    DEVICE_MISMATCH: 'Check in from the device registered to your account.',
    ALREADY_CHECKED_IN: "You're already checked in today.",
    ALREADY_MARKED: 'Attendance for today is already recorded.',
    BRANCH_CLOSED: 'The branch is closed on this date.',
    FUTURE_DATE_NOT_ALLOWED: "You can't mark attendance for a future date.",
    PAST_DATE_NOT_ALLOWED: 'Only an admin can mark attendance for a past date.',
    ALREADY_CHECKED_OUT: 'This student is already checked out for this date.',
    STUDENT_ON_HOLD: "This student is on hold, so they can't be checked out.",
    STUDENT_NO_BRANCH: "This student isn't assigned to a branch yet.",
    ALREADY_REVIEWED: 'This report has already been reviewed.',
    ALREADY_SUBMITTED: 'This assessment has already been submitted.',
    STUDENTS_NOT_EDITABLE: "You can edit the text, but not who it's sent to.",
    UNSUPPORTED_IMAGE_TYPE: 'Choose a JPG, PNG or WebP image.',
    UPLOAD_TYPE_NOT_ALLOWED: "This file type can't be uploaded.",
    INVALID_CREDENTIALS: 'The email or password is incorrect.',
    WRONG_CURRENT_PASSWORD: 'Your current password is incorrect.',
    WEAK_PASSWORD:
      'Use at least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol (!@#$%^&*).',
    PASSWORD_CHANGE_ERROR: "Couldn't change your password. Try again.",
    ACCOUNT_LOCKED: 'Too many failed attempts. Your account is locked for a while. Try again later.',
    SLOT_UNAVAILABLE: 'That time slot is no longer available. Choose another.',
    ORIENTATION_UNAVAILABLE: "Orientation booking isn't available for this branch right now.",
    EMAIL_TAKEN: 'This email is already in use.',
    PARENT_ALREADY_LINKED: 'This guardian is already linked to this student.',
    KEY_CONFLICT: 'Someone else changed this at the same time. Reload and try again.',
  },
};

type Catalogue = typeof en;

const ar: Catalogue = {
  success: {
    saved: 'تم حفظ {{item}}.',
    created: 'تم إنشاء {{item}}.',
    updated: 'تم تحديث {{item}}.',
    deleted: 'تم حذف {{item}}.',
    sent: 'تم إرسال {{item}}.',
    approved: 'تم اعتماد {{item}}.',
    rejected: 'تم رفض {{item}}.',
    uploaded: 'تم رفع {{item}}.',
    submitted: 'تم تقديم {{item}}.',
    generated: 'تم توليد {{item}}.',
    restored: 'تمت استعادة {{item}}.',
    done: 'تم.',
  },
  error: {
    actionFailed: 'تعذّر {{action}} {{item}}. حاول مرة أخرى.',
    unknown: 'حدث خطأ. حاول مرة أخرى.',
    loadFailed: 'تعذّر التحميل. حاول مرة أخرى.',
    offline: 'أنت غير متصل بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.',
    server: 'حدث خطأ من جهتنا. حاول مرة أخرى بعد قليل.',
    sessionEnded: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
    permission: 'ليس لديك صلاحية الوصول إلى هذا.',
    notFound: 'هذا العنصر لم يعد موجودًا.',
    accountSetup: 'حسابك غير مكتمل الإعداد. تواصل مع المسؤول.',
  },
  actions: {
    save: 'حفظ',
    create: 'إنشاء',
    update: 'تحديث',
    delete: 'حذف',
    send: 'إرسال',
    approve: 'اعتماد',
    reject: 'رفض',
    upload: 'رفع',
    submit: 'تقديم',
    load: 'تحميل',
    generate: 'توليد',
    restore: 'استعادة',
    assign: 'تعيين',
  },
  items: {
    vacationRequest: 'طلب الإجازة',
    album: 'الألبوم',
    photos: 'الصور',
    video: 'الفيديو',
    activity: 'النشاط',
    announcement: 'الإعلان',
    message: 'الرسالة',
    student: 'الطالب',
    attendance: 'الحضور',
    checkIn: 'تسجيل الحضور',
    checkOut: 'تسجيل الانصراف',
    pickupRequest: 'طلب الاستلام',
    contact: 'جهة الاتصال',
    accidentReport: 'تقرير الحادث',
    medicalAssessment: 'التقييم الطبي',
    assignment: 'التكليف',
    progressReport: 'تقرير التقدم',
    event: 'الفعالية',
    schedule: 'الجدول',
    menu: 'قائمة الطعام',
    learningPlan: 'خطة التعلم',
    material: 'المادة',
    class: 'الفصل',
    branch: 'الفرع',
    nursery: 'الحضانة',
    invoice: 'الفاتورة',
    quotation: 'عرض السعر',
    template: 'القالب',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    password: 'كلمة المرور',
    review: 'التقييم',
    lateCheckout: 'الانصراف المتأخر',
    staffMember: 'الموظف',
    parent: 'ولي الأمر',
    shift: 'الوردية',
    note: 'الملاحظة',
    tags: 'الوسوم',
    appVersion: 'إصدار التطبيق',
    qrCode: 'رمز QR',
    role: 'الدور',
    policy: 'السياسة',
    specialDay: 'اليوم الخاص',
    payment: 'الدفعة',
    apiKey: 'مفتاح API',
    booking: 'الحجز',
  },
  confirm: {
    deleteTitle: 'حذف {{item}}؟',
    deleteBody: 'لا يمكن التراجع عن هذا الإجراء.',
    deleteConfirm: 'حذف',
    logoutTitle: 'تسجيل الخروج؟',
    logoutBody: 'ستحتاج إلى تسجيل الدخول مرة أخرى لاستخدام التطبيق.',
    logoutConfirm: 'تسجيل الخروج',
    discardTitle: 'تجاهل التغييرات؟',
    discardBody: 'ستفقد التغييرات التي أجريتها.',
    discardConfirm: 'تجاهل',
    cancel: 'إلغاء',
  },
  errors: {
    ON_VACATION: 'أنت في إجازة اليوم، لذا تسجيل الحضور غير متاح.',
    NOT_ENOUGH_VACATION_DAYS: 'ليس لديك أيام إجازة كافية.',
    NOT_WORKING_DAY: 'اليوم ليس يوم عمل في فرعك.',
    LOCATION_REQUIRED: 'فعّل خدمة الموقع لتسجيل الحضور.',
    DEVICE_ID_REQUIRED: 'تعذّر التعرّف على هذا الجهاز. أعد تشغيل التطبيق وحاول مرة أخرى.',
    QR_NOT_RECOGNIZED: 'رمز QR غير معروف. امسح رمز فرعك.',
    STAFF_CHECKED_IN: 'هذا الموظف مسجّل حضوره الآن. سجّل انصرافه قبل تغيير ورديته.',
    NO_OPEN_CHECKIN: 'لم تسجّل حضورك اليوم بعد.',
    OPEN_SHIFT_NOT_CHECKED_OUT: 'سجّل انصرافك من ورديتك الحالية قبل تسجيل الحضور مرة أخرى.',
    SHIFT_ALREADY_COMPLETE: 'سجّلت حضورك وانصرافك لهذه الوردية بالفعل.',
    SHIFT_ALREADY_RECORDED: 'تم تسجيل الحضور لهذه الوردية بالفعل.',
    NO_SHIFT_FOR_TIME: 'ليس لديك وردية في هذا الوقت. تواصل مع المسؤول.',
    MODULE_DISABLED: 'هذه الميزة غير مفعّلة في فرعك.',
    NURSERY_SUSPENDED: 'حساب الحضانة موقوف. يرجى التواصل مع الحضانة.',
    ACCOUNT_DISABLED: 'حسابك معطّل. تواصل مع المسؤول.',
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور. سجّل الدخول مرة أخرى.',
    RATE_LIMITED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    RATE_LIMIT_EXCEEDED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    NOT_EDITABLE: 'لم يعد بالإمكان تعديل هذا.',
    NOT_PENDING: 'تمت مراجعة هذا بالفعل.',
    CONTENT_TOO_LONG: 'النص طويل جدًا. اختصره وحاول مرة أخرى.',
    EMPTY_CONTENT: 'اكتب شيئًا قبل الإرسال.',
    NO_RECIPIENTS: 'لا يوجد مستلمون لهذا الإعلان، لذا لا يمكن إرساله.',
    DUPLICATE_KEY: 'هذا موجود بالفعل.',
    CLASS_FULL: 'هذا الفصل مكتمل.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: 'لدى هذا الطالب حضور هذا الشهر، لذا لا يمكن تعليقه.',
    VALIDATION_ERROR: 'بعض البيانات ناقصة أو غير صحيحة. راجع النموذج.',
    OUTSIDE_GEOFENCE: 'أنت خارج نطاق الفرع. اقترب وامسح الرمز مرة أخرى.',
    BRANCH_MISMATCH: 'رمز QR هذا لفرع آخر. امسح رمز فرعك.',
    DEVICE_MISMATCH: 'سجّل حضورك من الجهاز المسجّل لحسابك.',
    ALREADY_CHECKED_IN: 'لقد سجّلت حضورك اليوم بالفعل.',
    ALREADY_MARKED: 'تم تسجيل الحضور لهذا اليوم بالفعل.',
    BRANCH_CLOSED: 'الفرع مغلق في هذا التاريخ.',
    FUTURE_DATE_NOT_ALLOWED: 'لا يمكن تسجيل الحضور لتاريخ مستقبلي.',
    PAST_DATE_NOT_ALLOWED: 'يمكن للمسؤول فقط تسجيل الحضور لتاريخ سابق.',
    ALREADY_CHECKED_OUT: 'تم تسجيل انصراف هذا الطالب لهذا التاريخ بالفعل.',
    STUDENT_ON_HOLD: 'هذا الطالب معلّق، لذا لا يمكن تسجيل انصرافه.',
    STUDENT_NO_BRANCH: 'هذا الطالب غير مرتبط بفرع بعد.',
    ALREADY_REVIEWED: 'تمت مراجعة هذا التقرير بالفعل.',
    ALREADY_SUBMITTED: 'تم تقديم هذا التقييم بالفعل.',
    STUDENTS_NOT_EDITABLE: 'يمكنك تعديل النص فقط، دون تغيير المستلمين.',
    UNSUPPORTED_IMAGE_TYPE: 'اختر صورة بصيغة JPG أو PNG أو WebP.',
    UPLOAD_TYPE_NOT_ALLOWED: 'لا يمكن رفع هذا النوع من الملفات.',
    INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    WRONG_CURRENT_PASSWORD: 'كلمة المرور الحالية غير صحيحة.',
    WEAK_PASSWORD: 'استخدم 8 أحرف على الأقل، تتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا (!@#$%^&*).',
    PASSWORD_CHANGE_ERROR: 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.',
    ACCOUNT_LOCKED: 'محاولات فاشلة كثيرة. تم قفل حسابك مؤقتًا. حاول لاحقًا.',
    SLOT_UNAVAILABLE: 'هذا الموعد لم يعد متاحًا. اختر موعدًا آخر.',
    ORIENTATION_UNAVAILABLE: 'حجز الجولة التعريفية غير متاح لهذا الفرع حاليًا.',
    EMAIL_TAKEN: 'هذا البريد الإلكتروني مستخدم بالفعل.',
    PARENT_ALREADY_LINKED: 'هذا الولي مرتبط بالفعل بهذا الطالب.',
    KEY_CONFLICT: 'قام شخص آخر بتغيير هذا في الوقت نفسه. أعد التحميل وحاول مرة أخرى.',
  },
};

export const FeedbackMessages = { en, ar };
export type FeedbackCatalogue = Catalogue;
export type FeedbackLocale = keyof typeof FeedbackMessages;
export type FeedbackItem = keyof Catalogue['items'];
export type FeedbackAction = keyof Catalogue['actions'];
export type FeedbackSuccess = keyof Catalogue['success'];

// The families word a code that has no entry of its own. They decide text
// only: logging out stays with each app's 401 handling, which also covers
// PASSWORD_CHANGED and NURSERY_SUSPENDED. test/catalogue-codes.test.js checks
// every backend code lands in an entry or a family, and in only one.

/** Codes that mean "log in again" (backend auth_middleware / jwt_service). */
export const SessionErrorCodes: readonly string[] = [
  'TOKEN_EXPIRED',
  'SESSION_EXPIRED',
  'INVALID_TOKEN',
  'NO_TOKEN',
  'NO_REFRESH_TOKEN',
  'REFRESH_TOKEN_ERROR',
  'UNAUTHENTICATED',
  'AUTHENTICATION_ERROR',
  'INVALID_SESSION',
  'INVALID_REFRESH_TOKEN',
  'TOKEN_REFRESH_ERROR',
  'INVALID_USER',
  'INVALID_USER_ID',
];

/** Codes that mean "you can't reach this" (scope_policy and friends). */
export const PermissionErrorCodes: readonly string[] = [
  'FORBIDDEN',
  'UNAUTHORIZED',
  'STAFF_ID_MISMATCH',
  'USER_ID_MISMATCH',
  'PARENT_OUTSIDE_TENANT',
  'STUDENT_NO_SCOPE',
  'ROLE_NOT_ASSIGNABLE',
  'ROLE_NOT_MANAGEABLE',
  'CHAT_SEND_FORBIDDEN',
  'STUDENT_OUTSIDE_CLASS',
  'ALBUM_CLASS_NOT_ALLOWED',
  'ALBUM_PLACEMENT_NOT_ALLOWED',
  'TAG_NOT_ALLOWED',
  'UPLOAD_FOLDER_NOT_ALLOWED',
  'CLASS_MOVE_NOT_ALLOWED',
  'STUDENT_PLACEMENT_NOT_ALLOWED',
  'CATALOG_READ_ONLY',
];

/**
 * Codes that mean the signed-in account is missing a link it needs (a staff
 * row, a branch, a class, a parent profile). Some end in _NOT_FOUND, so this
 * family is read before the not-found one: at login, "this item no longer
 * exists" would be wrong.
 */
export const AccountSetupErrorCodes: readonly string[] = [
  'INVALID_USER_ACCOUNT',
  'INVALID_STAFF_USER_ID',
  'INVALID_TOKEN_DATA',
  'NO_STUDENT_FOUND',
  'STAFF_RECORD_NOT_FOUND',
  'PARENT_PROFILE_NOT_FOUND',
  'NO_STAFF_RECORD',
  'NO_NURSERY',
  'NO_BRANCH_ASSIGNED',
  'STAFF_NO_BRANCH',
  'NO_BRANCH',
  'NO_CLASS',
];

/** Codes for malformed input, worded as VALIDATION_ERROR. */
export const ValidationErrorCodes: readonly string[] = [
  'INVALID_ID',
  'INVALID_BRANCH_ID',
  'INVALID_STAFF_ID',
  'INVALID_NURSERY_ID',
  'MISSING_PARAMETER',
  'BRANCH_ID_REQUIRED',
  'PICKUP_ID_REQUIRED',
  'CLASS_BRANCH_MISMATCH',
  'SHIFT_NURSERY_MISMATCH',
  'EMPTY_STUDENTS',
];

export function fillFeedback(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name.toLowerCase()] ?? '';
    return name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
  });
}

// Own-property lookups: these run on the error path with values from i18n
// state and from the server, so an unknown locale, kind, action, item or code
// falls back instead of throwing or reading Object.prototype.
function has<T extends object>(obj: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);
}

function catalogueFor(locale: unknown): Catalogue {
  return has(FeedbackMessages, locale) ? FeedbackMessages[locale] : FeedbackMessages.en;
}

export function feedbackForSuccess(locale: FeedbackLocale, kind: FeedbackSuccess, item: FeedbackItem): string {
  const m = catalogueFor(locale);
  if (!has(m.success, kind) || !has(m.items, item)) return m.success.done;
  return fillFeedback(m.success[kind], { item: m.items[item] });
}

/**
 * The text for a failed write. A known code wins; an unknown one is read by
 * its family, then by HTTP status; anything left is the action message. Never
 * returns the server's own text and never returns empty (status 0 is how
 * axios reports "no response": offline). It never throws either: an unknown
 * locale reads English, a non-string code is ignored, and an action or item
 * the catalogue lacks gives a whole sentence rather than one with a hole.
 */
export function feedbackForError(
  locale: FeedbackLocale,
  error: { code?: string | null; status?: number | null },
  action: FeedbackAction,
  item: FeedbackItem,
): string {
  const m = catalogueFor(locale);
  const code = typeof error?.code === 'string' ? error.code : undefined;
  const status = typeof error?.status === 'number' ? error.status : undefined;
  if (has(m.errors, code)) return m.errors[code];
  if (code && SessionErrorCodes.includes(code)) return m.error.sessionEnded;
  if (code && PermissionErrorCodes.includes(code)) return m.error.permission;
  if (code && AccountSetupErrorCodes.includes(code)) return m.error.accountSetup;
  if (code && ValidationErrorCodes.includes(code)) return m.errors.VALIDATION_ERROR;
  if (code && (code === 'NOT_FOUND' || code.endsWith('_NOT_FOUND'))) return m.error.notFound;
  if (status === 0) return m.error.offline;
  if (status === 401) return m.error.sessionEnded;
  if (status === 403) return m.error.permission;
  if (status === 404) return m.error.notFound;
  if (status != null && status >= 500) return m.error.server;
  if (!has(m.actions, action) || !has(m.items, item)) return m.error.unknown;
  return fillFeedback(m.error.actionFailed, { action: m.actions[action], item: m.items[item] });
}
