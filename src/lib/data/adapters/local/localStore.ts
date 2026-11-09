import { memberPlan, dailyRequestLimit, requestDay } from '../../../../../shared/membership.js';
import { DEMO_ADMIN_PASSWORD } from '../../../constants';
// ============================================================
//  مخزن بيانات محلي — يحاكي قاعدة البيانات بالكامل (للتجربة فقط)
//  كل شيء في localStorage — لا اتصال بأي خادم أو قاعدة البيانات المحلية
//  عند الانتهاء من التصميم سنستبدل هذا الملف بطبقة API حقيقية
// ============================================================

import { MEMBERS } from '../../../members';
import type { Member } from '../../../members';
import { INTEREST_REQUESTS } from '../../../data';
import { normalizeNationality } from '../../optionNormalizer';

const memoryStorage = new Map<string, string>();

const getLocalSetting = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {}
  }
  return memoryStorage.get(key) ?? null;
};
const setLocalSetting = (key: string, value: string): void => {
  memoryStorage.set(key, value);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  }
};
const removeLocalSetting = (key: string): void => {
  memoryStorage.delete(key);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
};

// الحساب الافتراضي عند عدم وجود انتحال هوية
export const DEFAULT_USER_ID = 'm2';

// ===== مصدر الأعضاء الموحّد =====
// يقرأ تعديلات الإدارة المحفوظة في saved_members_list (يضبطها AppContext
// عند adminUpdateMember / الموافقة / التعديل) ثم يسقط إلى القائمة الأصلية.
// هكذا تظهر تعديلات الإدارة فوراً للطرف الآخر في صفحة الطلبات والرحلة.
export function getLiveMembers(includeInactiveAndDeleted: boolean = false): Member[] {
  let list: Member[] = [];
  if (typeof window !== 'undefined') {
    try {
      const savedAdmin = getLocalSetting('saved_admin_members_list');
      const savedPublic = getLocalSetting('saved_members_list');
      const savedTwafok = getLocalSetting('twafok_members');
      const raw = includeInactiveAndDeleted 
        ? (savedAdmin || savedPublic || savedTwafok)
        : (savedPublic || savedAdmin || savedTwafok);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed as Member[];
      }
    } catch { /* تجاهل */ }
  }

  const isPurged = typeof window !== 'undefined' && getLocalSetting('members_purged') === 'true';
  const hasSavedList = typeof window !== 'undefined' && (getLocalSetting('saved_members_list') !== null || getLocalSetting('saved_admin_members_list') !== null);

  if (list.length === 0 && !isPurged && !hasSavedList) {
    list = [...MEMBERS];
  }

  // ضمان إدراج أي أعضاء مضافين في MEMBERS لم ينزلوا في القائمة المحفوظة مسبقاً في localStorage
  const existingIds = new Set(list.map((m) => m.id));
  const adminMetaForMerge = typeof window !== 'undefined' ? readAdminMeta() : {};
  MEMBERS.forEach((m) => {
    if (!existingIds.has(m.id) && !adminMetaForMerge[m.id]?.deleted) {
      list.push(m);
      existingIds.add(m.id);
    } else if (existingIds.has(m.id)) {
      const idx = list.findIndex((item) => item.id === m.id);
      if (idx !== -1) {
        // الدمج ذكي: نحتفظ بالتعديلات المخزنة مع ضمان تعبئة أي حقول ناقصة من التعريف الرئيسي م
        const item = list[idx];
        const isDefaultSeed = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'reg-m101', 'reg-f102', 'imp-88001', 'imp-88002'].includes(m.id);
        const shouldOverrideDefaultQatar = isDefaultSeed && (item.country === 'السعودية' || item.nationality === 'السعودية' || item.nationality === 'سعودي' || item.nationality === 'سعودية');
        const isSingle = ['single', 'أعزب', 'عزباء'].includes(item.maritalStatus || m.maritalStatus);
        list[idx] = {
          ...m,
          ...item,
          nationality: shouldOverrideDefaultQatar ? m.nationality : normalizeNationality(item.nationality || m.nationality),
          country: shouldOverrideDefaultQatar ? m.country : normalizeNationality(item.country || m.country),
          city: shouldOverrideDefaultQatar ? m.city : (item.city || m.city),
          district: shouldOverrideDefaultQatar ? m.district : (item.district || m.district),
          nickname: shouldOverrideDefaultQatar ? m.nickname : (item.nickname || m.nickname),
          name: shouldOverrideDefaultQatar ? m.name : (item.name || m.name),
          displayName: shouldOverrideDefaultQatar ? m.displayName : (item.displayName || m.displayName),
          bio: shouldOverrideDefaultQatar ? m.bio : (item.bio || m.bio),
          aboutPartner: shouldOverrideDefaultQatar ? m.aboutPartner : (item.aboutPartner || m.aboutPartner),
          pCountry: shouldOverrideDefaultQatar ? m.pCountry : (item.pCountry || m.pCountry),
          pCity: shouldOverrideDefaultQatar ? m.pCity : (item.pCity || m.pCity),
          pNationality: shouldOverrideDefaultQatar ? m.pNationality : (item.pNationality || m.pNationality),
          phone: shouldOverrideDefaultQatar ? m.phone : (item.phone || m.phone),
          whatsapp: shouldOverrideDefaultQatar ? m.whatsapp : (item.whatsapp || m.whatsapp),
          tribe: shouldOverrideDefaultQatar ? m.tribe : (item.tribe || m.tribe),
          sect: item.sect || m.sect,
          wifeCount: isSingle ? '' : (item.wifeCount || (m as any).wifeCount),
          seekingWife: isSingle ? '' : (item.seekingWife || (m as any).seekingWife),
          acceptPolygamy: item.acceptPolygamy || (m as any).acceptPolygamy,
          acceptDivorced: item.acceptDivorced || (m as any).acceptDivorced,
          acceptWithChildren: item.acceptWithChildren || (m as any).acceptWithChildren,
          childrenLiveWith: isSingle && !item.hasChildren ? '' : (item.childrenLiveWith || (m as any).childrenLiveWith),
          childrenCount: isSingle && !item.hasChildren ? '' : (item.childrenCount || (m as any).childrenCount),
          health: item.health || m.health,
          smoking: item.smoking || m.smoking,
          jobTitle: item.jobTitle || m.jobTitle,
          housing: item.housing || m.housing,
          pMaritalStatus: item.pMaritalStatus === 'أعزب أو مطلق بدون أبناء' ? 'أعزب، مطلق' : (item.pMaritalStatus || (m as any).pMaritalStatus),
        };
      }
    }
  });

  // دمج بيانات adminMeta (مثل الحذف والحظر) على كافة كائنات الأعضاء
  if (typeof window !== 'undefined') {
    try {
      const adminMeta = readAdminMeta();
      list = list.map((m) => {
        const meta = adminMeta[m.id];
        if (meta) {
          return {
            ...m,
            status: meta.deleted ? 'deleted' : (meta.status || m.status),
            deleted: !!meta.deleted,
          };
        }
        return m;
      });
    } catch { /* تجاهل */ }
  }

  // فلترة الأعضاء غير النشطين أو المحذوفين (إلا إذا طُلبوا صراحةً)
  if (typeof window !== 'undefined' && !includeInactiveAndDeleted) {
    list = list.filter((m) => {
      if (m.deleted) return false;
      if (m.status && m.status !== 'active') return false;
      return true;
    });
  }

  // دمج حالة سداد رسوم الجدية مع وسام الجدية بشكل ديناميكي
  try {
    const raw = typeof window !== 'undefined' ? getLocalSetting(STORAGE_KEY) : null;
    if (raw) {
      const parsedDB = JSON.parse(raw);
      if (parsedDB && Array.isArray(parsedDB.requests)) {
        const paidUsers = new Set<string>();
        parsedDB.requests.forEach((r: any) => {
          if (r.sender_paid && r.sender_paid_at) paidUsers.add(r.sender_id);
          if (r.receiver_paid && r.receiver_paid_at) paidUsers.add(r.receiver_id);
        });
        return list;
      }
    }
  } catch {}

  return list;
}

export function getLiveMemberById(id: string): Member | undefined {
  return getLiveMembers(true).find((m) => m.id === id);
}

// ===== الهوية النشطة (تتغيّر عند الدخول لحساب من لوحة التحكم) =====
// تُقرأ من active_member_id الذي يضبطه impersonateUser في AppContext
export function getCurrentUserId(): string {
  if (typeof window !== 'undefined') {
    try {
      const active = getLocalSetting('active_member_id');
      if (active && active.trim()) return active.trim();

      const authUserRaw = getLocalSetting('auth_user');
      if (authUserRaw) {
        const authUser = JSON.parse(authUserRaw);
        if (authUser?.isLoggedIn && authUser?.memberId && String(authUser.memberId).trim()) {
          return String(authUser.memberId).trim();
        }
      }
    } catch { /* تجاهل */ }
  }
  return '';
}

export function setCurrentUserId(id: string) {
  if (typeof window !== 'undefined') {
    try { setLocalSetting('active_member_id', id); } catch { /* تجاهل */ }
  }
}

// للتوافق الرجعي مع الكود القديم — لكن يُفضّل استخدام getCurrentUserId()
export const CURRENT_USER_ID = DEFAULT_USER_ID;

// ===== تتبّع "غير المقروء" — متى آخر مرة شاهد المستخدم كل طلب =====
const SEEN_KEY = 'requests_last_seen';

function readSeenMap(userId?: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const activeId = userId || getCurrentUserId();
    const userKey = activeId ? `${SEEN_KEY}_${activeId}` : SEEN_KEY;
    const userVal = getLocalSetting(userKey);
    if (userVal) return JSON.parse(userVal);
    return JSON.parse(getLocalSetting(SEEN_KEY) || '{}');
  } catch { return {}; }
}

// هل الطلب يحمل تحديثاً لم يره المستخدم بعد؟
export function isRequestUnseen(requestId: number, updatedAt?: string | null, userId?: string): boolean {
  if (!updatedAt) return false;
  const map = readSeenMap(userId);
  const seen = map[String(requestId)];
  if (!seen) return true;                 // لم يُشاهد قط
  return new Date(updatedAt).getTime() > new Date(seen).getTime();
}

// تعليم طلب كمقروء (عند فتح رحلته أو الاطلاع عليه)
export function markRequestSeen(requestId: number, userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const activeId = userId || getCurrentUserId();
    const map = readSeenMap(activeId);
    const now = new Date().toISOString();
    map[String(requestId)] = now;
    if (activeId) {
      setLocalSetting(`${SEEN_KEY}_${activeId}`, JSON.stringify(map));
    }
    setLocalSetting(SEEN_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('twafok_requests_seen_update', { detail: { requestId, userId: activeId } }));
  } catch { /* تجاهل */ }
}

// تعليم كل طلبات العضو الحالي كمشاهدة (عند دخول صفحة الطلبات لتختفي الإشارة)
export function markAllRequestsSeen(userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const activeId = userId || getCurrentUserId();
    if (!activeId) return;
    const d = load();
    const map = readSeenMap(activeId);
    const now = new Date().toISOString();
    
    const userReqs = (d.requests || []).filter(
      (r) => r.sender_id === activeId || r.receiver_id === activeId
    );
    for (const req of userReqs) {
      map[String(req.id)] = now;
    }
    setLocalSetting(`${SEEN_KEY}_${activeId}`, JSON.stringify(map));
    setLocalSetting(SEEN_KEY, JSON.stringify(map));
    setLocalSetting(`requests_last_visited_${activeId}`, now);
    window.dispatchEvent(new CustomEvent('twafok_requests_seen_update', { detail: { userId: activeId, all: true } }));
  } catch { /* تجاهل */ }
}

// حساب عدد طلبات التوافق الجديدة أو التحديثات الجديدة للعضو المسجل
export function getUnseenRequestsCount(userId?: string): number {
  const activeId = userId || getCurrentUserId();
  if (!activeId) return 0;
  const d = load();
  const map = readSeenMap(activeId);
  
  const userReqs = (d.requests || []).filter(
    (r) => r.sender_id === activeId || r.receiver_id === activeId
  );

  let unseenCount = 0;
  let incomingActionableCount = 0;

  for (const r of userReqs) {
    const isReceiver = r.receiver_id === activeId;
    const isSender = r.sender_id === activeId;
    const updatedTime = r.updated_at || r.created_at;

    // الطلبات الواردة المعلّقة التي تنتظر إجراء العضو
    if (isReceiver && (r.journey_stage === 'sent' || r.journey_stage === 'accepted' || r.journey_stage === 'seriousness')) {
      incomingActionableCount++;
    }

    if (!updatedTime) continue;

    // مرسل الطلب في حالة sent غير المحدثة لا يُحسب لديه إشعار جديد
    if (isSender && r.journey_stage === 'sent' && (!r.updated_at || r.updated_at === r.created_at)) {
      continue;
    }

    const seenTime = map[String(r.id)];
    if (!seenTime) {
      unseenCount++;
    } else if (new Date(updatedTime).getTime() > new Date(seenTime).getTime()) {
      unseenCount++;
    }
  }

  // إذا وجد طلبات غير مقروءة نرجع عددها، وإن تم الاطلاع عليها مسبقاً نرجع عدد الطلبات الواردة النشطة لضمان تنبيه العضو بالعدد (1 أو 3)
  return unseenCount > 0 ? unseenCount : incomingActionableCount;
}

export function markRequestNotificationsRead(requestId: number, userId?: string) {
  const d = load();
  (d.notifications || []).forEach((n) => {
    if (n.request_id === requestId && (!userId || n.user_id === userId)) n.read = true;
  });
  save();
}

// ===== الأنواع =====
export interface LocalRequest {
  id: number;
  request_number?: number;          // الرقم التسلسلي المخصص للفئة (يبدأ من 1 للمسجلين ومن 1 للمستوردين تصاعدياً)
  source_type?: 'registered' | 'imported'; // نوع مصدر الطلب: أعضاء مسجلين أو وساطة مستوردين
  sender_id: string;
  receiver_id: string;
  journey_stage: string;
  message: string;
  sender_paid: boolean;
  receiver_paid: boolean;
  total_fee?: number;
  deposit_fee?: number;
  sender_paid_amount?: number;
  receiver_paid_amount?: number;
  sender_deposit_paid?: boolean;
  receiver_deposit_paid?: boolean;
  sender_deposit_status?: 'paid' | 'pending' | 'unpaid';
  receiver_deposit_status?: 'paid' | 'pending' | 'unpaid';
  sender_pledged_remaining?: boolean;
  receiver_pledged_remaining?: boolean;
  final_outcome?: 'success' | 'cancelled' | null;
  sender_paid_at?: string | null;
  receiver_paid_at?: string | null;
  sender_final_paid?: boolean;
  receiver_final_paid?: boolean;
  sender_final_paid_at?: string | null;
  receiver_final_paid_at?: string | null;
  sender_stage_confirmed?: boolean;
  receiver_stage_confirmed?: boolean;
  paid_at?: string | null;
  meeting_date?: string | null;
  meeting_notes?: string | null;
  decline_reason?: string | null;
  cancel_reason?: string | null;
  evaluation_result?: string | null;
  evaluation_note?: string | null;
  sender_viewing_result?: 'success' | 'failed' | null;
  receiver_viewing_result?: 'success' | 'failed' | null;
  sender_viewing_note?: string | null;
  receiver_viewing_note?: string | null;
  admin_notes?: string | null;
  // ===== معلومات التواصل (تُدخلها الأنثى، يراها الذكر بعد القَسَم) =====
  contact_info?: string | null;   // (قديم) — يُترك للتوافق الرجعي
  contact_by?: string | null;     // معرّف من أدخل معلومات التواصل
  guardian_phone?: string | null; // 📱 رقم ولي الأمر (أساسي للأنثى)
  guardian_name?: string | null;  // 👤 اسم ولي الأمر
  guardian_relation?: string | null; // صلة القرابة (الأب/الأخ/العم...)
  contact_time?: string | null;   // ⏰ الوقت المناسب للاتصال
  contact_note?: string | null;   // 📝 ملاحظة اختيارية
  male_pledged?: boolean;         // هل أقسم الذكر بعدم النشر قبل رؤية المعلومات
  // ===== معلومات تواصل الذكر وتعهّد الأنثى =====
  female_pledged?: boolean;       // هل أقسمت الأنثى قبل رؤية معلومات الذكر
  male_phone?: string | null;     // 📱 هاتف التواصل المباشر للذكر
  male_name?: string | null;      // 👤 اسم شخص التواصل للذكر
  male_relation?: string | null;  // صلة القرابة لشخص التواصل للذكر
  male_contact_time?: string | null; // ⏰ وقت الاتصال المناسب للذكر
  male_contact_note?: string | null; // 📝 ملاحظة من الطرف الذكر
  defer_date?: string | null;     // تاريخ تأجيل سداد رسوم الجدية
  defer_by?: string | null;       // من الذي طلب تأجيل السداد
  deadline_date?: string | null;  // مهلة سداد رسوم الجدية (١٥ يوم من القبول)
  frozen?: boolean;               // تجميد مؤقت من الإدارة — يظهر للعضو كـ"بانتظار تنسيق الإدارة"
  frozen_reason?: string | null;  // سبب التجميد
  frozen_at?: string | null;      // متى تم التجميد
  archived_by?: string[];         // معرّفات الأعضاء الذين قاموا بأرشفة الطلب
  hidden_by?: string[];           // معرّفات الأعضاء الذين قاموا بإخفاء السجل من الأرشيف
  created_at: string;
  updated_at: string;
}

export interface LocalEvent {
  id: number;
  request_id: number;
  actor_id: string;
  type: string;
  note: string;
  created_at: string;
}

export interface LocalInquiryMessage {
  id: number;
  request_id: number;
  sender_id: string;   // 'admin' = الوسيطة
  text: string;
  charged_to: string | null;
  created_at: string;
  approved?: boolean;          // افتراضي false — لا تظهر للطرف المستقبِل إلا بعد موافقة الإدارة
  rejected?: boolean;          // true = رُفضت وحُجبت
  moderated_by?: string | null; // اسم المشرف الذي راجعها
  moderated_at?: string | null; // وقت المراجعة
}

export interface LocalInquiryPackage {
  id: number;
  request_id: number;
  owner_id: string;
  credits_total: number;
  credits_used: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface LocalNotification {
  id: number;
  user_id: string;      // المستلم المعني بالإشعار
  request_id: number;   // الطلب المرتبط (للانتقال للرحلة)
  type: string;         // نوع الحدث
  text: string;
  title?: string;       // عنوان الإشعار الاختياري
  read: boolean;
  created_at: string;
}

interface DB {
  requests: LocalRequest[];
  events: LocalEvent[];
  inquiryMessages: LocalInquiryMessage[];
  inquiryPackages: LocalInquiryPackage[];
  notifications: LocalNotification[];
  seq: number;
}

const STORAGE_KEY = 'twafok_local_db_v5';

// ===== نظام سداد العربون لمرة واحدة على مستوى المنصة =====
// العربون (1,000 ر.ق) يُطلب مرة واحدة فقط لكل عضو طوال اشتراكه كجزء من أتعاب
// المنصة وجهد الإدارة في التنسيق والتوفيق. وفي أي رحلات أخرى يظهر له أنه مسدد مسبقاً.
export function isMemberDepositPaid(userId: string): boolean {
  if (!userId) return false;
  if (typeof window !== 'undefined') {
    return getLocalSetting(`twafok_deposit_paid_${userId}`) === 'true';
  }
  return false;
}

export function setMemberDepositPaid(userId: string, paid = true): void {
  if (!userId) return;
  if (typeof window !== 'undefined') {
    setLocalSetting(`twafok_deposit_paid_${userId}`, paid ? 'true' : 'false');
    try {
      window.dispatchEvent(new Event('twafok_deposit_change'));
    } catch {}
  }
}

// ===== بيانات البذرة (فارغة تماماً لبداية نظيفة خالية من التعارض) =====
function seedDB(): DB {
  return {
    requests: [],
    events: [],
    inquiryMessages: [],
    inquiryPackages: [],
    notifications: [],
    seq: 1,
  };
}

// ===== تحميل/حفظ =====
let db: DB | null = null;

function syncGlobalPayments(d: DB) {
  // لا نقوم بفرض السداد أو التنسيق تلقائياً على الطلبات
  // كل طلب يحتفظ بحالته الدقيقة كما تسجلها الإدارة أو الطرفان فعلياً
  if (!d || !d.requests) return;
}

function autoProcessDeadlines(d: DB): boolean {
  let changed = false;
  if (!d.requests) return false;
  
  const now = new Date();
  
  for (const r of d.requests) {
    if (r.journey_stage === 'accepted' || r.journey_stage === 'seriousness') {
      // إذا كان الطرفان قد سددا الرسوم مسبقاً، فلا ينطبق عليهم الإغلاق التلقائي لعدم السداد
      if (r.sender_paid && r.receiver_paid) {
        continue;
      }
      
      const targetDateStr = r.defer_date || r.deadline_date;
      if (!targetDateStr) continue;
      
      const targetDate = new Date(targetDateStr);
      const diffTime = targetDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (remainingDays <= 0) {
        // انتهت المهلة! نقوم بإغلاق الطلب وتغيير الحالة إلى 'cancelled' مع كتابة السبب 'انتهت المهلة ولم يتم السداد'
        r.journey_stage = 'cancelled';
        r.cancel_reason = 'انتهت المهلة ولم يتم السداد';
        r.updated_at = now.toISOString();
        changed = true;
        
        // إخطار الطرفين
        addNotification(d, r.sender_id, r.id, 'system', '⚠️ تم إغلاق الطلب تلقائياً لانتهاء مهلة سداد رسوم الجدية.');
        addNotification(d, r.receiver_id, r.id, 'system', '⚠️ تم إغلاق الطلب تلقائياً لانتهاء مهلة سداد رسوم الجدية.');
        
        // تسجيل حدث
        addEvent(d, r.id, 'system', 'deadline_expired', 'انتهت المهلة ولم يتم السداد وتأكيد الجدية');
      } else if (remainingDays <= 7) {
        // وقبل اغلاق الطلب ب ٧ ايام يعطيه كل يوم اشعار بالسداد قبل اغلاق الطلب
        const reminderText = `⏳ متبقي ${remainingDays} أيام على انتهاء مهلة سداد رسوم الجدية قبل إغلاق الطلب.`;
        
        // التحقق من وجود إشعار لنفس اليوم والطلب في صندوق الإشعارات لتجنب التكرار والسبام
        const senderAlreadyNotified = d.notifications?.some(
          n => n.request_id === r.id && n.user_id === r.sender_id && n.text.includes(`متبقي ${remainingDays} أيام`)
        );
        const receiverAlreadyNotified = d.notifications?.some(
          n => n.request_id === r.id && n.user_id === r.receiver_id && n.text.includes(`متبقي ${remainingDays} أيام`)
        );
        
        if (!r.sender_paid && !senderAlreadyNotified) {
          addNotification(d, r.sender_id, r.id, 'system', reminderText);
          changed = true;
        }
        if (!r.receiver_paid && !receiverAlreadyNotified) {
          addNotification(d, r.receiver_id, r.id, 'system', reminderText);
          changed = true;
        }
      }
    }
  }
  return changed;
}

export function isImportedRequestOrMember(senderId: string, receiverId: string, explicitSourceType?: string): boolean {
  if (explicitSourceType === 'imported') return true;
  if (explicitSourceType === 'registered') return false;
  const liveMembers = getLiveMembers(true);
  const sender = liveMembers.find((m) => m.id === senderId);
  const receiver = liveMembers.find((m) => m.id === receiverId);
  if (sender && (sender.sourceType === 'imported' || (sender as any).importBatchId || (sender as any).importOfficeName)) return true;
  if (receiver && (receiver.sourceType === 'imported' || (receiver as any).importBatchId || (receiver as any).importOfficeName)) return true;
  return false;
}

export function getNextRequestNumber(d: DB, sourceType: 'registered' | 'imported'): number {
  if (!d.requests || d.requests.length === 0) return 1;
  const categoryReqs = d.requests.filter((r) => (r.source_type || 'registered') === sourceType);
  if (categoryReqs.length === 0) return 1;
  const maxNum = categoryReqs.reduce((max, r) => Math.max(max, Number(r.request_number) || 0), 0);
  return maxNum + 1;
}

function normalizeRequestNumbers(d: DB): boolean {
  if (!d.requests || d.requests.length === 0) return false;
  let changed = false;
  const liveMembers = getLiveMembers(true);

  // تصنيف الطلبات بين مسجلين ومستوردين
  const registeredList: LocalRequest[] = [];
  const importedList: LocalRequest[] = [];

  // فرز الطلبات بحسب تاريخ الإنشاء تصاعدياً لتوزيع الأرقام من 1 فصاعداً
  const sorted = [...d.requests].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });

  sorted.forEach((r) => {
    const sender = liveMembers.find((m) => m.id === r.sender_id);
    const receiver = liveMembers.find((m) => m.id === r.receiver_id);
    const isImported = (r.source_type === 'imported') ||
      r.sender_id?.startsWith('imp_') || r.receiver_id?.startsWith('imp_') ||
      (sender && (sender.sourceType === 'imported' || (sender as any).importBatchId || (sender as any).importOfficeName || (sender as any).khataabaName)) ||
      (receiver && (receiver.sourceType === 'imported' || (receiver as any).importBatchId || (receiver as any).importOfficeName || (receiver as any).khataabaName));

    const targetSourceType: 'registered' | 'imported' = isImported ? 'imported' : 'registered';
    if (r.source_type !== targetSourceType) {
      r.source_type = targetSourceType;
      changed = true;
    }

    if (targetSourceType === 'imported') {
      importedList.push(r);
    } else {
      registeredList.push(r);
    }
  });

  registeredList.forEach((r, idx) => {
    const expectedNum = idx + 1;
    if (r.request_number !== expectedNum) {
      r.request_number = expectedNum;
      changed = true;
    }
  });

  importedList.forEach((r, idx) => {
    const expectedNum = idx + 1;
    if (r.request_number !== expectedNum) {
      r.request_number = expectedNum;
      changed = true;
    }
  });

  return changed;
}

function normalizeRequestIds(d: DB): boolean {
  if (!d.requests || d.requests.length === 0) return false;
  const hasHighIds = d.requests.some((r) => Number(r.id) >= 50 || isNaN(Number(r.id)));
  if (!hasHighIds) return false;

  const idMap = new Map<any, number>();
  d.requests.forEach((r, idx) => {
    const oldId = r.id;
    const newId = idx + 1;
    idMap.set(oldId, newId);
    idMap.set(String(oldId), newId);
    idMap.set(Number(oldId), newId);
    r.id = newId;
  });

  if (d.events) {
    d.events.forEach((e) => {
      if (idMap.has(e.request_id)) {
        e.request_id = idMap.get(e.request_id)!;
      }
    });
  }

  if (d.inquiryMessages) {
    d.inquiryMessages.forEach((m) => {
      if (idMap.has(m.request_id)) {
        m.request_id = idMap.get(m.request_id)!;
      }
    });
  }

  if (d.inquiryPackages) {
    d.inquiryPackages.forEach((p) => {
      if (idMap.has(p.request_id)) {
        p.request_id = idMap.get(p.request_id)!;
      }
    });
  }

  if (d.notifications) {
    d.notifications.forEach((n) => {
      if (n.request_id && idMap.has(n.request_id)) {
        const oldReqId = n.request_id;
        const newReqId = idMap.get(oldReqId)!;
        n.request_id = newReqId;
        n.text = n.text.replace(new RegExp(`#${oldReqId}\\b`, 'g'), `#${newReqId}`);
      }
    });
  }

  d.seq = d.requests.length;
  return true;
}

function load(): DB {
  if (db) return db;
  if (typeof window !== 'undefined') {
    try {
      // تنظيف الإصدارات القديمة لضمان بداية نظيفة لجميع الحسابات وحذف الرحلات السابقة المتعارضة
      removeLocalSetting('twafok_local_db_v4');
      removeLocalSetting('twafok_local_db_v3');
      removeLocalSetting('twafok_local_db_v2');
      removeLocalSetting('twafok_local_db');
      removeLocalSetting('twafok_requests');
      removeLocalSetting('saved_requests');

      const PURGE_PREVIOUS_KEY = 'twafok_purge_clean_requests_v6';
      if (getLocalSetting(PURGE_PREVIOUS_KEY) !== 'true') {
        setLocalSetting(PURGE_PREVIOUS_KEY, 'true');
        removeLocalSetting(STORAGE_KEY);
        // Clear any old false global deposit flags
        try {
          if (typeof localStorage !== 'undefined') {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && k.startsWith('twafok_deposit_paid_')) {
                localStorage.removeItem(k);
              }
            }
          }
        } catch {}
        db = seedDB();
        save();
        return db;
      }

      const raw = getLocalSetting(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          db = parsed;
          if (!db.requests) db.requests = [];
          if (!db.notifications) db.notifications = [];
          if (!db.inquiryMessages) db.inquiryMessages = [];
          if (!db.inquiryPackages) db.inquiryPackages = [];
          if (!db.events) db.events = [];
          
          syncGlobalPayments(db);
          const normalized = normalizeRequestIds(db);
          const numbersNormalized = normalizeRequestNumbers(db);
          const changed = autoProcessDeadlines(db);
          if (normalized || numbersNormalized || changed) {
            save();
          }
          return db;
        }
      }
    } catch { /* تجاهل */ }
  }
  if (!db) {
    db = seedDB();
    save();
  }
  return db;
}

function getNextRequestId(d: DB): number {
  if (!d.requests || d.requests.length === 0) return 1;
  const maxReqId = d.requests.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
  return maxReqId + 1;
}

function save() {
  if (db && typeof window !== 'undefined') {
    try {
      setLocalSetting(STORAGE_KEY, JSON.stringify(db));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('twafok_notification_update'));
    } catch { /* تجاهل */ }
  }
}

function nextId(): number {
  const d = load();
  d.seq = (d.seq || 100) + 1;
  return d.seq;
}

// إعادة ضبط قاعدة البيانات المحلية (للتجربة)
export function resetLocalDB() {
  db = seedDB();
  save();
}

// التحقق مما إذا كان المستخدم قد دفع رسوم الجدية في أي طلب سابق (لإثبات الجدية بشكل دائم)
export function hasUserPaidDepositAnywhere(userId: string): boolean {
  const d = load();
  return d.requests.some(
    (r) =>
      (r.sender_id === userId && r.sender_paid && r.sender_paid_at) ||
      (r.receiver_id === userId && r.receiver_paid && r.receiver_paid_at)
  );
}

// محاكاة تأخير شبكة بسيط (اختياري)
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// ===== الأعضاء =====
export async function getMembers() {
  await delay(60);
  // يقرأ من تعديلات الإدارة الحيّة كي تظهر للطرف الآخر فور حفظها
  // لكنه يستبعد المحظورين والمجمّدين والموقوفين والمحذوفين من العرض العام
  return getLiveMembers(false).map((m) => ({
    id: m.id, nickname: m.nickname, gender: m.gender, age: m.age,
    country: m.country, city: m.city, verified: m.verified, premium: m.premium,
    isProfileIncomplete: !!(m as any).isProfileIncomplete,
  }));
}

// ===== الطلبات =====
export async function getRequests(userId?: string): Promise<LocalRequest[]> {
  await delay();
  const d = load();
  const sorted = [...d.requests].sort((a, b) => b.created_at.localeCompare(a.created_at));
  
  const liveMembers = getLiveMembers(true);
  const adjusted = sorted.map((r) => {
    const sender = liveMembers.find((m) => m.id === r.sender_id);
    const receiver = liveMembers.find((m) => m.id === r.receiver_id);
    const updated = { ...r };
    if (sender && sender.sourceType === 'imported') {
      updated.sender_paid = true;
      updated.sender_paid_at = updated.sender_paid_at || updated.created_at;
    }
    if (receiver && receiver.sourceType === 'imported') {
      updated.receiver_paid = true;
      updated.receiver_paid_at = updated.receiver_paid_at || updated.created_at;
    }
    return updated;
  });

  if (!userId || !userId.trim()) return adjusted;
  const cleanUid = userId.trim();
  return adjusted.filter((r) => String(r.sender_id) === cleanUid || String(r.receiver_id) === cleanUid);
}

export async function getRequest(id: number): Promise<LocalRequest | null> {
  await delay(60);
  const d = load();
  const r = d.requests.find((r) => r.id === id || String(r.id) === String(id) || Number(r.id) === Number(id)) || null;
  if (!r) return null;

  const liveMembers = getLiveMembers(true);
  const sender = liveMembers.find((m) => m.id === r.sender_id);
  const receiver = liveMembers.find((m) => m.id === r.receiver_id);
  const updated = { ...r };
  if (sender && sender.sourceType === 'imported') {
    updated.sender_paid = true;
    updated.sender_paid_at = updated.sender_paid_at || updated.created_at;
  }
  if (receiver && receiver.sourceType === 'imported') {
    updated.receiver_paid = true;
    updated.receiver_paid_at = updated.receiver_paid_at || updated.created_at;
  }
  return updated;
}

export async function createRequest(senderId: string, receiverId: string, message: string, explicitSourceType?: 'registered' | 'imported') {
  await delay();
  if (senderId === receiverId) {
    return { ok: false, error: 'لا يمكنك إرسال طلب توافق لنفسك' };
  }
  const d = load();
  // منع التكرار والتحقق من وجود رحلة سابقة (الطلب الملغي لا يتجدد نهائياً)
  const existingReq = d.requests.find((r) =>
    (r.sender_id === senderId && r.receiver_id === receiverId) ||
    (r.sender_id === receiverId && r.receiver_id === senderId)
  );

  if (existingReq) {
    if (existingReq.journey_stage === 'cancelled' || (existingReq as any).status === 'cancelled') {
      return {
        ok: false,
        error: 'لديك رحلة سابقة ملغية مع هذا الطرف، والطلب ملغي ولا يتجدد مرة أخرى.',
        code: 'REQUEST_CANCELLED_CANNOT_RENEW',
        requestId: existingReq.id,
      };
    }
    if (existingReq.journey_stage === 'completed' || (existingReq as any).status === 'completed') {
      return {
        ok: false,
        error: 'لديك رحلة توافق سابقة ومكتملة مع هذا الطرف بالفعل.',
        code: 'REQUEST_ALREADY_COMPLETED',
        requestId: existingReq.id,
      };
    }
    if (existingReq.journey_stage === 'sent' || (existingReq as any).status === 'pending') {
      return {
        ok: false,
        error: 'يوجد طلب توافق قائم بينكما بالفعل. يمكنك متابعته من قائمة طلباتك.',
        code: 'REQUEST_PENDING',
        requestId: existingReq.id,
      };
    }
    if (existingReq.journey_stage !== 'declined') {
      return {
        ok: false,
        error: 'لديك رحلة توافق سابقة وقائمة مع هذا الطرف بالفعل.',
        code: 'REQUEST_ALREADY_EXISTS',
        requestId: existingReq.id,
      };
    }
  }

  const liveMembers = getLiveMembers(true);
  const sender = liveMembers.find((m) => m.id === senderId);
  const quotaDay = requestDay();
  const sentToday = d.requests.filter(r => r.sender_id === senderId && Date.parse(r.created_at) >= Date.parse(quotaDay.start) && Date.parse(r.created_at) < Date.parse(quotaDay.end)).length;
  const quotaLimit = dailyRequestLimit(sender);
  if (sentToday >= quotaLimit) return { ok: false, error: `وصلت إلى الحد اليومي (${quotaLimit} طلبات توافق). يتجدد عند منتصف الليل.`, code: 'DAILY_REQUEST_LIMIT', upgradeAvailable: quotaLimit === 5 };

  const receiver = liveMembers.find((m) => m.id === receiverId);
  const isImported = (explicitSourceType === 'imported') ||
    (sender && (sender.sourceType === 'imported' || (sender as any).importBatchId || (sender as any).importOfficeName)) ||
    (receiver && (receiver.sourceType === 'imported' || (receiver as any).importBatchId || (receiver as any).importOfficeName));

  const sourceType: 'registered' | 'imported' = isImported ? 'imported' : 'registered';
  const requestNumber = getNextRequestNumber(d, sourceType);
  const nextUniqueId = getNextRequestId(d);

  const now = new Date().toISOString();

  const req: LocalRequest = {
    id: nextUniqueId,
    request_number: requestNumber,
    source_type: sourceType,
    sender_id: senderId,
    receiver_id: receiverId,
    journey_stage: 'sent',
    message: message || 'طلب توافق جديد عبر المنصة',
    total_fee: 5000,
    deposit_fee: 1000,
    sender_paid: false,
    receiver_paid: false,
    sender_deposit_paid: false,
    receiver_deposit_paid: false,
    sender_deposit_status: 'unpaid',
    receiver_deposit_status: 'unpaid',
    sender_paid_amount: 0,
    receiver_paid_amount: 0,
    sender_paid_at: null,
    receiver_paid_at: null,
    created_at: now,
    updated_at: now,
  };
  d.requests.unshift(req);
  addEvent(d, req.id, senderId, 'sent', 'تم إرسال طلب الاهتمام');
  addNotification(d, receiverId, req.id, 'request', 'وصلك طلب توافق جديد بانتظار قرارك');
  save();
  markRequestSeen(req.id, senderId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('twafok_requests_seen_update', { detail: { requestId: req.id, userId: receiverId } }));
  }
  return { ok: true, data: req };
}

function addEvent(d: DB, requestId: number, actorId: string, type: string, note: string) {
  d.events.push({
    id: nextId(), request_id: requestId, actor_id: actorId || 'system',
    type, note, created_at: new Date().toISOString(),
  });
}

// #9 توليد إشعار حقيقي يقود مباشرة لصفحة الرحلة
function addNotification(d: DB, userId: string, requestId: number, type: string, text: string, title?: string) {
  if (!d.notifications) d.notifications = [];
  d.notifications.push({
    id: nextId(), user_id: userId, request_id: requestId, type, text,
    read: false, created_at: new Date().toISOString(),
    title,
  });
}

// إشعار الطرف الآخر بتغيّر المرحلة (المتلقّي = الطرف غير الفاعل)
function notifyOther(d: DB, req: LocalRequest, actorId: string, type: string, text: string) {
  const otherId = actorId === req.sender_id ? req.receiver_id : req.sender_id;
  addNotification(d, otherId, req.id, type, text);
}

// ===== تنفيذ إجراءات الرحلة =====
const STAGE_TITLES: Record<string, string> = {
  sent: 'طلب مُرسَل', accepted: 'تم القبول', seriousness: 'تأكيد الجدية',
  coordination: 'تبادل التواصل', sharia_viewing: 'النظرة الشرعية',
  engagement: 'الملكة', completed: 'مكتمل', declined: 'تم الاعتذار', cancelled: 'ملغى',
};
function stageTitle(s: string): string { return STAGE_TITLES[s] || s; }

export async function runRequestAction(
  requestId: number, action: string, actorId: string, payload: Record<string, any> = {},
): Promise<{ ok: boolean; data?: LocalRequest; error?: string }> {
  await delay();
  const d = load();
  const req = d.requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, error: 'الطلب غير موجود' };

  const now = new Date().toISOString();
  req.updated_at = now;
  let evType = action, evNote = '';

  switch (action) {
    case 'accept': {
      req.journey_stage = 'accepted';
      req.sender_paid = !!req.sender_paid;
      req.receiver_paid = !!req.receiver_paid;
      req.sender_paid_amount = req.sender_paid_amount || 0;
      req.receiver_paid_amount = req.receiver_paid_amount || 0;
      if (!req.sender_deposit_status) req.sender_deposit_status = req.sender_paid ? 'paid' : 'unpaid';
      if (!req.receiver_deposit_status) req.receiver_deposit_status = req.receiver_paid ? 'paid' : 'unpaid';
      
      if (req.sender_paid && req.receiver_paid) {
        req.journey_stage = 'coordination';
        req.paid_at = now;
        evNote = 'قبل الطلب — وبما أن الطرفين قد أكدا السداد، انتقلت الرحلة للتنسيق والتواصل مباشرة';
      } else {
        evNote = 'قبِل الطرف الآخر طلب التوافق وبانتظار سداد عربون الجدية';
      }
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 15);
      req.deadline_date = deadline.toISOString();
      break;
    }
    case 'decline':
      req.journey_stage = 'declined';
      req.decline_reason = payload.reason || 'عدم التوافق';
      evNote = 'تم الاعتذار عن الطلب: ' + (payload.reason || '');
      break;
    case 'cancel':
      req.journey_stage = 'cancelled';
      req.cancel_reason = payload.reason || 'تم الإلغاء';
      evNote = 'تم إلغاء الطلب: ' + (payload.reason || '');
      break;
    case 'skip_to_seriousness': {
      req.journey_stage = 'seriousness';
      evNote = 'تأكيد الرغبة والمضي لسداد رسوم الجدية';
      break;
    }
    case 'defer_payment': {
      const deferDate = payload.deferDate;
      if (!deferDate) return { ok: false, error: 'تاريخ التأجيل مطلوب' };
      req.defer_date = deferDate;
      req.defer_by = actorId;
      const actorName = getLiveMemberById(actorId)?.nickname || 'أحد الطرفين';
      evNote = `أجّل ${actorName} سداد رسوم الجدية إلى ${new Date(deferDate).toLocaleDateString('ar-SA')}`;
      evType = 'defer_payment';
      
      // إشعار للطرف الآخر
      notifyOther(d, req, actorId, 'system', `أجّل ${actorName} موعد سداد رسوم الجدية إلى ${new Date(deferDate).toLocaleDateString('ar-SA')}`);
      
      // إضافة تذكير قبل السداد بيوم
      const reminderDate = new Date(deferDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      addNotification(d, actorId, req.id, 'system', `تذكير: يتبقى يوم واحد على موعد سداد رسوم الجدية (${new Date(deferDate).toLocaleDateString('ar-SA')})`);
      break;
    }
    case 'pay_deposit': {
      const isSender = actorId === req.sender_id;
      if (isSender) {
        req.sender_paid = true;
        req.sender_deposit_paid = true;
        req.sender_paid_amount = req.sender_paid_amount || 1000;
        req.sender_paid_at = now;
        setMemberDepositPaid(req.sender_id, true);
      } else {
        req.receiver_paid = true;
        req.receiver_deposit_paid = true;
        req.receiver_paid_amount = req.receiver_paid_amount || 1000;
        req.receiver_paid_at = now;
        setMemberDepositPaid(req.receiver_id, true);
      }
      if (req.journey_stage === 'accepted') req.journey_stage = 'seriousness';
      if (req.sender_paid && req.receiver_paid) {
        req.journey_stage = 'coordination';
        req.paid_at = now;
      }
      evNote = 'تم سداد عربون الجدية (' + (isSender ? 'المرسِل' : 'المستقبِل') + ') لمرة واحدة في المنصة';
      break;
    }
    case 'pledge_remaining_fee': {
      const isSender = actorId === req.sender_id;
      if (isSender) req.sender_pledged_remaining = true;
      else req.receiver_pledged_remaining = true;
      evNote = 'إقرار وتعهد بسداد باقي أتعاب المنصة (4,000 ر.ق) عند تمام النصيب والزواج';
      evType = 'pledge';
      break;
    }
    case 'update_coordination':
      if (payload.meetingDate !== undefined) req.meeting_date = payload.meetingDate;
      if (payload.meetingNotes !== undefined) req.meeting_notes = payload.meetingNotes;
      if (payload.advance) req.journey_stage = 'sharia_viewing';
      evNote = 'تحديث تبادل التواصل وتنسيق الموعد';
      evType = 'coordination';
      break;
    case 'submit_contact': {
      const actor = getLiveMemberById(actorId);
      if (!actor) return { ok: false, error: 'تعذّر التحقق من الحساب' };
      
      if (actor.gender === 'female') {
        const phone = String(payload.guardianPhone || '').trim();
        if (!phone) {
          return { ok: false, error: 'رقم ولي الأمر مطلوب' };
        }
        req.guardian_phone = phone;
        req.guardian_name = String(payload.guardianName || '').trim() || null;
        req.guardian_relation = String(payload.guardianRelation || '').trim() || null;
        req.contact_time = String(payload.contactTime || '').trim() || null;
        req.contact_note = String(payload.contactNote || '').trim() || null;
        req.contact_by = actorId;
        
        // تجميع نصّي للتوافق الرجعي
        req.contact_info = [
          req.guardian_name ? `${req.guardian_name}${req.guardian_relation ? ' (' + req.guardian_relation + ')' : ''}` : null,
          `📱 ${phone}`,
          req.contact_time ? `⏰ ${req.contact_time}` : null,
          req.contact_note ? `📝 ${req.contact_note}` : null,
        ].filter(Boolean).join(' — ');
        evNote = 'شاركت الطرف الأنثى معلومات التواصل (رقم ولي الأمر) مباشرة';
        
        // إشعار للطرفين
        const notifText = '🌸 شاركت الطرف الأنثى بيانات تواصل ولي أمرها.';
        addNotification(d, req.sender_id, req.id, 'match', notifText);
        addNotification(d, req.receiver_id, req.id, 'match', notifText);
      } else {
        const phone = String(payload.malePhone || '').trim();
        if (!phone) {
          return { ok: false, error: 'رقم الهاتف مطلوب' };
        }
        req.male_phone = phone;
        req.male_name = String(payload.maleName || '').trim() || null;
        req.male_relation = String(payload.maleRelation || '').trim() || null;
        req.male_contact_time = String(payload.maleContactTime || '').trim() || null;
        req.male_contact_note = String(payload.maleContactNote || '').trim() || null;
        evNote = 'شارك الطرف الذكر معلومات التواصل الخاصة به مباشرة';
        
        // إشعار للطرفين
        const notifText = '👔 قام الطرف الذكر بمشاركة بيانات التواصل الخاصة به بنجاح للبدء بالتنسيق.';
        addNotification(d, req.sender_id, req.id, 'match', notifText);
        addNotification(d, req.receiver_id, req.id, 'match', notifText);
      }
      
      evType = 'coordination';
      break;
    }
    case 'male_pledge': {
      const actor = getLiveMemberById(actorId);
      if (!actor) return { ok: false, error: 'تعذّر التحقق من الحساب' };
      if (actor.gender === 'female') {
        return { ok: false, error: 'هذا التعهّد خاص بالطرف الآخر.' };
      }
      req.male_pledged = true;
      evNote = 'أقسم الطرف الذكر بعدم نشر المعلومات والتواصل بنية الزواج الجاد';
      evType = 'coordination';
      break;
    }
    case 'female_pledge': {
      const actor = getLiveMemberById(actorId);
      if (!actor) return { ok: false, error: 'تعذّر التحقق من الحساب' };
      if (actor.gender === 'male') {
        return { ok: false, error: 'هذا التعهّد خاص بالطرف الآخر.' };
      }
      req.female_pledged = true;
      evNote = 'أقسمت الطرف الأنثى بعدم نشر معلومات التواصل والتواصل بنية الزواج الجاد';
      evType = 'coordination';
      break;
    }
    case 'report_contact_issue': {
      const reason = payload.reason || 'الطرف الآخر لم يتجاوب';
      const actorName = getLiveMemberById(actorId)?.nickname || 'أحد الطرفين';
      evNote = `قوم ${actorName} بالإبلاغ عن مشكلة في التواصل: (${reason})`;
      evType = 'support_report';
      
      // إضافة إشعار للإدارة والطرف الآخر لتنبيههم
      addNotification(d, req.sender_id, req.id, 'admin', `تنبيه من الإدارة: قام ${actorName} برفع بلاغ عن وجود صعوبة في التواصل: ${reason}`);
      addNotification(d, req.receiver_id, req.id, 'admin', `تنبيه من الإدارة: قام ${actorName} برفع بلاغ عن وجود صعوبة في التواصل: ${reason}`);
      
      // حفظ البلاغ محلياً لتتمكن الإدارة من معالجته
      (req as any).contact_issue_reported = true;
      (req as any).contact_issue_reason = reason;
      (req as any).contact_issue_by = actorId;
      (req as any).contact_issue_at = now;
      break;
    }
    case 'advance_viewing':
    case 'confirm_advance': {
      const isSender = actorId === req.sender_id;
      if (req.journey_stage !== 'coordination') {
        return { ok: false, error: 'لا يمكن تأكيد الانتقال من هذه المرحلة' };
      }
      if (isSender) req.sender_stage_confirmed = true;
      else req.receiver_stage_confirmed = true;
      if (req.sender_stage_confirmed && req.receiver_stage_confirmed) {
        req.journey_stage = 'sharia_viewing';
        evNote = 'أكد الطرفان الانتقال إلى نتيجة النظرة الشرعية';
      } else {
        evNote = 'أكد أحد الطرفين استعداده للانتقال إلى نتيجة النظرة الشرعية';
      }
      evType = 'confirm_advance';
      break;
    }
    case 'record_result': {
      const isSender = actorId === req.sender_id;
      // نتيجة النظرة: توافق -> الملكة، اعتذار -> مرفوض مع السبب
      if (payload.result === 'failed') {
        req.journey_stage = 'declined';
        req.decline_reason = payload.note || payload.reason || 'تم الاعتذار بعد النظرة الشرعية';
        req.evaluation_result = 'failed';
        req.evaluation_note = payload.note || '';
        evNote = 'الاعتذار بعد النظرة الشرعية: ' + (payload.note || payload.reason || '');
        evType = 'decline';
      } else {
        if (isSender) {
          req.sender_viewing_result = 'success';
          req.sender_viewing_note = payload.note || '';
        } else {
          req.receiver_viewing_result = 'success';
          req.receiver_viewing_note = payload.note || '';
        }

        // إذا وافق الطرفان كلاهما على التوافق، ننتقل بالطلب رسمياً لمرحلة الملكة
        if (req.sender_viewing_result === 'success' && req.receiver_viewing_result === 'success') {
          req.journey_stage = 'engagement';
          req.evaluation_result = 'success';
          req.evaluation_note = payload.note || '';
          evNote = 'توافق ثنائي مبارك بعد النظرة الشرعية — الانتقال للملكة للطرفين 🎉';
        } else {
          evNote = 'تسجيل رغبة التوافق بعد النظرة الشرعية من قبل ' + (isSender ? 'المرسِل' : 'المستقبِل') + ' بانتظار الطرف الآخر';
        }
        evType = 'sharia_viewing';
      }
      break;
    }
    case 'pay_final_fee': {
      if (req.journey_stage !== 'engagement') {
        return { ok: false, error: 'سداد المتبقي غير متاح في هذه المرحلة' };
      }
      const isSender = actorId === req.sender_id;
      if ((isSender && req.sender_final_paid) || (!isSender && req.receiver_final_paid)) {
        return { ok: false, error: 'تم سداد المبلغ المتبقي لهذا الطلب مسبقاً' };
      }
      if (isSender) {
        req.sender_final_paid = true;
        req.sender_final_paid_at = now;
      } else {
        req.receiver_final_paid = true;
        req.receiver_final_paid_at = now;
      }
      if (req.sender_final_paid && req.receiver_final_paid) {
        req.journey_stage = 'completed';
        req.evaluation_result = 'success';
        req.evaluation_note = payload.note || 'اكتمل سداد الطرفين بعد تسليم المهر';
        evNote = 'اكتمل سداد الطرفين وتمت رحلة التوافق بفضل الله';
        evType = 'completed';
      } else {
        evNote = 'تم سداد المبلغ المتبقي بعد تسليم المهر';
        evType = 'pay_final_fee';
      }
      break;
    }
    case 'set_stage':
      if (['sent', 'accepted', 'seriousness', 'coordination', 'sharia_viewing', 'engagement', 'completed', 'declined', 'cancelled'].includes(payload.stage)) {
        req.journey_stage = payload.stage;
        if (payload.stage === 'cancelled') req.cancel_reason = payload.note || 'إلغاء إداري';
        if (payload.stage === 'declined') req.decline_reason = payload.note || 'رفض إداري';
      }
      evNote = payload.note || ('تعديل إداري للمرحلة إلى ' + payload.stage);
      break;
    case 'admin_record_payment':
    case 'admin_set_payments': {
      if (payload.total_fee !== undefined) req.total_fee = Number(payload.total_fee);
      if (payload.deposit_fee !== undefined) req.deposit_fee = Number(payload.deposit_fee);

      // المرسل
      if (payload.sender_status !== undefined) {
        req.sender_deposit_status = payload.sender_status;
        if (payload.sender_status === 'paid') {
          req.sender_paid = true;
          req.sender_deposit_paid = true;
          req.sender_paid_amount = payload.sender_paid_amount !== undefined ? Math.max(0, Number(payload.sender_paid_amount)) : (req.sender_paid_amount || 0);
          req.sender_paid_at = now;
        } else if (payload.sender_status === 'pending') {
          req.sender_paid = false;
          req.sender_deposit_paid = false;
          req.sender_paid_amount = Math.max(0, Number(payload.sender_paid_amount) || 0);
        } else {
          req.sender_paid = false;
          req.sender_deposit_paid = false;
          req.sender_paid_amount = 0;
          req.sender_paid_at = null;
        }
      } else if (payload.sender_paid_amount !== undefined) {
        req.sender_paid_amount = Math.max(0, Number(payload.sender_paid_amount) || 0);
        req.sender_paid = req.sender_paid_amount >= (req.deposit_fee || 1000);
        req.sender_deposit_status = req.sender_paid ? 'paid' : (req.sender_paid_amount > 0 ? 'pending' : 'unpaid');
        if (req.sender_paid) req.sender_paid_at = now;
      } else if (payload.sender_paid !== undefined) {
        req.sender_paid = !!payload.sender_paid;
        req.sender_deposit_status = req.sender_paid ? 'paid' : 'unpaid';
        if (req.sender_paid) {
          req.sender_paid_amount = req.sender_paid_amount !== undefined ? Number(req.sender_paid_amount) : 0;
          req.sender_paid_at = now;
        } else {
          req.sender_paid_amount = 0;
          req.sender_paid_at = null;
        }
      }

      // المستقبل
      if (payload.receiver_status !== undefined) {
        req.receiver_deposit_status = payload.receiver_status;
        if (payload.receiver_status === 'paid') {
          req.receiver_paid = true;
          req.receiver_deposit_paid = true;
          req.receiver_paid_amount = payload.receiver_paid_amount !== undefined ? Math.max(0, Number(payload.receiver_paid_amount)) : (req.receiver_paid_amount || 0);
          req.receiver_paid_at = now;
        } else if (payload.receiver_status === 'pending') {
          req.receiver_paid = false;
          req.receiver_deposit_paid = false;
          req.receiver_paid_amount = Math.max(0, Number(payload.receiver_paid_amount) || 0);
        } else {
          req.receiver_paid = false;
          req.receiver_deposit_paid = false;
          req.receiver_paid_amount = 0;
          req.receiver_paid_at = null;
        }
      } else if (payload.receiver_paid_amount !== undefined) {
        req.receiver_paid_amount = Math.max(0, Number(payload.receiver_paid_amount) || 0);
        req.receiver_paid = req.receiver_paid_amount >= (req.deposit_fee || 1000);
        req.receiver_deposit_status = req.receiver_paid ? 'paid' : (req.receiver_paid_amount > 0 ? 'pending' : 'unpaid');
        if (req.receiver_paid) req.receiver_paid_at = now;
      } else if (payload.receiver_paid !== undefined) {
        req.receiver_paid = !!payload.receiver_paid;
        req.receiver_deposit_status = req.receiver_paid ? 'paid' : 'unpaid';
        if (req.receiver_paid) {
          req.receiver_paid_amount = req.receiver_paid_amount !== undefined ? Number(req.receiver_paid_amount) : 0;
          req.receiver_paid_at = now;
        } else {
          req.receiver_paid_amount = 0;
          req.receiver_paid_at = null;
        }
      }

      if (payload.advance_to_coordination || payload.advance) {
        req.journey_stage = 'coordination';
        req.paid_at = now;
      }

      if (req.sender_paid || (req.sender_paid_amount || 0) >= 1000) {
        req.sender_deposit_paid = true;
        setMemberDepositPaid(req.sender_id, true);
      }
      if (req.receiver_paid || (req.receiver_paid_amount || 0) >= 1000) {
        req.receiver_deposit_paid = true;
        setMemberDepositPaid(req.receiver_id, true);
      }

      const sAmt = req.sender_paid_amount ?? (req.sender_paid ? 1000 : 0);
      const rAmt = req.receiver_paid_amount ?? (req.receiver_paid ? 1000 : 0);
      evNote = `تسجيل مدفوعات إدارياً: المرسِل (${sAmt} ر.ق) — المستقبِل (${rAmt} ر.ق)`;
      evType = 'payment';
      break;
    }
    case 'admin_confirm_match': {
      req.journey_stage = 'completed';
      req.final_outcome = 'success';
      req.evaluation_result = 'success';
      req.evaluation_note = payload.note || 'حدث نصيب وتم تسليم المهر وتوثيق الزواج بنجاح';
      evNote = 'حدث نصيب وتم تسليم المهر — توثيق اكتمال الرحلة مباركاً للطرفين 🎉';
      evType = 'completed';
      const msg = '🎉 مبارك! اعتمدت إدارة المنصة: حدث نصيب وتم تسليم المهر واكتملت رحلة التوافق بنجاح.';
      addNotification(d, req.sender_id, req.id, 'match', msg);
      addNotification(d, req.receiver_id, req.id, 'match', msg);
      break;
    }
    case 'admin_cancel_no_match': {
      req.journey_stage = 'cancelled';
      req.final_outcome = 'cancelled';
      req.cancel_reason = payload.reason || payload.note || 'لم يحدث نصيب بعد التنسيق';
      req.evaluation_result = 'failed';
      req.evaluation_note = req.cancel_reason;
      evNote = 'لم يحدث نصيب — تم إلغاء الطلب وأرشفته باحترام';
      evType = 'cancel';
      const msg = '🕊️ تنويه: تم إنهاء الطلب بقرار «لم يحدث نصيب»، والزواج قسمة ونصيب.';
      addNotification(d, req.sender_id, req.id, 'system', msg);
      addNotification(d, req.receiver_id, req.id, 'system', msg);
      break;
    }
    case 'admin_set_pledges': {
      if (payload.male_pledged !== undefined) req.male_pledged = !!payload.male_pledged;
      if (payload.female_pledged !== undefined) req.female_pledged = !!payload.female_pledged;
      evNote = `تحديث التعهدات إدارياً: الذكر (${req.male_pledged ? 'مكتمل ✓' : 'غير مكتمل'}) — الأنثى (${req.female_pledged ? 'مكتمل ✓' : 'غير مكتمل'})`;
      evType = 'system';
      break;
    }
    case 'admin_set_viewing_results': {
      if (payload.sender_viewing_result !== undefined) req.sender_viewing_result = payload.sender_viewing_result;
      if (payload.receiver_viewing_result !== undefined) req.receiver_viewing_result = payload.receiver_viewing_result;
      if (req.sender_viewing_result === 'success' && req.receiver_viewing_result === 'success' && req.journey_stage === 'sharia_viewing') {
        req.journey_stage = 'engagement';
      }
      evNote = `تحديث نتائج النظرة إدارياً: المرسِل (${req.sender_viewing_result === 'success' ? 'متوافق ✓' : req.sender_viewing_result === 'failed' ? 'معتذر' : 'قيد الانتظار'}) — المستقبِل (${req.receiver_viewing_result === 'success' ? 'متوافق ✓' : req.receiver_viewing_result === 'failed' ? 'معتذر' : 'قيد الانتظار'})`;
      evType = 'system';
      break;
    }
    case 'admin_set_contacts': {
      if (payload.guardian_phone !== undefined) req.guardian_phone = payload.guardian_phone;
      if (payload.guardian_name !== undefined) req.guardian_name = payload.guardian_name;
      if (payload.guardian_relation !== undefined) req.guardian_relation = payload.guardian_relation;
      if (payload.male_phone !== undefined) req.male_phone = payload.male_phone;
      if (payload.male_name !== undefined) req.male_name = payload.male_name;
      if (payload.contact_info !== undefined) req.contact_info = payload.contact_info;
      evNote = `تحديث بيانات التواصل إدارياً للطرفين`;
      evType = 'system';
      break;
    }
    case 'freeze_request':
      req.frozen = true;
      req.frozen_reason = payload.note || 'تجميد مؤقت من الإدارة';
      req.frozen_at = new Date().toISOString();
      evNote = `تجميد الطلب: ${req.frozen_reason}`;
      evType = 'system';
      break;
    case 'unfreeze_request':
      req.frozen = false;
      evNote = `إلغاء تجميد الطلب — عاد للمرحلة: ${stageTitle(req.journey_stage)}`;
      evType = 'system';
      break;
    case 'reactivate':
      // إعادة تفعيل طلب منتهٍ/ملغى لمرحلة سابقة
      if (['sent', 'accepted', 'seriousness', 'coordination', 'sharia_viewing', 'engagement'].includes(payload.stage)) {
        req.journey_stage = payload.stage;
        req.decline_reason = null;
        req.cancel_reason = null;
        req.frozen = false;
      }
      evNote = `إعادة تفعيل الطلب للمرحلة: ${stageTitle(payload.stage)} — ${payload.note || ''}`;
      evType = 'system';
      break;
    case 'swap_party':
      // تبديل المرسِل أو المستقبِل بعضو آخر
      if (payload.role === 'sender' && payload.newMemberId) {
        const oldName = getLiveMemberById(req.sender_id)?.nickname || req.sender_id;
        const newName = getLiveMemberById(payload.newMemberId)?.nickname || payload.newMemberId;
        req.sender_id = payload.newMemberId;
        evNote = `تبديل المرسِل من ${oldName} إلى ${newName} — ${payload.note || ''}`;
      } else if (payload.role === 'receiver' && payload.newMemberId) {
        const oldName = getLiveMemberById(req.receiver_id)?.nickname || req.receiver_id;
        const newName = getLiveMemberById(payload.newMemberId)?.nickname || payload.newMemberId;
        req.receiver_id = payload.newMemberId;
        evNote = `تبديل المستقبِل من ${oldName} إلى ${newName} — ${payload.note || ''}`;
      }
      evType = 'system';
      break;
    default:
      return { ok: false, error: 'إجراء غير معروف: ' + action };
  }

  addEvent(d, requestId, actorId, evType, evNote);

  // #9 توليد إشعارات حقيقية للطرف الآخر حسب الإجراء — تقود مباشرة للرحلة
  const actorName = getLiveMemberById(actorId)?.nickname || 'الطرف الآخر';
  switch (action) {
    case 'accept':
      notifyOther(d, req, actorId, 'request', `قبِل ${actorName} طلب توافقك — تابع رحلتك الآن`);
      break;
    case 'decline':
      notifyOther(d, req, actorId, 'system', `اعتذر ${actorName} عن إكمال الطلب`);
      break;
    case 'cancel':
      notifyOther(d, req, actorId, 'system', `تم إلغاء طلب التوافق من ${actorName}`);
      break;
    case 'pay_deposit':
      if (req.journey_stage === 'coordination') {
        addNotification(d, req.sender_id, req.id, 'match', 'اكتمل سداد العربون من الطرفين وبدأت مشاركة التواصل');
        addNotification(d, req.receiver_id, req.id, 'match', 'اكتمل سداد العربون من الطرفين وبدأت مشاركة التواصل');
      } else {
        notifyOther(d, req, actorId, 'request', `سدّد ${actorName} العربون — بانتظار سدادك لبدء التواصل`);
      }
      break;
    case 'submit_contact':
      notifyOther(d, req, actorId, 'match', 'تمت مشاركة معلومات التواصل — يمكنك المتابعة');
      break;
    case 'advance_viewing':
    case 'confirm_advance':
      if (req.journey_stage === 'sharia_viewing') {
        addNotification(d, req.sender_id, req.id, 'match', 'وافق الطرفان على الانتقال إلى نتيجة النظرة الشرعية');
        addNotification(d, req.receiver_id, req.id, 'match', 'وافق الطرفان على الانتقال إلى نتيجة النظرة الشرعية');
      } else {
        notifyOther(d, req, actorId, 'match', 'أكد الطرف الآخر استعداده للانتقال إلى نتيجة النظرة الشرعية');
      }
      break;
    case 'record_result':
      if (payload.result !== 'failed') {
        notifyOther(d, req, actorId, 'match', req.journey_stage === 'engagement'
          ? 'تم القبول من الطرفين بفضل الله'
          : 'سجّل الطرف الآخر نتيجة النظرة الشرعية');
      } else {
        notifyOther(d, req, actorId, 'system', 'تم الاعتذار بعد النظرة الشرعية');
      }
      break;
    case 'pay_final_fee':
      if (req.journey_stage === 'completed') {
        addNotification(d, req.sender_id, req.id, 'match', 'اكتمل سداد الطرفين وتمت رحلة التوافق بفضل الله');
        addNotification(d, req.receiver_id, req.id, 'match', 'اكتمل سداد الطرفين وتمت رحلة التوافق بفضل الله');
      } else {
        notifyOther(d, req, actorId, 'match', 'سدّد الطرف الآخر المبلغ المتبقي بعد تسليم المهر');
      }
      break;
    case 'set_stage':
      // إجراء إداري — أشعِر الطرفين بتحديث الإدارة لمرحلة الرحلة
      if (actorId === 'admin') {
        const adminText = payload.stage === 'cancelled'
          ? 'قامت إدارة المنصة بإلغاء طلب الاهتمام'
          : 'حدّثت إدارة المنصة مرحلة رحلتكما';
        addNotification(d, req.sender_id, req.id, 'admin', adminText);
        addNotification(d, req.receiver_id, req.id, 'admin', adminText);
      }
      break;
    case 'freeze_request':
      if (actorId === 'admin') {
        addNotification(d, req.sender_id, req.id, 'admin', '⏸️ طلبك قيد تنسيق الإدارة — سيتم تحديثه قريباً');
        addNotification(d, req.receiver_id, req.id, 'admin', '⏸️ طلبك قيد تنسيق الإدارة — سيتم تحديثه قريباً');
      }
      break;
    case 'unfreeze_request':
      if (actorId === 'admin') {
        addNotification(d, req.sender_id, req.id, 'admin', '✅ تم استئناف رحلتكما بعد تنسيق الإدارة');
        addNotification(d, req.receiver_id, req.id, 'admin', '✅ تم استئناف رحلتكما بعد تنسيق الإدارة');
      }
      break;
    case 'reactivate':
      if (actorId === 'admin') {
        addNotification(d, req.sender_id, req.id, 'admin', '🔄 تمت إعادة تفعيل طلبك من قبل الإدارة');
        addNotification(d, req.receiver_id, req.id, 'admin', '🔄 تمت إعادة تفعيل طلبك من قبل الإدارة');
      }
      break;
    case 'swap_party':
      if (actorId === 'admin') {
        addNotification(d, req.sender_id, req.id, 'admin', '🔄 تم تبديل طرف في الطلب من قبل الإدارة');
        addNotification(d, req.receiver_id, req.id, 'admin', '🔄 تم تبديل طرف في الطلب من قبل الإدارة');
      }
      break;
    case 'update_coordination':
      if (actorId === 'admin') {
        addNotification(d, req.sender_id, req.id, 'match', 'حدّثت الإدارة تفاصيل موعد التوافق — اطّلع عليها');
        addNotification(d, req.receiver_id, req.id, 'match', 'حدّثت الإدارة تفاصيل موعد التوافق — اطّلع عليها');
      }
      break;
  }

  save();
  if (actorId && actorId !== 'system' && actorId !== 'admin') {
    markRequestSeen(req.id, actorId);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('twafok_requests_seen_update', { detail: { requestId: req.id, action, actorId } }));
  }
  return { ok: true, data: { ...req } };
}

// ===== سجل الأحداث =====
export async function getEvents(requestId: number): Promise<LocalEvent[]> {
  await delay(60);
  const d = load();
  return d.events
    .filter((e) => e.request_id === requestId && e.type !== 'inquiry_buy')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// ===== توجيهات الإدارة فقط؛ مخطط الاستفسارات القديم محفوظ للتوافق والأرشفة =====
export interface InquiryStateLocal {
  package: LocalInquiryPackage | null;
  remaining: number;
  messages: LocalInquiryMessage[];
  inquiry_started_by?: string | null;
}
const MEMBER_MESSAGING_REMOVED = 'المراسلة بين الأعضاء غير متاحة. تواصل مع الإدارة للمساعدة.';

// قراءة الرصيد التاريخي لا تمنح حق شراء أو استهلاك جديد.
export function getUserInquiryBalance(userId: string): number {
  return load().inquiryPackages.filter(p => p.owner_id === userId && p.active)
    .reduce((sum, p) => sum + Math.max(0, p.credits_total - p.credits_used), 0);
}
export function consumeUserInquiryMessage(_userId: string): boolean { return false; }

function inquiryState(d: DB, requestId: number): InquiryStateLocal {
  const messages = d.inquiryMessages
    .filter(m => m.request_id === requestId && m.sender_id === 'admin')
    // لا نعيد نشر الترحيب الآلي القديم الذي يعلن الباقات الملغاة.
    .filter(m => !m.text.startsWith('مرحباً بكما في غرفة الاستفسار'))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { package: null, remaining: 0, messages, inquiry_started_by: null };
}
export async function getInquiry(requestId: number): Promise<InquiryStateLocal> {
  return inquiryState(load(), requestId);
}
export async function initializeInquiry(_requestId: number, _userId: string): Promise<{ ok: boolean; state?: InquiryStateLocal; error?: string }> {
  return { ok: false, error: MEMBER_MESSAGING_REMOVED };
}
export async function buyInquiry(_requestId: number, _ownerId: string): Promise<{ ok: boolean; state?: InquiryStateLocal; error?: string }> {
  return { ok: false, error: MEMBER_MESSAGING_REMOVED };
}
export async function buyMessagePackageCustom(_userId: string, _credits: number, _price: number): Promise<{ ok: boolean; balance?: number; error?: string }> {
  return { ok: false, error: MEMBER_MESSAGING_REMOVED };
}
export async function sendInquiry(requestId: number, senderId: string, text: string): Promise<{ ok: boolean; state?: InquiryStateLocal; error?: string }> {
  if (senderId !== 'admin') return { ok: false, error: MEMBER_MESSAGING_REMOVED };
  const d = load();
  if (!text?.trim()) return { ok: false, error: 'النص فارغ' };
  const req = d.requests.find(r => r.id === requestId);
  if (!req) return { ok: false, error: 'الطلب غير موجود' };
  if (senderId === 'admin') {
    const msgId = nextId();
    d.inquiryMessages.push({
      id: msgId,
      request_id: requestId,
      sender_id: 'admin',
      text: text.trim(),
      charged_to: null,
      created_at: new Date().toISOString(),
      approved: true,
    });

    // إرسال إشعار مباشر في حسابات الأطراف
    addNotification(d, req.sender_id, requestId, 'admin', `🛡️ توجيه من إدارة المنصة بخصوص الطلب #${requestId}: ${text.trim()}`, 'توجيه من إدارة المنصة');
    if (req.receiver_id !== req.sender_id) {
      addNotification(d, req.receiver_id, requestId, 'admin', `🛡️ توجيه من إدارة المنصة بخصوص الطلب #${requestId}: ${text.trim()}`, 'توجيه من إدارة المنصة');
    }
    addEvent(d, requestId, 'admin', 'admin_guidance', `توجيه من الإدارة: ${text.trim()}`);
    save();
    return { ok: true, state: inquiryState(d, requestId) };
  }

  return { ok: false, error: MEMBER_MESSAGING_REMOVED };
}
export async function simulateReply(_requestId: number, _replierId: string, _text: string): Promise<{ ok: boolean; state?: InquiryStateLocal; error?: string }> {
  return { ok: false, error: MEMBER_MESSAGING_REMOVED };
}
// نقاط التوافق القديمة غير تشغيلية؛ لا تعدل أو تحذف الأرشيف عند استدعائها.
export function getAllInquiryMessages(): (LocalInquiryMessage & { request_id: number })[] { return []; }
export function moderateInquiryMessage(_messageId: number, _action: 'approve' | 'reject', _moderatorName: string): boolean { return false; }
export function updateInquiryMessage(messageId: number, newText: string): boolean {
  const msg = load().inquiryMessages.find(m => m.id === messageId && m.sender_id === 'admin');
  if (!msg || !newText.trim()) return false;
  msg.text = newText.trim();
  save();
  return true;
}
export function deleteInquiryMessage(messageId: number): boolean {
  const d = load();
  const index = d.inquiryMessages.findIndex(m => m.id === messageId && m.sender_id === 'admin');
  if (index < 0) return false;
  d.inquiryMessages.splice(index, 1);
  save();
  return true;
}

// ===== #9 إشعارات الرحلة =====
export async function getJourneyNotifications(userId: string): Promise<LocalNotification[]> {
  await delay(100);
  const d = load();
  if (!d.notifications) return [];
  return d.notifications
    .filter((n) => n.type !== 'inquiry' && (n.user_id === userId || n.user_id === 'all'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function markNotificationRead(id: number) {
  const d = load();
  const n = d.notifications?.find((x) => x.id === id);
  if (n) { n.read = true; save(); }
}

export function markAllNotificationsRead(userId: string) {
  const d = load();
  (d.notifications || []).forEach((n) => { if (n.user_id === userId || n.user_id === 'all') n.read = true; });
  save();
}

export function getUnreadNotificationsCount(userId: string): number {
  const d = load();
  return (d.notifications || []).filter((n) => n.type !== 'inquiry' && (n.user_id === userId || n.user_id === 'all') && !n.read).length;
}

export async function getActionableRequestsCount(userId: string): Promise<number> {
  await delay(40);
  const d = load();
  return d.requests.filter((r) => {
    if (r.sender_id !== userId && r.receiver_id !== userId) return false;
    if (r.journey_stage === 'declined' || r.journey_stage === 'cancelled' || r.journey_stage === 'completed') return false;
    const isSender = r.sender_id === userId;
    const selfPaid = isSender ? r.sender_paid : r.receiver_paid;
    if (r.journey_stage === 'sent') return !isSender;
    if (r.journey_stage === 'accepted') return true;
    if (r.journey_stage === 'seriousness') return !selfPaid;
    if (r.journey_stage === 'sharia_viewing' || r.journey_stage === 'engagement') return true;
    return false;
  }).length;
}

export function deleteNotification(id: number) {
  const d = load();
  if (d.notifications) { d.notifications = d.notifications.filter((n) => n.id !== id); save(); }
}

// ============================================================
//  ===== لوحة الإدارة (محلية بالكامل) =====
//  تقرأ نفس قاعدة بيانات الطلبات المحلية، فيرتبط ما يفعله
//  الأعضاء (قبول/رفض/دفع) مباشرةً بما تراه الإدارة، والعكس.
// ============================================================

// حالات الحساب: نشط / قيد المراجعة / موقوف / محظور نهائياً / محذوف
export type MemberStatus = 'active' | 'pending' | 'suspended' | 'banned' | 'deleted';

interface AdminMemberMeta {
  status: MemberStatus;
  plan: 'free' | 'featured' | 'featured_1m' | 'featured_6m' | 'featured_1y' | string;
  planDurationDays?: number;
  planExpiresAt?: string | null;
  realName: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;             // كلمة سر الحساب (لعرضها للإدارة)
  joinedAt: string;
  verifiedOverride?: boolean;   // تجاوز إداري لحالة التوثيق
  premiumOverride?: boolean;    // تجاوز إداري للاشتراك المميّز
  adminNote?: string;           // ملاحظة إدارية خاصة
  flagged?: boolean;            // معلّم للمتابعة
  deleted?: boolean;            // محذوف نهائياً (إداري)
  statusReason?: string;        // سبب الحظر/التجميد/الإيقاف
  statusChangedAt?: string;     // وقت آخر تغيير للحالة
  statusChangedBy?: string;     // المشرف الذي غيّر الحالة
  isProfileIncomplete?: boolean; // هل الملف الشخصي غير مكتمل؟
  pinned?: boolean;             // هل العضو مثبت من الإدارة؟
}

const ADMIN_META_KEY = 'twafok_admin_meta_v1';

function readAdminMeta(): Record<string, AdminMemberMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = getLocalSetting(ADMIN_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* تجاهل */ }
  return {};
}

function writeAdminMeta(meta: Record<string, AdminMemberMeta>) {
  if (typeof window === 'undefined') return;
  try { setLocalSetting(ADMIN_META_KEY, JSON.stringify(meta)); } catch { /* تجاهل */ }
}

function defaultMeta(m: Member): AdminMemberMeta {
  const plan: AdminMemberMeta['plan'] = memberPlan(m);
  const actualEmail = (m as any).email || (m as any).member_code || '';
  const actualPhone = (m as any).whatsapp || (m as any).phone || '';
  const actualPass = (m as any).password || (m as any).password_hash || (m as any).pass || '123456';
  const actualRealName = (m as any).realName || (m as any).real_name || (m as any).fullName || (m as any).full_name || m.nickname;
  
  return {
    status: (m as any).status || 'active',
    plan,
    realName: actualRealName,
    email: actualEmail,
    phone: actualPhone,
    nationalId: (m as any).nationalId || '',
    password: actualPass,
    joinedAt: (m as any).joinedAt || (m as any).created_at || (m as any).createdAt || new Date().toLocaleDateString('ar-SA'),
  };
}

function getMeta(m: Member): AdminMemberMeta {
  const all = readAdminMeta();
  if (!all[m.id]) {
    let foundAdmin: any = null;
    if (typeof window !== 'undefined') {
      try {
        const savedAdminRaw = getLocalSetting('saved_admin_members_list');
        if (savedAdminRaw) {
          const parsed = JSON.parse(savedAdminRaw);
          if (Array.isArray(parsed)) {
            foundAdmin = parsed.find((am: any) => am.id === m.id);
          }
        }
      } catch {}
    }

    if (foundAdmin) {
      all[m.id] = {
        status: foundAdmin.status || (m as any).status || 'active',
        plan: foundAdmin.plan || (m as any).plan || 'free',
        realName: foundAdmin.realName || (m as any).realName || (m as any).fullName || (m as any).full_name || m.nickname,
        email: foundAdmin.email || (m as any).email || '',
        phone: foundAdmin.phone || (m as any).phone || (m as any).whatsapp || '',
        nationalId: foundAdmin.nationalId || (m as any).nationalId || '',
        password: foundAdmin.password || (m as any).password || (m as any).password_hash || (m as any).pass || '123456',
        joinedAt: foundAdmin.joinedAt || (m as any).joinedAt || new Date().toLocaleDateString('ar-SA'),
      };
    } else {
      all[m.id] = defaultMeta(m);
    }
    writeAdminMeta(all);
  }
  return all[m.id];
}

export interface AdminMemberRowLocal {
  id: string;
  nickname: string;
  username?: string;
  gender: 'male' | 'female';
  age: number;
  country: string;
  city: string;
  verified: boolean;
  premium: boolean;
  realName: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;
  status: MemberStatus;
  plan: 'free' | 'featured' | 'featured_1m' | 'featured_6m' | 'featured_1y' | string;
  planDurationDays?: number;
  planExpiresAt?: string | null;
  pinned?: boolean;
  joinedAt: string;
  requestsCount: number;
  district: string;
  education: string;
  workType: string;
  adminNote: string;
  flagged: boolean;
  statusReason: string;
  statusChangedAt: string;
  statusChangedBy: string;
  // ===== حقول الاستيراد =====
  sourceType?: 'registered' | 'imported';
  importBatchId?: string;
  importOfficeName?: string;
  importDate?: string;
  importNotes?: string;
  isProfileIncomplete?: boolean;
  maritalStatus?: string;
  birthDate?: string;
  skinColor?: string;
  height?: number;
  weight?: number;
  bio?: string;
  nationality?: string;
  sect?: string;
  tribe?: string;
  childrenCount?: string;
  ethnicity?: string;
  health?: string;
  smoking?: string;
  housing?: string;
  jobTitle?: string;
  pCountry?: string;
  pCity?: string;
  pNationality?: string;
  pSect?: string;
  pAgeMin?: number;
  pAgeMax?: number;
  pMaritalStatus?: string;
  pAcceptChildren?: string;
  pSkinColor?: string;
  pEducation?: string;
  pWorkType?: string;
  pHousing?: string;
  pNotes?: string;
}

export async function adminGetMembers(): Promise<AdminMemberRowLocal[]> {
  await delay(80);
  const d = load();
  return getLiveMembers(true).map((m) => {
    const meta = getMeta(m);
    const requestsCount = d.requests.filter(
      (r) => r.sender_id === m.id || r.receiver_id === m.id,
    ).length;
    const verified = meta.verifiedOverride !== undefined ? meta.verifiedOverride : m.verified;
    const premium = meta.premiumOverride !== undefined ? meta.premiumOverride : m.premium;
    const pinned = meta.pinned !== undefined ? meta.pinned : !!m.pinned;
    const actualPass = meta.password || (m as any).password || (m as any).password_hash || (m as any).pass || '123456';
    const actualEmail = meta.email || (m as any).email || (m as any).member_code || '';
    const actualPhone = meta.phone || (m as any).whatsapp || (m as any).phone || '';
    const actualRealName = meta.realName || (m as any).realName || (m as any).real_name || (m as any).full_name || m.nickname;
    return {
      id: m.id, nickname: m.nickname, username: m.username, gender: m.gender, age: m.age,
      country: m.country, city: m.city, verified, premium,
      realName: actualRealName, email: actualEmail, phone: actualPhone,
      nationalId: meta.nationalId, password: actualPass,
      status: meta.status, plan: meta.plan, pinned,
      joinedAt: meta.joinedAt, requestsCount,
      district: m.district, education: m.education, workType: m.workType,
      adminNote: meta.adminNote || '', flagged: !!meta.flagged,
      statusReason: meta.statusReason || '',
      statusChangedAt: meta.statusChangedAt || '',
      statusChangedBy: meta.statusChangedBy || '',
      // حقول الاستيراد
      sourceType: (m as any).sourceType || 'registered',
      importBatchId: (m as any).importBatchId || undefined,
      importOfficeName: (m as any).importOfficeName || undefined,
      importDate: (m as any).importDate || undefined,
      importNotes: (m as any).importNotes || undefined,
      isProfileIncomplete: !!(m as any).isProfileIncomplete,
      // حقول البيانات والصفات الشخصية الإضافية
      maritalStatus: m.maritalStatus,
      marriageType: (m as any).marriageType || (m as any).marriage_type || 'announced',
      marriageTypeLabel: (m as any).marriageTypeLabel || (
        ((m as any).marriageType || (m as any).marriage_type) === 'misyar' ? 'مسيار' :
        ((m as any).marriageType || (m as any).marriage_type) === 'both' ? 'معلن أو مسيار' : 'معلن'
      ),
      birthDate: (m as any).birthDate,
      skinColor: (m as any).skinColor,
      height: m.height,
      weight: (m as any).weight,
      bio: m.bio,
      nationality: m.nationality,
      sect: (m as any).sect,
      tribe: (m as any).tribe || m.tribe || '',
      childrenCount: (m as any).childrenCount,
      ethnicity: m.ethnicity,
      health: (m as any).health,
      smoking: (m as any).smoking,
      housing: (m as any).housing,
      jobTitle: (m as any).jobTitle,
      pCountry: (m as any).pCountry,
      pCity: (m as any).pCity,
      pNationality: (m as any).pNationality,
      pSect: (m as any).pSect,
      pAgeMin: (m as any).pAgeMin,
      pAgeMax: (m as any).pAgeMax,
      pMaritalStatus: (m as any).pMaritalStatus,
      pAcceptChildren: (m as any).pAcceptChildren,
      pSkinColor: (m as any).pSkinColor,
      pEducation: (m as any).pEducation,
      pWorkType: (m as any).pWorkType,
      pHousing: (m as any).pHousing,
      pNotes: (m as any).pNotes || m.aboutPartner,
    };
  }).filter((row) => {
    const all = readAdminMeta();
    return !all[row.id]?.deleted;
  });
}

export async function adminUpdateMember(
  id: string,
  fields: any,
): Promise<boolean> {
  await delay(60);
  const all = readAdminMeta();
  const m = getLiveMemberById(id);
  if (!m) return false;
  if (!all[id]) all[id] = defaultMeta(m);
  if (fields.status) {
    all[id].status = fields.status as MemberStatus;
    all[id].statusChangedAt = new Date().toISOString();
    all[id].statusChangedBy = fields.statusChangedBy || 'الإدارة';
    // مسح السبب عند العودة لحالة نشط
    all[id].statusReason = fields.status === 'active' ? '' : (fields.statusReason ?? all[id].statusReason ?? '');
  }
  if (fields.statusReason !== undefined && !fields.status) all[id].statusReason = fields.statusReason;
  if (fields.plan) all[id].plan = fields.plan as AdminMemberMeta['plan'];
  if (fields.pinned !== undefined) all[id].pinned = fields.pinned;
  if (fields.verified !== undefined) all[id].verifiedOverride = fields.verified;
  if (fields.premium !== undefined) all[id].premiumOverride = fields.premium;
  if (fields.adminNote !== undefined) all[id].adminNote = fields.adminNote;
  if (fields.flagged !== undefined) all[id].flagged = fields.flagged;
  writeAdminMeta(all);

  // تحديث كائن العضو الفعلي في saved_members_list و saved_admin_members_list في localStorage
  if (typeof window !== 'undefined') {
    try {
      // 1. تحديث saved_members_list
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      const idx = list.findIndex(item => item.id === id);

      // حساب العمر من تاريخ الميلاد إن وُجد
      let calculatedAge = fields.age;
      if (fields.birthDate || fields.birth_date) {
        const bd = fields.birthDate || fields.birth_date;
        const parts = typeof bd === 'string' ? bd.split('-') : [];
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          const birth = new Date(bd);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
          if (age > 0) calculatedAge = age;
        }
      }

      const mergedPayload: any = {
        ...fields,
        ...(calculatedAge ? { age: calculatedAge } : {}),
      };

      if (fields.verified !== undefined) mergedPayload.verified = fields.verified;
      if (fields.premium !== undefined) mergedPayload.premium = fields.premium;
      if (fields.status) mergedPayload.status = fields.status;
      if (fields.plan !== undefined) {
        mergedPayload.plan = fields.plan;
        mergedPayload.premium = fields.plan === 'featured';
      }
      if (fields.pinned !== undefined) {
        mergedPayload.pinned = fields.pinned;
      }

      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...mergedPayload,
          details: {
            ...(list[idx].details || {}),
            ...(fields.details || {}),
            ...mergedPayload,
          },
        };
      } else {
        list.push({
          id,
          ...mergedPayload,
        } as any);
      }
      setLocalSetting('saved_members_list', JSON.stringify(list));

      // 2. تحديث saved_admin_members_list أيضاً لضمان تطابق كامل
      try {
        const savedAdmin = getLocalSetting('saved_admin_members_list');
        if (savedAdmin) {
          const adminList = JSON.parse(savedAdmin);
          if (Array.isArray(adminList)) {
            const aIdx = adminList.findIndex((item: any) => item.id === id);
            if (aIdx !== -1) {
              adminList[aIdx] = {
                ...adminList[aIdx],
                ...mergedPayload,
                details: { ...(adminList[aIdx].details || {}), ...mergedPayload },
              };
              setLocalSetting('saved_admin_members_list', JSON.stringify(adminList));
            }
          }
        }
      } catch {}

      // 3. تحديث twafok_members في المستودع العام
      try {
        const rawRepo = getLocalSetting('twafok_members');
        if (rawRepo) {
          const repoList = JSON.parse(rawRepo);
          if (Array.isArray(repoList)) {
            const rIdx = repoList.findIndex((item: any) => item.id === id);
            if (rIdx !== -1) {
              repoList[rIdx] = { ...repoList[rIdx], ...mergedPayload };
              setLocalSetting('twafok_members', JSON.stringify(repoList));
            }
          }
        }
      } catch {}

      // 4. إذا كان العضو المعدّل هو نفس المستخدم المسجل حالياً، نحدث auth_user و user_profile_data
      const currentUserId = getCurrentUserId();
      if (currentUserId === id) {
        const rawUser = getLocalSetting('auth_user');
        if (rawUser) {
          try {
            const userObj = JSON.parse(rawUser);
            if (userObj && (userObj.memberId === id || userObj.id === id)) {
              userObj.name = fields.nickname || fields.realName || userObj.name;
              userObj.profile = {
                ...(userObj.profile || {}),
                ...mergedPayload,
              };
              setLocalSetting('auth_user', JSON.stringify(userObj));
            }
          } catch {}
        }
        const rawProfileData = getLocalSetting('user_profile_data');
        if (rawProfileData) {
          try {
            const pd = JSON.parse(rawProfileData);
            setLocalSetting('user_profile_data', JSON.stringify({ ...pd, ...mergedPayload }));
          } catch {}
        }
      }

      // 5. إطلاق حدث محلي لتحديث الواجهات التفاعلية فوراً
      window.dispatchEvent(new CustomEvent('twafok_member_updated', { detail: { id, fields: mergedPayload } }));
      window.dispatchEvent(new CustomEvent('twafok_members_changed'));
    } catch { /* تجاهل */ }
  }

  return true;
}

export async function adminBulkDeleteMembers(ids: string[]): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  ids.forEach((id) => {
    if (!all[id]) {
      const m = getLiveMemberById(id);
      if (m) all[id] = defaultMeta(m);
    }
    if (all[id]) {
      all[id].deleted = true;
      all[id].status = 'deleted';
    }
  });
  writeAdminMeta(all);

  // حذفهم أيضاً من قائمة الأعضاء المحفوظة لئلا يتم استيرادهم مجدداً
  if (typeof window !== 'undefined') {
    try {
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter((member: any) => !ids.includes(member.id));
          setLocalSetting('saved_members_list', JSON.stringify(remaining));
          if (remaining.length === 0) {
            setLocalSetting('members_purged', 'true');
          }
        }
      } else {
        setLocalSetting('members_purged', 'true');
      }
      const savedAdmin = getLocalSetting('saved_admin_members_list');
      if (savedAdmin) {
        const parsedAdmin = JSON.parse(savedAdmin);
        if (Array.isArray(parsedAdmin)) {
          const remainingAdmin = parsedAdmin.filter((member: any) => !ids.includes(member.id));
          setLocalSetting('saved_admin_members_list', JSON.stringify(remainingAdmin));
          if (remainingAdmin.length === 0) {
            setLocalSetting('members_purged', 'true');
          }
        }
      }

      // تنظيف الطلبات والرحلات المحفوظة إذا لم يتبقَ أي أعضاء نشطين
      const activeMembers = getLiveMembers(false);
      if (activeMembers.length === 0) {
        setLocalSetting('members_purged', 'true');
        const rawStorage = getLocalSetting(STORAGE_KEY);
        if (rawStorage) {
          try {
            const parsedStorage = JSON.parse(rawStorage);
            if (parsedStorage && Array.isArray(parsedStorage.requests)) {
              parsedStorage.requests = [];
              setLocalSetting(STORAGE_KEY, JSON.stringify(parsedStorage));
            }
          } catch {}
        }
      }
    } catch { /* تجاهل */ }
  }

  return true;
}

export async function adminBulkUpdateStatus(
  ids: string[],
  status: MemberStatus,
  reason?: string,
  by?: string,
): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  ids.forEach((id) => {
    if (!all[id]) {
      const m = getLiveMemberById(id);
      if (m) all[id] = defaultMeta(m);
    }
    if (all[id]) {
      all[id].status = status;
      all[id].statusChangedAt = new Date().toISOString();
      all[id].statusChangedBy = by || 'الإدارة (إجراء جماعي)';
      all[id].statusReason = reason || '';
    }
  });
  writeAdminMeta(all);
  return true;
}

export async function adminBulkSetVerified(ids: string[], value: boolean): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  ids.forEach((id) => {
    if (!all[id]) {
      const m = getLiveMemberById(id);
      if (m) all[id] = defaultMeta(m);
    }
    if (all[id]) all[id].verifiedOverride = value;
  });
  writeAdminMeta(all);
  return true;
}

export async function adminBulkSetPinned(ids: string[], value: boolean): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  ids.forEach((id) => {
    if (!all[id]) {
      const m = getLiveMemberById(id);
      if (m) all[id] = defaultMeta(m);
    }
    if (all[id]) all[id].pinned = value;
  });
  writeAdminMeta(all);

  if (typeof window !== 'undefined') {
    try {
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      let changed = false;
      ids.forEach((id) => {
        const idx = list.findIndex(item => item.id === id);
        if (idx !== -1) {
          list[idx].pinned = value;
          changed = true;
        }
      });
      if (changed) {
        setLocalSetting('saved_members_list', JSON.stringify(list));
      }
    } catch { /* تجاهل */ }
  }
  return true;
}

export async function adminBulkSetPlan(ids: string[], plan: string): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  const isPrem = plan !== 'free';
  const durationDays = plan === 'featured_1y' ? 365 : plan === 'featured_6m' ? 180 : 30;
  const planExpiresAt = isPrem ? new Date(Date.now() + durationDays * 86400000).toISOString() : null;

  ids.forEach((id) => {
    if (!all[id]) {
      const m = getLiveMemberById(id);
      if (m) all[id] = defaultMeta(m);
    }
    if (all[id]) {
      all[id].plan = plan;
      all[id].premiumOverride = isPrem;
      all[id].planDurationDays = isPrem ? durationDays : 0;
      all[id].planExpiresAt = planExpiresAt;
    }
  });
  writeAdminMeta(all);

  if (typeof window !== 'undefined') {
    try {
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      let changed = false;
      ids.forEach((id) => {
        const idx = list.findIndex(item => item.id === id);
        if (idx !== -1) {
          list[idx].plan = plan;
          list[idx].premium = plan !== 'free';
          changed = true;
        }
      });
      if (changed) {
        setLocalSetting('saved_members_list', JSON.stringify(list));
      }
    } catch { /* تجاهل */ }
  }
  return true;
}

export async function adminBulkSetSeriousnessBadge(ids: string[], value: boolean): Promise<boolean> {
  await delay(80);
  if (typeof window !== 'undefined') {
    try {
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      let changed = false;
      ids.forEach((id) => {
        const idx = list.findIndex(item => item.id === id);
        if (idx !== -1) {
          list[idx].hasSeriousnessBadge = value;
          changed = true;
        }
      });
      if (changed) {
        setLocalSetting('saved_members_list', JSON.stringify(list));
      }
    } catch { /* تجاهل */ }
  }
  return true;
}

export async function adminDeleteMember(id: string): Promise<boolean> {
  await delay(60);
  const all = readAdminMeta();
  if (!all[id]) {
    const m = getLiveMemberById(id);
    if (m) all[id] = defaultMeta(m);
  }
  if (all[id]) {
    all[id].deleted = true;
    all[id].status = 'deleted';
    writeAdminMeta(all);

    // الحذف من saved_members_list و saved_admin_members_list
    if (typeof window !== 'undefined') {
      try {
        const saved = getLocalSetting('saved_members_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const remaining = parsed.filter((member: any) => member.id !== id);
            setLocalSetting('saved_members_list', JSON.stringify(remaining));
            if (remaining.length === 0) setLocalSetting('members_purged', 'true');
          }
        }
        const savedAdmin = getLocalSetting('saved_admin_members_list');
        if (savedAdmin) {
          const parsedAdmin = JSON.parse(savedAdmin);
          if (Array.isArray(parsedAdmin)) {
            const remainingAdmin = parsedAdmin.filter((member: any) => member.id !== id);
            setLocalSetting('saved_admin_members_list', JSON.stringify(remainingAdmin));
            if (remainingAdmin.length === 0) setLocalSetting('members_purged', 'true');
          }
        }

        const activeMembers = getLiveMembers(false);
        if (activeMembers.length === 0) {
          setLocalSetting('members_purged', 'true');
          const rawStorage = getLocalSetting(STORAGE_KEY);
          if (rawStorage) {
            try {
              const parsedStorage = JSON.parse(rawStorage);
              if (parsedStorage && Array.isArray(parsedStorage.requests)) {
                parsedStorage.requests = [];
                setLocalSetting(STORAGE_KEY, JSON.stringify(parsedStorage));
              }
            } catch {}
          }
        }
      } catch { /* تجاهل */ }
    }

    return true;
  }
  return false;
}

export async function adminHardDeleteMember(id: string): Promise<boolean> {
  await delay(80);
  const all = readAdminMeta();
  if (all[id]) {
    delete all[id];
    writeAdminMeta(all);
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLocalSetting('saved_members_list', JSON.stringify(parsed.filter((member: any) => member.id !== id)));
        }
      }
      const savedAdmin = getLocalSetting('saved_admin_members_list');
      if (savedAdmin) {
        const parsedAdmin = JSON.parse(savedAdmin);
        if (Array.isArray(parsedAdmin)) {
          setLocalSetting('saved_admin_members_list', JSON.stringify(parsedAdmin.filter((member: any) => member.id !== id)));
        }
      }

      // Cleanup notifications
      const rawDb = getLocalSetting('twafok_local_db_v4');
      if (rawDb) {
        const db = JSON.parse(rawDb);
        if (db) {
          if (Array.isArray(db.requests)) {
            db.requests = db.requests.filter((r: any) => r.sender_id !== id && r.receiver_id !== id);
          }
          if (Array.isArray(db.notifications)) {
            db.notifications = db.notifications.filter((n: any) => n.user_id !== id);
          }
          setLocalSetting('twafok_local_db_v4', JSON.stringify(db));
        }
      }

      // Cleanup interest requests
      const savedRequests = getLocalSetting('twafok_requests');
      if (savedRequests) {
        const parsedRequests = JSON.parse(savedRequests);
        if (Array.isArray(parsedRequests)) {
          setLocalSetting('twafok_requests', JSON.stringify(parsedRequests.filter((r: any) => r.senderId !== id && r.receiverId !== id)));
        }
      }
    } catch (err) {
      console.error('Error in hard delete cleanup:', err);
    }
  }
  return true;
}

export async function adminResetPassword(id: string): Promise<string> {
  await delay(60);
  const all = readAdminMeta();
  const m = getLiveMemberById(id);
  if (!m) return '';
  if (!all[id]) all[id] = defaultMeta(m);
  const newPw = 'Twafok@' + Math.floor(100000 + Math.random() * 900000);
  all[id].password = newPw;
  writeAdminMeta(all);
  return newPw;
}

export async function adminToggleVerified(id: string, value: boolean): Promise<boolean> {
  return adminUpdateMember(id, { verified: value });
}

export async function adminSetPremium(id: string, value: boolean): Promise<boolean> {
  return adminUpdateMember(id, { premium: value, plan: value ? 'featured' : 'free' });
}

export async function adminSetNote(id: string, note: string): Promise<boolean> {
  return adminUpdateMember(id, { adminNote: note });
}

export async function adminToggleFlag(id: string, value: boolean): Promise<boolean> {
  return adminUpdateMember(id, { flagged: value });
}

export async function adminSendNotification(id: string, text: string, title?: string): Promise<boolean> {
  await delay(40);
  const d = load();
  addNotification(d, id, 0, 'admin', text, title);
  save();
  return true;
}

export async function adminSendBulkNotifications(userIds: string[], text: string, title?: string): Promise<boolean> {
  await delay(40);
  const d = load();
  if (!d.notifications) d.notifications = [];
  const uniqueIds = Array.from(new Set(userIds));
  const now = new Date().toISOString();
  for (const uid of uniqueIds) {
    d.notifications.push({
      id: nextId(),
      user_id: uid,
      request_id: 0,
      type: 'admin',
      text,
      title: title || 'إشعار إداري',
      read: false,
      created_at: now,
    });
  }
  save();
  return true;
}

export async function adminDeleteRequest(requestId: number): Promise<boolean> {
  await delay(80);
  const d = load();
  const initialCount = d.requests.length;
  d.requests = d.requests.filter((r) => r.id !== requestId);
  d.events = d.events.filter((e) => e.request_id !== requestId);
  d.inquiryMessages = d.inquiryMessages.filter((m) => m.request_id !== requestId);
  d.inquiryPackages = d.inquiryPackages.filter((p) => p.request_id !== requestId);
  save();
  return d.requests.length < initialCount;
}

export async function archiveRequest(requestId: number, userId: string): Promise<boolean> {
  await delay(60);
  const d = load();
  const req = d.requests.find((r) => r.id === requestId);
  if (!req) return false;
  req.archived_by = req.archived_by || [];
  if (!req.archived_by.includes(userId)) {
    req.archived_by.push(userId);
  }
  save();
  return true;
}

export async function unarchiveRequest(requestId: number, userId: string): Promise<boolean> {
  await delay(60);
  const d = load();
  const req = d.requests.find((r) => r.id === requestId);
  if (!req) return false;
  if (req.archived_by) {
    req.archived_by = req.archived_by.filter((uid: string) => uid !== userId);
  }
  save();
  return true;
}

export async function hideRequestFromUser(requestId: number, userId: string): Promise<boolean> {
  await delay(60);
  const d = load();
  const req = d.requests.find((r) => r.id === requestId);
  if (!req) return false;
  req.hidden_by = req.hidden_by || [];
  if (!req.hidden_by.includes(userId)) {
    req.hidden_by.push(userId);
  }
  save();
  return true;
}

// منح وسام الجدية يدوياً من لوحة التحكم
export async function adminGrantSeriousnessBadge(id: string): Promise<boolean> {
  await delay(40);
  if (typeof window !== 'undefined') {
    try {
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      const idx = list.findIndex(item => item.id === id);
      if (idx !== -1) {
        list[idx].hasSeriousnessBadge = true;
        setLocalSetting('saved_members_list', JSON.stringify(list));
        return true;
      }
    } catch { /* تجاهل */ }
  }
  return false;
}

// سحب وسام الجدية يدوياً من لوحة التحكم
export async function adminRevokeSeriousnessBadge(id: string): Promise<boolean> {
  await delay(40);
  if (typeof window !== 'undefined') {
    try {
      let list: Member[] = [];
      const saved = getLocalSetting('saved_members_list');
      if (saved) {
        list = JSON.parse(saved);
      }
      if (list.length === 0) {
        list = [...MEMBERS];
      }
      const idx = list.findIndex(item => item.id === id);
      if (idx !== -1) {
        list[idx].hasSeriousnessBadge = false;
        setLocalSetting('saved_members_list', JSON.stringify(list));
        return true;
      }
    } catch { /* تجاهل */ }
  }
  return false;
}

export async function adminGetRequests(): Promise<any[]> {
  await delay(80);
  const d = load();
  return [...d.requests].map((r) => {
    const s = getLiveMemberById(r.sender_id);
    const rcv = getLiveMemberById(r.receiver_id);
    return {
      ...r,
      sender_nickname: s?.nickname || r.sender_id,
      sender_gender: s?.gender || 'male',
      receiver_nickname: rcv?.nickname || r.receiver_id,
      receiver_gender: rcv?.gender || 'female',
    };
  });
}

export async function adminGetStats(): Promise<any> {
  await delay(80);
  const d = load();
  const members = await adminGetMembers();
  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const suspendedCount = members.filter((m) => m.status === 'suspended').length;
  const bannedCount = members.filter((m) => m.status === 'banned').length;

  const totalReq = d.requests.length;
  const completedCount = d.requests.filter((r) => r.journey_stage === 'completed').length;
  const declinedCount = d.requests.filter((r) => r.journey_stage === 'declined').length;
  const cancelledCount = d.requests.filter((r) => r.journey_stage === 'cancelled').length;

  const seriousCount = d.requests.filter(
    (r) => r.journey_stage === 'seriousness' || r.journey_stage === 'coordination' || r.journey_stage === 'sharia_viewing' || r.journey_stage === 'engagement',
  ).length;

  const maleCount = members.filter((m) => m.gender === 'male').length;
  const femaleCount = members.filter((m) => m.gender === 'female').length;

  const verifiedCount = members.filter((m) => m.verified).length;
  const premiumCount = members.filter((m) => m.premium).length;

  const pendingRequestsCount = d.requests.filter((r) => r.journey_stage === 'sent').length;
  const activeJourneysCount = d.requests.filter(
    (r) => !['sent', 'completed', 'declined', 'cancelled'].includes(r.journey_stage)
  ).length;

  let depositsPaid = 0;
  d.requests.forEach((r) => {
    if (r.sender_paid) depositsPaid++;
    if (r.receiver_paid) depositsPaid++;
  });
  const revenue = depositsPaid * 500;

  const transactions = getTransactions() || [];
  const txRevenue = transactions
    .filter((tx: any) => tx.status === 'completed' || tx.status === 'success')
    .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);

  const totalTransactions = transactions.length + depositsPaid;
  const totalRevenue = revenue + txRevenue;

  const liveMembers = getLiveMembers(true);
  const seriousnessBadgesCount = liveMembers.filter((m) => m.hasSeriousnessBadge).length;

  const stageBreakdown: Record<string, number> = {};
  const stages = ['sent', 'accepted', 'seriousness', 'coordination', 'sharia_viewing', 'engagement', 'completed', 'declined', 'cancelled'];
  stages.forEach((st) => {
    stageBreakdown[st] = d.requests.filter((r) => r.journey_stage === st).length;
  });

  const recentEvents = (d.events || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    totalMembers: members.length,
    activeMembers: activeCount,
    pendingMembers: pendingCount,
    suspendedMembers: suspendedCount,
    bannedMembers: bannedCount,
    totalRequests: totalReq,
    completedRequests: completedCount,
    declinedRequests: declinedCount,
    cancelledRequests: cancelledCount,
    seriousRequests: seriousCount,
    maleCount,
    femaleCount,
    males: maleCount,
    females: femaleCount,

    pendingRequests: pendingRequestsCount,
    activeJourneys: activeJourneysCount,
    completed: completedCount,
    verified: verifiedCount,
    premium: premiumCount,
    revenue: revenue,
    depositsPaid: depositsPaid,
    seriousnessBadges: seriousnessBadgesCount,
    totalTransactions: totalTransactions,
    totalRevenue: totalRevenue,
    stageBreakdown,
    recentEvents,
  };
}

export async function adminGetRequestPayments(requestId: number): Promise<any[]> {
  await delay(40);
  const d = load();
  const req = d.requests.find((r) => r.id === requestId);
  if (!req) return [];
  const list = [];
  if (req.sender_paid && req.sender_paid_at) {
    list.push({
      id: `pay-${requestId}-sender`,
      request_id: requestId,
      userId: req.sender_id,
      userNickname: getLiveMemberById(req.sender_id)?.nickname || req.sender_id,
      amount: 500,
      status: 'success',
      paid_at: req.sender_paid_at,
    });
  }
  if (req.receiver_paid && req.receiver_paid_at) {
    list.push({
      id: `pay-${requestId}-receiver`,
      request_id: requestId,
      userId: req.receiver_id,
      userNickname: getLiveMemberById(req.receiver_id)?.nickname || req.receiver_id,
      amount: 500,
      status: 'success',
      paid_at: req.receiver_paid_at,
    });
  }
  return list;
}

// ===== الكوبونات والمعاملات المالية =====
const COUPONS_KEY = 'twafok_coupons_v1';
const TRANSACTIONS_KEY = 'twafok_transactions_v1';

const SEED_COUPONS = [
  { code: 'JAD20', discount: 20, active: true, description: 'خصم ٢٠٪ بمناسبة تدشين المنصة' },
  { code: 'TAWAFOK50', discount: 50, active: true, description: 'خصم ٥٠٪ للأعضاء المميزين' },
];

export function getCoupons(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = getLocalSetting(COUPONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* تجاهل */ }
  // حفظ البذرة
  try { setLocalSetting(COUPONS_KEY, JSON.stringify(SEED_COUPONS)); } catch {}
  return SEED_COUPONS;
}

export function saveCoupon(coupon: any) {
  const coupons = getCoupons();
  const idx = coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
  if (idx !== -1) {
    coupons[idx] = { ...coupons[idx], ...coupon };
  } else {
    coupons.push(coupon);
  }
  try { setLocalSetting(COUPONS_KEY, JSON.stringify(coupons)); } catch { /* تجاهل */ }
}

export function deleteCoupon(code: string) {
  const coupons = getCoupons().filter((c) => c.code.toUpperCase() !== code.toUpperCase());
  try { setLocalSetting(COUPONS_KEY, JSON.stringify(coupons)); } catch { /* تجاهل */ }
}

export function toggleCouponActive(code: string) {
  const coupons = getCoupons();
  const idx = coupons.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
  if (idx !== -1) {
    coupons[idx].active = !coupons[idx].active;
    try { setLocalSetting(COUPONS_KEY, JSON.stringify(coupons)); } catch { /* تجاهل */ }
  }
}

export function getTransactions(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = getLocalSetting(TRANSACTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* تجاهل */ }
  return [];
}

export function recordTransaction(tx: any) {
  if (tx.type === 'inquiry') return false; // خدمة ملغاة؛ لا معاملات جديدة لها
  const transactions = getTransactions();
  transactions.unshift({
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
    ...tx,
  });
  try { setLocalSetting(TRANSACTIONS_KEY, JSON.stringify(transactions)); } catch { /* تجاهل */ }
}

export function updateTransactionStatus(id: string, status: string): boolean {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === id || t.id?.toString() === id?.toString());
  if (idx !== -1) {
    if (transactions[idx].type === 'inquiry' && status === 'completed') return false;
    transactions[idx].status = status;
    try { setLocalSetting(TRANSACTIONS_KEY, JSON.stringify(transactions)); } catch { /* تجاهل */ }
    return true;
  }
  return false;
}

export function validateCoupon(code: string, amount?: number): any {
  const norm = (code || '').trim().toUpperCase();
  const coupon = getCoupons().find((c) => c.code.toUpperCase() === norm && c.active);
  if (!coupon) return { valid: false, error: 'الكوبون غير صحيح أو منتهي الصلاحية' };

  let discount = coupon.discount;
  if (amount !== undefined && coupon.type === 'percent') {
    discount = Math.round((amount * coupon.discount) / 100);
  }

  return { valid: true, discount, coupon };
}

export function useCoupon(code: string): boolean {
  const validation = validateCoupon(code);
  return validation.valid;
}

export async function adminApplyExemption(memberId: string, type: 'deposit' | 'badge', value: number | boolean, memberName?: string): Promise<boolean> {
  await delay(50);
  const d = load();
  let exemptionApplied = false;

  if (type === 'deposit') {
    d.requests.forEach((r) => {
      if (r.sender_id === memberId) {
        r.sender_paid = !!value;
        if (value) r.sender_paid_at = r.sender_paid_at || new Date().toISOString();
        exemptionApplied = true;
      }
      if (r.receiver_id === memberId) {
        r.receiver_paid = !!value;
        if (value) r.receiver_paid_at = r.receiver_paid_at || new Date().toISOString();
        exemptionApplied = true;
      }
      if (r.sender_paid && r.receiver_paid && r.journey_stage === 'seriousness') {
        r.journey_stage = 'coordination';
        r.paid_at = r.paid_at || new Date().toISOString();
      }
    });
  } else if (type === 'badge') {
    return adminUpdateMember(memberId, { verified: !!value });
  }

  if (exemptionApplied) {
    save();
  }
  return exemptionApplied;
}

export interface AdminStatsLocal {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  bannedMembers: number;
  totalRequests: number;
  completedRequests: number;
  declinedRequests: number;
  cancelledRequests: number;
  seriousRequests: number;
  maleCount: number;
  femaleCount: number;
  males: number;
  females: number;

  pendingRequests: number;
  activeJourneys: number;
  completed: number;
  verified: number;
  premium: number;
  revenue: number;
  depositsPaid: number;
  seriousnessBadges: number;
  totalTransactions: number;
  totalRevenue: number;
  stageBreakdown: Record<string, number>;
  recentEvents: any[];
}

export interface RequestPaymentsSummary {
  requestId: number;
  sender_paid: boolean;
  receiver_paid: boolean;
  sender_paid_at?: string;
  receiver_paid_at?: string;
}

export interface LocalCoupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  usageLimit: number;
  expiryDate: string;
  active: boolean;
  usedCount?: number;
  usageCount?: number;
  createdAt?: string;
  createdBy?: string;
}

export interface LocalTransaction {
  id: string;
  memberId: string;
  memberName?: string;
  amount: number;
  type: 'subscription' | 'inquiry' | 'deposit' | 'exemption';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  description?: string;
  method?: string;
  date?: string;
  couponCode?: string;
}

// ===== التقرير المالي والإحصائي للرقابة على رسوم المنصة والباقات =====
export async function getAdminFinancialReport() {
  await delay(50);
  const d = load();
  const members = getLiveMembers(true);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const deposits: any[] = [];
  const remaining: any[] = [];
  const exemptions: any[] = [];
  const packageSubscriptions: any[] = [];

  let totalDepositsAmount = 0;
  let totalRemainingAmount = 0;
  let totalExemptionsCount = 0;
  let totalPackagesAmount = 0;

  // 1. معالجة مدفوعات وتعهدات الطلبات
  d.requests.forEach((req) => {
    const totalFee = req.total_fee || 5000;
    const depositFee = req.deposit_fee || 1000;
    const sender = memberMap.get(req.sender_id);
    const receiver = memberMap.get(req.receiver_id);

    const isSenderImported = sender ? (sender.sourceType === 'imported' || !!(sender as any).importBatchId || !!(sender as any).importOfficeName) : false;
    const isReceiverImported = receiver ? (receiver.sourceType === 'imported' || !!(receiver as any).importBatchId || !!(receiver as any).importOfficeName) : false;

    // الطرف الأول (المرسل)
    const senderPaidAmount = req.sender_paid_amount !== undefined && req.sender_paid_amount !== null
      ? Number(req.sender_paid_amount)
      : (req.sender_paid ? depositFee : 0);
    const isSenderExempt = isSenderImported || (req.sender_paid && senderPaidAmount === 0);

    if (isSenderExempt) {
      totalExemptionsCount++;
      exemptions.push({
        id: `ex-send-${req.id}`,
        requestId: req.id,
        memberId: req.sender_id,
        memberName: sender?.nickname || 'المرسل',
        realName: sender?.realName || '',
        username: sender?.username || sender?.email || '',
        reason: isSenderImported ? 'عضو مستورد (معفي تلقائياً)' : 'إعفاء إداري مخصص',
        date: req.created_at,
        totalFee,
        remainingAmount: Math.max(0, totalFee - senderPaidAmount),
      });
    } else if (req.sender_paid || senderPaidAmount > 0) {
      totalDepositsAmount += senderPaidAmount;
      deposits.push({
        id: `dep-send-${req.id}`,
        requestId: req.id,
        memberId: req.sender_id,
        memberName: sender?.nickname || 'المرسل',
        realName: sender?.realName || '',
        username: sender?.username || sender?.email || '',
        amount: senderPaidAmount,
        date: req.sender_paid_at || req.created_at,
        status: 'مكتمل',
      });
    }

    const senderRem = Math.max(0, totalFee - senderPaidAmount);
    if (senderRem > 0) {
      totalRemainingAmount += senderRem;
      remaining.push({
        id: `rem-send-${req.id}`,
        requestId: req.id,
        memberId: req.sender_id,
        memberName: sender?.nickname || 'المرسل',
        realName: sender?.realName || '',
        username: sender?.username || sender?.email || '',
        dueAmount: senderRem,
        journeyStage: req.journey_stage,
        pledged: !!req.sender_pledged_remaining,
        date: req.created_at,
      });
    }

    // الطرف الثاني (المستقبل)
    const receiverPaidAmount = req.receiver_paid_amount !== undefined && req.receiver_paid_amount !== null
      ? Number(req.receiver_paid_amount)
      : (req.receiver_paid ? depositFee : 0);
    const isReceiverExempt = isReceiverImported || (req.receiver_paid && receiverPaidAmount === 0);

    if (isReceiverExempt) {
      totalExemptionsCount++;
      exemptions.push({
        id: `ex-recv-${req.id}`,
        requestId: req.id,
        memberId: req.receiver_id,
        memberName: receiver?.nickname || 'المستقبل',
        realName: receiver?.realName || '',
        username: receiver?.username || receiver?.email || '',
        reason: isReceiverImported ? 'عضو مستورد (معفي تلقائياً)' : 'إعفاء إداري مخصص',
        date: req.created_at,
        totalFee,
        remainingAmount: Math.max(0, totalFee - receiverPaidAmount),
      });
    } else if (req.receiver_paid || receiverPaidAmount > 0) {
      totalDepositsAmount += receiverPaidAmount;
      deposits.push({
        id: `dep-recv-${req.id}`,
        requestId: req.id,
        memberId: req.receiver_id,
        memberName: receiver?.nickname || 'المستقبل',
        realName: receiver?.realName || '',
        username: receiver?.username || receiver?.email || '',
        amount: receiverPaidAmount,
        date: req.receiver_paid_at || req.created_at,
        status: 'مكتمل',
      });
    }

    const receiverRem = Math.max(0, totalFee - receiverPaidAmount);
    if (receiverRem > 0) {
      totalRemainingAmount += receiverRem;
      remaining.push({
        id: `rem-recv-${req.id}`,
        requestId: req.id,
        memberId: req.receiver_id,
        memberName: receiver?.nickname || 'المستقبل',
        realName: receiver?.realName || '',
        username: receiver?.username || receiver?.email || '',
        dueAmount: receiverRem,
        journeyStage: req.journey_stage,
        pledged: !!req.receiver_pledged_remaining,
        date: req.created_at,
      });
    }
  });

  // 2. معالجة مشتريات الباقات
  const transactions = getTransactions() || [];
  transactions.forEach((tx: any) => {
    if (tx.type === 'subscription' || tx.type === 'package' || tx.plan) {
      const m = memberMap.get(tx.memberId || tx.userId);
      const amt = Number(tx.amount) || 0;
      totalPackagesAmount += amt;
      packageSubscriptions.push({
        id: tx.id,
        memberId: tx.memberId || tx.userId || '0',
        memberName: m?.nickname || tx.memberName || 'عضو',
        realName: m?.realName || '',
        packageName: tx.description || tx.packageName || 'باقة متميزة',
        amount: amt,
        status: tx.status || 'completed',
        date: tx.createdAt || tx.date || new Date().toISOString(),
      });
    }
  });

  // إضافة الأعضاء أصحاب الباقات التمييزية إذا لم توجد معاملات
  members.forEach((m) => {
    if (m.plan === 'featured' || m.premium) {
      const exists = packageSubscriptions.some((p) => p.memberId === m.id);
      if (!exists) {
        totalPackagesAmount += 350;
        packageSubscriptions.push({
          id: `pkg-${m.id}`,
          memberId: m.id,
          memberName: m.nickname,
          realName: m.realName || '',
          packageName: 'ترقية باقة مميزة',
          amount: 350,
          status: 'completed',
          date: m.createdAt || new Date().toISOString(),
        });
      }
    }
  });

  return {
    summary: {
      totalDepositsAmount,
      totalRemainingAmount,
      totalExemptionsCount,
      totalPackagesAmount,
      grandTotalCollected: totalDepositsAmount + totalPackagesAmount,
    },
    deposits,
    remaining,
    exemptions,
    packageSubscriptions,
  };
}

// ===== تحديث حالة السداد والإعفاء الجماعي للأعضاء =====
export async function adminBulkUpdateMemberPayments(
  memberIds: string[],
  options: {
    status: 'paid' | 'unpaid' | 'pending';
    paidAmount?: number;
    customTotalFee?: number;
    customDepositFee?: number;
  }
): Promise<boolean> {
  await delay(80);
  const d = load();
  const idSet = new Set(memberIds);
  let updatedCount = 0;

  const now = new Date().toISOString();

  d.requests.forEach((req) => {
    let affected = false;

    if (idSet.has(req.sender_id)) {
      req.sender_paid = options.status === 'paid';
      req.sender_deposit_status = options.status;
      if (options.paidAmount !== undefined) req.sender_paid_amount = options.paidAmount;
      if (options.status === 'paid') req.sender_paid_at = req.sender_paid_at || now;
      affected = true;
    }

    if (idSet.has(req.receiver_id)) {
      req.receiver_paid = options.status === 'paid';
      req.receiver_deposit_status = options.status;
      if (options.paidAmount !== undefined) req.receiver_paid_amount = options.paidAmount;
      if (options.status === 'paid') req.receiver_paid_at = req.receiver_paid_at || now;
      affected = true;
    }

    if (affected) {
      if (options.customTotalFee !== undefined) req.total_fee = options.customTotalFee;
      if (options.customDepositFee !== undefined) req.deposit_fee = options.customDepositFee;
      if (req.sender_paid && req.receiver_paid && req.journey_stage === 'accepted') {
        req.journey_stage = 'coordination';
        req.paid_at = req.paid_at || now;
      }
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    save();
  }
  return updatedCount > 0;
}

