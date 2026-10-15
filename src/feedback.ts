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
  },
  error: {
    actionFailed: "Couldn't {{action}} the {{item}}. Try again.",
    loadFailed: "Couldn't load this. Try again.",
    offline: "You're offline. Check your connection and try again.",
    server: 'Something went wrong on our side. Try again in a moment.',
    sessionEnded: 'Your session ended. Please log in again.',
    permission: "You don't have access to this.",
    notFound: 'This item no longer exists.',
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
    STAFF_CHECKED_IN: "You're already checked in.",
    NO_OPEN_CHECKIN: "You haven't checked in yet today.",
    OPEN_SHIFT_NOT_CHECKED_OUT: 'Check out of your previous shift first.',
    SHIFT_ALREADY_COMPLETE: 'This shift is already complete.',
    SHIFT_ALREADY_RECORDED: 'Attendance for this shift is already recorded.',
    NO_SHIFT_FOR_TIME: "There's no shift at this time.",
    MODULE_DISABLED: "This feature isn't enabled for your branch.",
    NURSERY_SUSPENDED: "Your nursery's account is suspended. Contact your administrator.",
    ACCOUNT_DISABLED: 'Your account is disabled. Contact your administrator.',
    PASSWORD_CHANGED: 'Your password was changed. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Wait a moment and try again.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Wait a moment and try again.',
    NOT_EDITABLE: "This can't be edited anymore.",
    NOT_PENDING: 'This request has already been handled.',
    CONTENT_TOO_LONG: "That's too long. Shorten it and try again.",
    EMPTY_CONTENT: 'Write something before sending.',
    NO_RECIPIENTS: 'Choose at least one recipient.',
    DUPLICATE_KEY: 'This already exists.',
    CLASS_FULL: 'This class is full.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: "This student has attendance this month, so they can't be removed.",
    VALIDATION_ERROR: 'Some details are missing or invalid. Check the form.',
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
  },
  error: {
    actionFailed: 'تعذّر {{action}} {{item}}. حاول مرة أخرى.',
    loadFailed: 'تعذّر التحميل. حاول مرة أخرى.',
    offline: 'أنت غير متصل بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.',
    server: 'حدث خطأ من جهتنا. حاول مرة أخرى بعد قليل.',
    sessionEnded: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
    permission: 'ليس لديك صلاحية الوصول إلى هذا.',
    notFound: 'هذا العنصر لم يعد موجودًا.',
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
    STAFF_CHECKED_IN: 'لقد سجّلت حضورك بالفعل.',
    NO_OPEN_CHECKIN: 'لم تسجّل حضورك اليوم بعد.',
    OPEN_SHIFT_NOT_CHECKED_OUT: 'سجّل انصرافك من الوردية السابقة أولًا.',
    SHIFT_ALREADY_COMPLETE: 'اكتملت هذه الوردية بالفعل.',
    SHIFT_ALREADY_RECORDED: 'تم تسجيل الحضور لهذه الوردية بالفعل.',
    NO_SHIFT_FOR_TIME: 'لا توجد وردية في هذا الوقت.',
    MODULE_DISABLED: 'هذه الميزة غير مفعّلة في فرعك.',
    NURSERY_SUSPENDED: 'حساب حضانتك موقوف. تواصل مع المسؤول.',
    ACCOUNT_DISABLED: 'حسابك معطّل. تواصل مع المسؤول.',
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور. سجّل الدخول مرة أخرى.',
    RATE_LIMITED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    RATE_LIMIT_EXCEEDED: 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    NOT_EDITABLE: 'لم يعد بالإمكان تعديل هذا.',
    NOT_PENDING: 'تمت معالجة هذا الطلب بالفعل.',
    CONTENT_TOO_LONG: 'النص طويل جدًا. اختصره وحاول مرة أخرى.',
    EMPTY_CONTENT: 'اكتب شيئًا قبل الإرسال.',
    NO_RECIPIENTS: 'اختر مستلمًا واحدًا على الأقل.',
    DUPLICATE_KEY: 'هذا موجود بالفعل.',
    CLASS_FULL: 'هذا الفصل مكتمل.',
    STUDENT_HAS_CURRENT_MONTH_ATTENDANCE: 'لدى هذا الطالب حضور هذا الشهر، لذا لا يمكن حذفه.',
    VALIDATION_ERROR: 'بعض البيانات ناقصة أو غير صحيحة. راجع النموذج.',
  },
};

export const FeedbackMessages = { en, ar };
export type FeedbackCatalogue = Catalogue;
export type FeedbackLocale = keyof typeof FeedbackMessages;
export type FeedbackItem = keyof Catalogue['items'];
export type FeedbackAction = keyof Catalogue['actions'];
export type FeedbackSuccess = keyof Catalogue['success'];

/** Codes that mean "log in again" (backend auth_middleware / jwt_service). */
export const SessionErrorCodes: readonly string[] = [
  'TOKEN_EXPIRED',
  'SESSION_EXPIRED',
  'INVALID_TOKEN',
  'NO_TOKEN',
  'NO_REFRESH_TOKEN',
  'REFRESH_TOKEN_ERROR',
  'UNAUTHENTICATED',
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
];

export function fillFeedback(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name.toLowerCase()] ?? '';
    return name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
  });
}

export function feedbackForSuccess(locale: FeedbackLocale, kind: FeedbackSuccess, item: FeedbackItem): string {
  const m = FeedbackMessages[locale];
  return fillFeedback(m.success[kind], { item: m.items[item] });
}

/**
 * The text for a failed write. A known code wins; an unknown one is read by
 * its family, then by HTTP status; anything left is the action message. Never
 * returns the server's own text and never returns empty (status 0 is how
 * axios reports "no response": offline).
 *
 * Known codes are an own-property check: `in` would also match
 * Object.prototype keys, and a code "constructor" would return a function.
 */
export function feedbackForError(
  locale: FeedbackLocale,
  error: { code?: string | null; status?: number | null },
  action: FeedbackAction,
  item: FeedbackItem,
): string {
  const m = FeedbackMessages[locale];
  const { code, status } = error;
  if (code && Object.prototype.hasOwnProperty.call(m.errors, code)) {
    return m.errors[code as keyof Catalogue['errors']];
  }
  if (code && SessionErrorCodes.includes(code)) return m.error.sessionEnded;
  if (code && PermissionErrorCodes.includes(code)) return m.error.permission;
  if (code && (code === 'NOT_FOUND' || code.endsWith('_NOT_FOUND'))) return m.error.notFound;
  if (status === 0) return m.error.offline;
  if (status === 401) return m.error.sessionEnded;
  if (status === 403) return m.error.permission;
  if (status === 404) return m.error.notFound;
  if (status != null && status >= 500) return m.error.server;
  return fillFeedback(m.error.actionFailed, { action: m.actions[action], item: m.items[item] });
}
