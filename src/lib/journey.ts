// ============================================================
//  رحلة طلب التوافق — نظام موحّد ومختصر (3 مراحل رئيسية + الدفع عبر الواتساب)
//  المراحل:
//  ① الإرسال (بانتظار الرد)
//  ② القبول وسداد العربون (١,٠٠٠ ر.ق عبر الواتساب برقم الطلب)
//  ③ جاري التنسيق والتواصل (بين الأطراف عبر الإدارة)
//  النتائج النهائية للإدارة:
//  • حدث نصيب وتم تسليم المهر (مكتمل)
//  • لم يحدث نصيب (ملغى)
// ============================================================

import {
  Send, HeartHandshake, ShieldCheck, CalendarClock,
  PartyPopper, XCircle, Ban, Eye, Gem, type LucideIcon, MessageCircle,
} from 'lucide-react';

// ===== المبالغ المالية المعتمدة (ريال قطري) =====
export const TOTAL_FEE_AMOUNT = 5000;
export const DEPOSIT_AMOUNT = 1000;
export const REMAINING_FEE_DEFAULT = 4000;

// ===== مراحل الرحلة (المسار الرئيسي المختصر) =====
export type JourneyStage =
  | 'sent'           // ① إرسال الطلب — بانتظار رد الطرف الآخر
  | 'accepted'       // ② القبول وسداد العربون — ١,٠٠٠ ر.ق عبر الواتساب
  | 'coordination'   // ③ جاري التنسيق والتواصل — تحت إشراف الإدارة
  | 'completed';     // ④ حدث نصيب وتم تسليم المهر — النتيجة النهائية المباركة

// المراحل السابقة (للتوافق الرجعي التام مع البيانات القديمة)
export type LegacyJourneyStage = 'seriousness' | 'sharia_viewing' | 'engagement';

// المساران الجانبيان
export type JourneyTerminal = 'declined' | 'cancelled';

export type JourneyState = JourneyStage | LegacyJourneyStage | JourneyTerminal;

// ===== ترتيب المراحل الرئيسية المعروضة في الـ Stepper =====
export const JOURNEY_STAGES: JourneyStage[] = [
  'sent', 'accepted', 'coordination', 'completed',
];

export const STAGE_INDEX: Record<string, number> = {
  sent: 0,
  accepted: 1,
  seriousness: 1, // توافق رجعي: مرحلة العربون تتبع القبول
  coordination: 2,
  sharia_viewing: 2, // توافق رجعي: تتبع التنسيق
  engagement: 2,     // توافق رجعي: تتبع التنسيق
  completed: 3,
};

// ===== تعريف كل مرحلة (عنوان + وصف + أيقونة + لون + شرح منبثق) =====
export interface StageMeta {
  key: JourneyState;
  step: number;            // رقم الخطوة (1..3) أو 4 للمكتمل، أو -1 للمسارات الجانبية
  title: string;           // العنوان المختصر للـ Stepper
  badge: string;           // نص الشارة
  icon: LucideIcon;
  accent: string;          // لون مميّز (tailwind text/bg base)
  whereYouAre: string;     // أين أنت الآن
  whatToDo: string;        // ماذا تفعل الآن
  whatsNext: string;       // ما المرحلة التالية
}

export const STAGE_META: Record<string, StageMeta> = {
  sent: {
    key: 'sent', step: 1, title: 'إرسال الطلب', badge: 'بانتظار الرد',
    icon: Send, accent: 'gold',
    whereYouAre: 'تم إرسال طلب التوافق بنجاح، والطلب الآن بانتظار رد الطرف الآخر بالقبول أو الاعتذار.',
    whatToDo: 'لا يلزمك أي إجراء حالياً — سنُشعرك فور اتخاذ الطرف الآخر قراره.',
    whatsNext: 'في حال القبول المبدئي، ينتقل الطلب مباشرة لمرحلة سداد العربون عبر الواتساب.',
  },
  accepted: {
    key: 'accepted', step: 2, title: 'القبول وسداد العربون', badge: 'عربون ١,٠٠٠ ر.ق (مرة واحدة)',
    icon: HeartHandshake, accent: 'amber',
    whereYouAre: 'تم قبول طلب التوافق بفضل الله. تبدأ الآن خطوة سداد عربون الجدية (١,٠٠٠ ر.ق من إجمالي ٥,٠٠٠ ر.ق) عبر الواتساب. يُطلب العربون مرة واحدة فقط كجزء من أتعاب المنصة وجهد الإدارة في التنسيق والتوفيق، ومعفى من تكراره في أي رحلات أخرى.',
    whatToDo: 'أقرّ بتعهد سداد باقي الأتعاب ثم اضغط زر السداد عبر الواتساب برقم طلبك.',
    whatsNext: 'بمجرد تسجيل الإدارة للسداد، يتم نقلك فوراً لمرحلة «جاري التنسيق والتواصل».',
  },
  seriousness: {
    key: 'seriousness', step: 2, title: 'القبول وسداد العربون', badge: 'عربون ١,٠٠٠ ر.ق (مرة واحدة)',
    icon: ShieldCheck, accent: 'amber',
    whereYouAre: 'بانتظار سداد عربون الجدية (١,٠٠٠ ر.ق يُطلب لمرة واحدة فقط طوال اشتراكك بالمنصة كجزء من أتعاب التنسيق والتوفيق).',
    whatToDo: 'أكمل السداد عبر الواتساب مع الإدارة برقم طلبك، أو ستظهر لك الرحلة كمسددة إذا كنت قد سددت سابقاً.',
    whatsNext: 'بعد اعتماد الإدارة تنتقل الرحلة إلى جاري التنسيق والتواصل.',
  },
  coordination: {
    key: 'coordination', step: 3, title: 'جاري التنسيق والتواصل', badge: 'تحت إشراف الإدارة',
    icon: CalendarClock, accent: 'blue',
    whereYouAre: 'تم تأكيد السداد بفضل الله. تقوم إدارة المنصة الآن بالتنسيق المباشر والسري بين الطرفين عبر الواتساب.',
    whatToDo: 'تابع رسائل الواتساب مع إدارة المنصة، حيث يتم التنسيق لترتيب الرؤية الشرعية والخطوات القادمة.',
    whatsNext: 'تحدد الإدارة النتيجة النهائية: إما «حدث نصيب وتم تسليم المهر» أو «لم يحدث نصيب».',
  },
  sharia_viewing: {
    key: 'sharia_viewing', step: 3, title: 'جاري التنسيق والتواصل', badge: 'تحت إشراف الإدارة',
    icon: Eye, accent: 'blue',
    whereYouAre: 'مرحلة التنسيق والنظرة الشرعية تجري برعاية وتنسيق إدارة المنصة.',
    whatToDo: 'التنسيق مستمر عبر إدارة المنصة على الواتساب.',
    whatsNext: 'تحدد الإدارة النتيجة النهائية بالتوافق بين الطرفين.',
  },
  engagement: {
    key: 'engagement', step: 3, title: 'تسليم المهر واستكمال الأتعاب', badge: 'الخطوة الأخيرة',
    icon: Gem, accent: 'gold',
    whereYouAre: 'تم الاتفاق بحمد الله. بعد تسليم المهر يتم استكمال باقي أتعاب المنصة.',
    whatToDo: 'سداد المتبقي من الأتعاب بالتنسيق مع الإدارة.',
    whatsNext: 'اعتماد وتوثيق إتمام الزواج بنجاح.',
  },
  completed: {
    key: 'completed', step: 4, title: 'حدث نصيب وتم تسليم المهر', badge: 'اكتملت الرحلة ✅',
    icon: PartyPopper, accent: 'emerald',
    whereYouAre: 'تم بحمد الله وتوفيقه: حدث نصيب وتم تسليم المهر، واكتملت رحلة التوافق للزواج بنجاح مبارك!',
    whatToDo: 'بارك الله لكما وبارك عليكما وجمع بينكما في خير.',
    whatsNext: 'تم توثيق الزواج بنجاح في المنصة.',
  },
  declined: {
    key: 'declined', step: -1, title: 'تم الاعتذار', badge: 'منتهٍ',
    icon: XCircle, accent: 'rose',
    whereYouAre: 'انتهت هذه الرحلة باعتذار لطيف من الطرف الآخر. الزواج قسمة ونصيب.',
    whatToDo: 'لا تيأس، لكل إنسان نصيبه المبارك. يمكنك تصفّح الأعضاء وإرسال طلبات جديدة.',
    whatsNext: 'يمكنك بدء رحلة توافق جديدة مع عضو آخر في أي وقت.',
  },
  cancelled: {
    key: 'cancelled', step: -1, title: 'لم يحدث نصيب', badge: 'ملغى',
    icon: Ban, accent: 'slate',
    whereYouAre: 'انتهى الطلب بقرار «لم يحدث نصيب» وأرشفته كطلب ملغى باحترام تام.',
    whatToDo: 'الخيرة فيما اختاره الله. يمكنك استعراض الملفات وبدء طلب جديد.',
    whatsNext: 'لا يلزمك أي إجراء إضافي.',
  },
};

// ===== ألوان كل accent =====
export const ACCENT_CLASSES: Record<string, {
  text: string; bg: string; bgSoft: string; border: string; ring: string; dot: string; line: string;
}> = {
  gold:    { text: 'text-amber-700',  bg: 'bg-amber-500',   bgSoft: 'bg-amber-50',   border: 'border-amber-200',   ring: 'ring-amber-200',   dot: 'bg-amber-500',   line: 'bg-amber-400' },
  emerald: { text: 'text-emerald-700', bg: 'bg-emerald-500', bgSoft: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-200', dot: 'bg-emerald-500', line: 'bg-emerald-400' },
  amber:   { text: 'text-amber-700',  bg: 'bg-amber-500',   bgSoft: 'bg-amber-50',   border: 'border-amber-200',   ring: 'ring-amber-200',   dot: 'bg-amber-500',   line: 'bg-amber-400' },
  blue:    { text: 'text-blue-700',    bg: 'bg-blue-500',    bgSoft: 'bg-blue-50',    border: 'border-blue-200',    ring: 'ring-blue-200',    dot: 'bg-blue-500',    line: 'bg-blue-400' },
  indigo:  { text: 'text-indigo-700',  bg: 'bg-indigo-500',  bgSoft: 'bg-indigo-50',  border: 'border-indigo-200',  ring: 'ring-indigo-200',  dot: 'bg-indigo-500',  line: 'bg-indigo-400' },
  rose:    { text: 'text-rose-700',    bg: 'bg-rose-500',    bgSoft: 'bg-rose-50',    border: 'border-rose-200',    ring: 'ring-rose-200',    dot: 'bg-rose-500',    line: 'bg-rose-400' },
  slate:   { text: 'text-slate-600',   bg: 'bg-slate-500',   bgSoft: 'bg-slate-50',   border: 'border-slate-200',   ring: 'ring-slate-200',   dot: 'bg-slate-400',   line: 'bg-slate-300' },
};

// role: دور المستخدم الحالي في الطلب — مرسِل أو مستقبِل
export type RequestRole = 'sender' | 'receiver';

export interface PrimaryAction {
  type: 'accept_decline' | 'open_journey' | 'pay_whatsapp' | 'view_coordination' | 'none';
  label: string;
  hint: string;
}

/**
 * توليد رابط محادثة واتساب المباشرة للدفع برقم الطلب وبيانات الطرفين
 */
export function getWhatsAppPaymentUrl(
  requestId: number | string,
  myNickname: string,
  otherNickname: string,
  adminNumber = '97455620331',
  depositAmount = DEPOSIT_AMOUNT,
  myId?: string | number,
  otherId?: string | number,
  myUsername?: string,
  otherUsername?: string,
): string {
  const cleanNumber = adminNumber.replace(/[+\s-]/g, '') || '97455620331';

  const myIdStr = myId ? ` | ID الحساب: #${myId}` : '';
  const myUserStr = myUsername ? ` | اليوزر/الإيميل: ${myUsername}` : '';
  const otherIdStr = otherId ? ` | ID الحساب: #${otherId}` : '';
  const otherUserStr = otherUsername ? ` | اليوزر/الإيميل: ${otherUsername}` : '';

  const text = `السلام عليكم ورحمة الله،
أود سداد عربون طلب التوافق في منصة تلاقي القطرية للزواج:

• رقم ID الطلب: #${requestId}
• بياناتي (المسدد): ${myNickname || 'عضو'}${myIdStr}${myUserStr}
• بيانات الطرف الآخر: ${otherNickname || 'عضو'}${otherIdStr}${otherUserStr}

• المبلغ الإجمالي للأتعاب: 5,000 ريال قطري
• مبلغ العربون المطلوب الآن: 1,000 ريال قطري (يُطلب لمرة واحدة فقط)
• المبلغ المتبقي عند تمام الزواج وتسليم المهر: 4,000 ريال قطري

• التعهد والإقرار: أتعهد شرعاً بسداد باقي أتعاب المنصة وقدرها (4,000 ر.ق) فور حدوث النصيب وإتمام عقد القران وتسليم المهر بتنسيق إدارة المنصة.

يرجى تزويدي بطريقة التحويل المعتمدة لتأكيد السداد ونقل طلبي لمرحلة التنسيق والنظرة الشرعية. شكراً لكم.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

export function getPrimaryAction(
  stage: JourneyState,
  role: RequestRole,
  ctx: { selfPaid?: boolean; otherPaid?: boolean } = {},
): PrimaryAction {
  switch (stage) {
    case 'sent':
      return role === 'receiver'
        ? { type: 'accept_decline', label: 'الرد على الطلب', hint: 'اقبل الطلب أو اعتذر بلطف' }
        : { type: 'none', label: 'بانتظار الرد', hint: 'سنُشعرك فور رد الطرف الآخر' };

    case 'accepted':
    case 'seriousness':
      if (ctx.selfPaid) {
        return { type: 'open_journey', label: 'تم السداد ✓ بانتظار الاعتماد', hint: 'سددت العربون وبانتظار التنسيق' };
      }
      return {
        type: 'pay_whatsapp',
        label: 'ادفع عبر الواتساب برقم الطلب',
        hint: `عربون الجدية: ${DEPOSIT_AMOUNT} ر.ق برقم الطلب`,
      };

    case 'coordination':
    case 'sharia_viewing':
    case 'engagement':
      return {
        type: 'view_coordination',
        label: 'جاري التنسيق بين الأطراف',
        hint: 'التنسيق جارٍ تحت إشراف الإدارة عبر الواتساب',
      };

    case 'completed':
      return { type: 'none', label: 'حدث نصيب وتم تسليم المهر ✅', hint: 'مبارك للطرفين' };

    default:
      return { type: 'none', label: '', hint: '' };
  }
}

// هل يتطلّب هذا الطلب إجراءً فورياً من المستخدم الحالي؟
export function requiresMyAction(
  stage: JourneyState,
  role: RequestRole,
  ctx: { selfPaid?: boolean; otherPaid?: boolean } = {},
): boolean {
  switch (stage) {
    case 'sent':
      return role === 'receiver'; // طلب وارد ينتظر ردي
    case 'accepted':
    case 'seriousness':
      return !ctx.selfPaid;       // يحتاج دفع العربون
    default:
      return false;
  }
}

export function actionUrgency(
  stage: JourneyState,
  role: RequestRole,
  ctx: { selfPaid?: boolean; otherPaid?: boolean } = {},
): 'pay' | 'respond' | 'continue' | null {
  if (!requiresMyAction(stage, role, ctx)) return null;
  if (stage === 'sent' && role === 'receiver') return 'respond';
  if ((stage === 'accepted' || stage === 'seriousness') && !ctx.selfPaid) return 'pay';
  return 'continue';
}

// ربط الحالة القديمة بالمرحلة الجديدة (توافق رجعي)
export function legacyToJourney(status: string, mediationStage?: string): JourneyState {
  switch (status) {
    case 'pending': return 'sent';
    case 'accepted':
    case 'accepted_pending_admin':
    case 'accepted_pending_payment': return 'accepted';
    case 'paid':
    case 'seriousness': return 'accepted';
    case 'in_mediation':
    case 'introduction':
    case 'sharia_viewing':
    case 'engagement':
    case 'coordination': return 'coordination';
    case 'completed': return 'completed';
    case 'declined': return 'declined';
    case 'cancelled': return 'cancelled';
    default: return 'sent';
  }
}

export function isTerminal(stage: JourneyState): stage is JourneyTerminal {
  return stage === 'declined' || stage === 'cancelled';
}

export interface JourneyRequestLike {
  id?: number | string;
  journey_stage: string;
  sender_id: string;
  receiver_id: string;
  sender_paid?: boolean;
  receiver_paid?: boolean;
  sender_paid_amount?: number;
  receiver_paid_amount?: number;
  total_fee?: number;
  deposit_fee?: number;
  decline_reason?: string | null;
  cancel_reason?: string | null;
  [key: string]: any;
}

export type TurnActor = 'me' | 'other' | 'both' | 'system' | 'none';
export type StatusTone = 'urgent' | 'waiting' | 'success' | 'neutral' | 'danger';

export interface JourneyStatusSummary {
  actor: TurnActor;
  actorLabel: string;
  tone: StatusTone;
  title: string;
  description: string;
  nextHint: string;
  selfPaidAmount?: number;
  remainingAmount?: number;
}

const VALID_STAGES: JourneyState[] = ['sent', 'accepted', 'coordination', 'completed', 'declined', 'cancelled', 'seriousness', 'sharia_viewing', 'engagement'];

export function getJourneyStage(req: JourneyRequestLike, currentUserId: string): JourneyState {
  const rawStage = (req.journey_stage as JourneyState) || 'sent';
  const baseStage = VALID_STAGES.includes(rawStage)
    ? rawStage
    : legacyToJourney(req.journey_stage);

  // تسطيح المراحل السابقة إلى المراحل الثلاث الرئيسية
  if (baseStage === 'seriousness') return 'accepted';
  if (baseStage === 'sharia_viewing' || baseStage === 'engagement') return 'coordination';

  return baseStage;
}

export function getJourneyStatusSummary(
  req: JourneyRequestLike,
  currentUserId: string,
  otherName = 'الطرف الآخر',
): JourneyStatusSummary {
  const stage = getJourneyStage(req, currentUserId);
  const isSender = String(req.sender_id) === String(currentUserId);
  const role: RequestRole = isSender ? 'sender' : 'receiver';
  const selfPaid = isSender ? !!req.sender_paid : !!req.receiver_paid;
  const otherPaid = isSender ? !!req.receiver_paid : !!req.sender_paid;
  const selfPaidAmount = isSender
    ? (req.sender_paid_amount !== undefined && req.sender_paid_amount !== null ? Number(req.sender_paid_amount) : (selfPaid ? DEPOSIT_AMOUNT : 0))
    : (req.receiver_paid_amount !== undefined && req.receiver_paid_amount !== null ? Number(req.receiver_paid_amount) : (selfPaid ? DEPOSIT_AMOUNT : 0));
  const totalFee = req.total_fee || TOTAL_FEE_AMOUNT;
  const remainingAmount = Math.max(0, totalFee - selfPaidAmount);

  if (stage === 'declined') {
    return {
      actor: 'none', actorLabel: 'منتهٍ', tone: 'danger',
      title: 'تم الاعتذار عن هذا الطلب',
      description: req.decline_reason ? `السبب: ${req.decline_reason}` : 'انتهت الرحلة باعتذار لطيف من أحد الطرفين. الزواج قسمة ونصيب.',
      nextHint: 'تصفّح ملفات جديدة وابدأ رحلة جديدة متى شئت.',
      selfPaidAmount, remainingAmount,
    };
  }

  if (stage === 'cancelled') {
    return {
      actor: 'none', actorLabel: 'لم يحدث نصيب (ملغى)', tone: 'neutral',
      title: 'لم يحدث نصيب — تم إلغاء الطلب',
      description: req.cancel_reason ? `السبب: ${req.cancel_reason}` : 'انتهت الرحلة بقرار «لم يحدث نصيب» وأرشفة الطلب باحترام وقسمة ونصيب.',
      nextHint: 'يمكنك إرسال طلب توافق جديد لعضو آخر في أي وقت.',
      selfPaidAmount, remainingAmount,
    };
  }

  if (stage === 'completed') {
    return {
      actor: 'none', actorLabel: 'حدث نصيب وتم تسليم المهر ✅', tone: 'success',
      title: '🎉 حدث نصيب وتم تسليم المهر — مبارك للطرفين!',
      description: 'اكتملت رحلة التوافق للزواج بنجاح برعاية المنصة. بارك الله لكما وبارك عليكما وجمع بينكما في خير.',
      nextHint: 'تم توثيق الزواج بنجاح في المنصة.',
      selfPaidAmount, remainingAmount: 0,
    };
  }

  if (stage === 'sent') {
    if (role === 'receiver') {
      return {
        actor: 'me', actorLabel: '🔔 الدور عليك الآن', tone: 'urgent',
        title: `وصلك طلب توافق من ${otherName}`,
        description: 'راجع الملف والمواصفات، ثم اختر قبول الطلب للانتقال لمرحلة سداد العربون، أو الاعتذار بلطف.',
        nextHint: 'عند القبول، يظهر لك حقل السداد. بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.',
        selfPaidAmount: 0, remainingAmount: totalFee,
      };
    }
    return {
      actor: 'other', actorLabel: '⏳ بانتظار رد الطرف الآخر', tone: 'waiting',
      title: 'تم إرسال طلبك بنجاح',
      description: `طلبك قيد المراجعة لدى ${otherName}. بعد الموافقة والسداد، تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.`,
      nextHint: 'لا يوجد إجراء مطلوب منك حالياً.',
      selfPaidAmount: 0, remainingAmount: totalFee,
    };
  }

  if (stage === 'accepted') {
    if (!selfPaid) {
      return {
        actor: 'me', actorLabel: '💳 بانتظار السداد', tone: 'urgent',
        title: 'تم القبول المبدئي بفضل الله — لم تسدد بعد',
        description: selfPaidAmount > 0
          ? `تم سداد (${selfPaidAmount} ر.ق) جزئياً. بعد السداد الكامل سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.`
          : `لم تقم بالسداد بعد. بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.`,
        nextHint: 'بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.',
        selfPaidAmount, remainingAmount,
      };
    }
    return {
      actor: 'system', actorLabel: '⏳ بانتظار التنسيق والاعتماد', tone: 'waiting',
      title: selfPaidAmount === 0 ? '✅ تم القبول والاعتماد (معفي من عربون الجدية)' : '✅ تم السداد وتسجيل الطلب',
      description: 'بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية تحت إشراف الإدارة.',
      nextHint: 'بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.',
      selfPaidAmount, remainingAmount,
    };
  }

  if (stage === 'coordination') {
    return {
      actor: 'both', actorLabel: '🤝 جاري التنسيق والتواصل', tone: 'success',
      title: 'جاري التنسيق والتواصل بين الأطراف',
      description: 'تقوم إدارة المنصة الآن بالتنسيق المباشر والسري بين الطرفين عبر الواتساب لترتيب الخطوات والنظرة الشرعية.',
      nextHint: 'تواصل مع إدارة المنصة عبر الواتساب لمتابعة التنسيق.',
      selfPaidAmount, remainingAmount,
    };
  }

  return {
    actor: 'system', actorLabel: 'متابعة', tone: 'neutral',
    title: STAGE_META[stage]?.title || 'رحلة التوافق',
    description: STAGE_META[stage]?.whereYouAre || '',
    nextHint: STAGE_META[stage]?.whatsNext || '',
    selfPaidAmount, remainingAmount,
  };
}

// أسباب الاعتذار الجاهزة
export const DECLINE_REASONS = [
  'عدم توافق في المواصفات الأساسية المطلوبة.',
  'الفارق في العمر كبير جداً.',
  'الحالة الاجتماعية غير مناسبة.',
  'عدم توافق في الأهداف وتطلعات شريك الحياة.',
  'المسافة الجغرافية بين المدن كبيرة.',
  'سبب آخر.',
];

// أسباب إلغاء الطلب الجاهزة
export const CANCEL_REASONS = [
  'لم يحدث نصيب بعد التنسيق والاستخارة.',
  'عدم التوافق بعد مراجعة التفاصيل والرؤية الشرعية.',
  'ظروف خاصة طرأت.',
  'سبب آخر.',
];
