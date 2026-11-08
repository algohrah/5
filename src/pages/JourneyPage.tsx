import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Loader2, AlertCircle, BadgeCheck, MapPin, Check, Info, X,
  ShieldCheck, MessageSquare, Send as SendIcon, CalendarClock, Heart,
  Sparkles, Coins, AlertTriangle, ChevronLeft, LifeBuoy, Eye, Gem, Ban,
  Phone, Lock, Clock, HeartHandshake, Calendar, Edit3, Trash2, MessageCircle,
} from 'lucide-react';
import { getAvatar, getGenderColors } from '../lib/types';
import { useApp } from '../lib/AppContext';
import {
  fetchRequest, fetchRequestEvents, fetchInquiry,
  fetchMembers, runActionStandalone, markRequestSeen,
  markRequestNotificationsRead, getCurrentUserId,
  type ApiRequest, type RequestEvent, type InquiryState,
} from '../lib/useInterestRequests';
import { useSettings } from '../lib/useSettings';
import {
  JOURNEY_STAGES, STAGE_INDEX, STAGE_META, ACCENT_CLASSES,
  isTerminal, DECLINE_REASONS, CANCEL_REASONS, getJourneyStage, getJourneyStatusSummary,
  getWhatsAppPaymentUrl, DEPOSIT_AMOUNT, TOTAL_FEE_AMOUNT,
  type JourneyState,
} from '../lib/journey';
import { JourneyTimeline } from '../components/JourneyTimeline';
import RequestStatusPanel from '../components/requests/RequestStatusPanel';
import PaymentGateway from '../components/payments/PaymentGateway';
import authClient from '../lib/authClient';

function stageOf(r: ApiRequest, activeUserId: string): JourneyState {
  return getJourneyStage(r, activeUserId);
}

export default function JourneyPage() {
  const { id } = useParams();
  const rid = Number(id);
  const navigate = useNavigate();
  const { user } = useApp();
  const currentUserId = user?.memberId || getCurrentUserId();
  // تعليم الطلب كمقروء عند فتح رحلته
  useEffect(() => {
    if (rid && currentUserId) {
      markRequestSeen(rid);
      markRequestNotificationsRead(rid, currentUserId);
    }
  }, [rid, currentUserId]);

  const [req, setReq] = useState<ApiRequest | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [inquiry, setInquiry] = useState<InquiryState>({ package: null, remaining: 0, messages: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: string } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showJourneyMap, setShowJourneyMap] = useState(false);

  const showToast = (text: string, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    if (!currentUserId || !Number.isFinite(rid) || rid <= 0) {
      setReq(null);
      setLoading(false);
      return;
    }
    const [r, ev, inq, mem] = await Promise.all([
      fetchRequest(rid),
      fetchRequestEvents(rid),
      fetchInquiry(rid),
      fetchMembers(),
    ]);
    setReq(r);
    setEvents(ev);
    setInquiry(inq);
    setMembers(mem);
    setLoading(false);
  }, [rid, currentUserId]);

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('twafok_notification_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('twafok_notification_update', handleUpdate);
    };
  }, [load]);

  // اشتراك لحظي حقيقي عبر الاشتراك اللحظي المحلي — تنعكس إجراءات الطرف الآخر (قبول/رفض/دفع...) فوراً بدون تحديث الصفحة
  useEffect(() => {
    if (!rid || typeof authClient?.channel !== 'function') return;
    const channel = authClient
      .channel(`interest-request-${rid}`)
      ?.on('postgres_changes', { event: '*', schema: 'public', table: 'interest_requests', filter: `id=eq.${rid}` }, () => {
        load();
      })
      ?.subscribe();
    return () => { if (channel && typeof authClient?.removeChannel === 'function') authClient.removeChannel(channel); };
  }, [rid, load]);

  const runAction = async (action: string, payload: Record<string, any> = {}) => {
    setBusy(true);
    try {
      const res = await runActionStandalone(rid, action, currentUserId, payload);
      if (!res.ok) { showToast(res.error || 'فشل الإجراء', 'error'); return false; }
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  };

  if (loading && rid) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center text-[#1C1917]" dir="rtl">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-[#7B113A] mb-2 sm:mb-3" />
        <p className="font-['Cairo'] text-[#57534E] text-sm">جارٍ فتح تفاصيل الرحلة...</p>
      </div>
    );
  }

  if (!rid) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] text-[#1C1917] font-['Tajawal',sans-serif] pb-16" dir="rtl">
        <header className="bg-gradient-to-tr from-[#680E30] to-[#7B113A] px-4 py-10 sm:py-14 text-center text-white">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#FFF0D4] text-xs font-['Cairo'] font-bold mb-3">
            دليل رحلة التوفيق الشرعي 🇶🇦
          </span>
          <h1 className="font-['Cairo'] font-black text-2xl sm:text-4xl text-white">
            مراحل رحلة التوافق خطوة بخطوة
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
            من إرسال طلب التوافق وحتى إتمام القران المبارك في خصوصية وأمان تام
          </p>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-3.5 mb-8 text-right">
            {[
              { num: '01', title: 'طلب التوافق', desc: 'تصفح مواصفات العضو المناسب وأرسل طلب توافق مبدئي بسرية تامة دون إظهار بيانات شخصية.' },
              { num: '02', title: 'الموافقة المبدئية', desc: 'يصل إشعار للطرف الآخر للاطلاع على مواصفاتك العامة، وله حق القبول المبدئي أو الاعتذار بكل احترام.' },
              { num: '03', title: 'تأكيد الجدية', desc: 'عند التوافق المبدئي، يقوم الطرفان بتأكيد الجدية لمتابعة التنسيق المباشر بإشراف الخطابة.' },
              { num: '04', title: 'تنسيق التواصل', desc: 'تشارك وسائل التواصل المعتمدة للأهل أو الطرفين بموافقة صريحة وترتيب شرعي منظم.' },
              { num: '05', title: 'النظرة الشرعية وقرار الطرفين', desc: 'إتاحة النظرة الشرعية الرسمية برعاية الأهل لاتخاذ القرار المصيري بطمأنينة واستخارة.' },
              { num: '06', title: 'إتمام القران والمباركة', desc: 'عند الاتفاق والتراضي، تُستكمل الإجراءات الشرعية ونبارك للزوجين بيتاً مستقراً ومباركاً.' },
            ].map((st) => (
              <div key={st.num} className="bg-white rounded-2xl border border-[#EAE3D9] p-4 sm:p-5 shadow-2xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FEF8EC] text-[#A16207] font-['Cairo'] font-black text-sm flex items-center justify-center shrink-0 border border-[#F1E0B6]">
                  {st.num}
                </div>
                <div>
                  <h3 className="font-['Cairo'] font-bold text-sm sm:text-base text-[#1C1917] mb-1">{st.title}</h3>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#EAE3D9] p-5 text-center">
            <h4 className="font-['Cairo'] font-bold text-sm text-[#1C1917] mb-1">جاهز لبدء رحلتك؟</h4>
            <p className="text-xs text-[#78716C] mb-4">تصفح ملفات الأعضاء الموثقة وأرسل طلب التوافق الأول الآن</p>
            <div className="flex items-center justify-center gap-2.5">
              <Link to="/search" className="bg-[#7B113A] hover:bg-[#680E30] text-white font-['Cairo'] font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition-colors">
                استعراض الأعضاء والملفات
              </Link>
              <Link to="/requests" className="bg-white border border-[#EAE3D9] text-[#7B113A] font-['Cairo'] font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                متابعة طلباتي
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center px-6 text-center text-[#1C1917]" dir="rtl">
        <AlertCircle className="w-12 h-12 text-[#7B113A] mb-3" />
        <p className="font-['Cairo'] font-bold text-[#1C1917] mb-3">تعذّر العثور على هذا الطلب</p>
        <Link to="/requests" className="text-[#7B113A] font-['Cairo'] font-bold underline text-sm">العودة لصفحة الطلبات</Link>
      </div>
    );
  }

  // إذا كان زائراً غير مسجل الدخول
  if (!user?.isLoggedIn && !currentUserId) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center px-6 text-center text-[#1C1917]" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-[#7B113A]/10 text-[#7B113A] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-['Cairo'] font-bold text-xl text-[#1C1917] mb-2">تسجيل الدخول مطلوب</h2>
        <p className="font-['Tajawal'] text-neutral-600 text-sm max-w-sm mb-6 leading-relaxed">
          يرجى تسجيل الدخول إلى حسابك أو إنشاء حساب جديد للاطلاع على تفاصيل ومراحل رحلة التوافق الشرعي.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
          <Link
            to="/login"
            className="w-full py-3 px-5 bg-[#7B113A] text-white font-['Cairo'] font-bold rounded-xl hover:bg-[#500A25] transition shadow-sm text-center text-sm"
          >
            تسجيل الدخول
          </Link>
          <Link
            to="/register"
            className="w-full py-3 px-5 bg-white border border-[#EAE3D9] text-[#7B113A] font-['Cairo'] font-bold rounded-xl hover:bg-[#FAF7F2] transition text-center text-sm"
          >
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    );
  }

  // التحقق من صلاحية الوصول للطلب — العضو يرى فقط الطلبات التي هو طرف فيها
  const isParticipant = req.sender_id === currentUserId || req.receiver_id === currentUserId;
  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center" dir="rtl">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <p className="font-cairo font-bold text-navy-800 text-lg mb-2">غير مصرح بالوصول</p>
        <p className="font-cairo text-navy-600 text-sm mb-4">هذا الطلب يخص عضواً آخر، لا يمكنك الاطلاع على تفاصيله.</p>
        <Link to="/requests" className="px-5 py-2.5 bg-navy-900 text-white rounded-xl font-cairo font-bold hover:bg-navy-800 transition">العودة إلى طلباتي</Link>
      </div>
    );
  }

  const stage = stageOf(req, currentUserId);
  const isSender = String(req.sender_id) === String(currentUserId);
  const other = members.find((m) => String(m.id) === String(isSender ? req.receiver_id : req.sender_id));
  const isOtherDeleted = !other || other.status === 'deleted' || (other as any).deleted === true;
  const isOtherBanned = other?.status === 'banned';
  const isOtherSuspended = other?.status === 'suspended';
  const isOtherUnavailable = isOtherDeleted || isOtherBanned || isOtherSuspended;

  const currentMember = members.find((m) => m.id === currentUserId);
  const selfLabel = (user as any)?.nickname || currentMember?.nickname || (isSender ? req.sender_nickname : req.receiver_nickname) || 'أنت';
  const otherLabel = other?.nickname || (isSender ? req.receiver_nickname : req.sender_nickname) || 'الطرف الآخر';

  const colors = other ? getGenderColors(other.gender) : getGenderColors('male');
  const currentIdx = isTerminal(stage) ? -1 : STAGE_INDEX[stage as keyof typeof STAGE_INDEX];
  const progress = isTerminal(stage) ? 100 : Math.round(((currentIdx + 1) / JOURNEY_STAGES.length) * 100);
  const statusSummary = getJourneyStatusSummary(req, currentUserId, otherLabel);

  return (
    <div className="min-h-screen bg-cream-50 pb-20" dir="rtl">
      {/* ===== بانر التجميد الإداري أو حذف حساب الشريك ===== */}
      {isOtherUnavailable && (
        <div className="sticky top-0 z-50 bg-rose-600 text-white px-4 py-3 text-center font-cairo font-bold text-sm flex items-center justify-center gap-2 shadow-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>
            {isOtherDeleted ? 'تنبيه: تم حذف حساب الطرف الآخر من المنصة، لا يمكن استكمال خطوات الرحلة.' : isOtherBanned ? 'تنبيه: حساب الطرف الآخر محظور حالياً من قبل الإدارة.' : 'تنبيه: حساب الطرف الآخر موقوف موقتاً.'}
          </span>
        </div>
      )}
      {req.frozen && !isOtherUnavailable && (
        <div className="sticky top-0 z-50 bg-sky-500 text-white px-4 py-2.5 text-center font-cairo font-bold text-sm flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-pulse" />
          هذا الطلب قيد تنسيق الإدارة — سيتم تحديثه قريباً
        </div>
      )}
      {/* ===== الطبقة 1: رأس ثابت مدمج يحوي بيانات العضو والبانر وحالة الرحلة ===== */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-3.5 py-2.5 space-y-2">
          {/* بيانات العضو والتنقل المعروضة في الأعلى */}
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/requests')}
              className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-navy-600 flex-shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            {other && (
              <Link to={`/member/${other.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                <img src={getAvatar(other.gender)} alt={other.nickname}
                  className={`w-9.5 h-9.5 rounded-xl object-cover ring-2 ${colors.ring} ring-offset-1 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-cairo font-black text-navy-900 text-sm truncate">{other.nickname}</span>
                    {other.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                    <span className="text-[10px] font-cairo font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                      #{req.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-navy-500 font-cairo">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{other.city}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-600">{isSender ? 'طلب أرسلته' : 'طلب استقبلته'}</span>
                  </div>
                </div>
              </Link>
            )}
            <a href="/support" className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0 transition-colors" title="تواصل مع الوسيطة">
              <LifeBuoy className="w-4 h-4" />
            </a>
          </div>

          {/* البانر المدمج لحالة الطلب والمطلوب منك الآن (مدمج بجانب وتحت صورة العضو) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2">
            <RequestStatusPanel summary={statusSummary} compact />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3.5 py-2.5">
        {/* خط مراحل الرحلة المطور والمبسط بحجم مضغوط */}
        <div className="mb-2.5">
          <JourneyTimeline
            stage={stage}
            senderPaid={req.sender_paid}
            receiverPaid={req.receiver_paid}
            isSender={isSender}
            selfLabel={selfLabel}
            otherLabel={otherLabel}
          />
        </div>

        {/* ===== الطبقة 2: المرحلة النشطة (Hero) ===== */}
        <div>
          {/* تنبيه بتوجيهات ورسائل إدارة المنصة لهذا الطلب */}
          {inquiry?.messages?.filter((m: any) => m.sender_id === 'admin').length > 0 && (
            <div className="mb-2.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-xl p-2.5 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1 text-emerald-800 font-cairo font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>توجيه وإرشادات من إدارة المنصة:</span>
              </div>
              <div className="space-y-1.5">
                {inquiry.messages.filter((m: any) => m.sender_id === 'admin').map((m: any, mIdx: number) => (
                  <div key={`admin-direct-msg-${m.id || mIdx}`} className="bg-white border border-emerald-200 p-2.5 rounded-lg text-xs font-cairo text-navy-900 leading-relaxed">
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span>🛡️</span> إدارة منصة تلاقي القطرية للزواج
                      </span>
                      <span>{new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ActiveStagePanel
            req={req} stage={stage} isSender={isSender} other={other} busy={busy}
            self={members.find((m) => m.id === currentUserId)}
            showToast={showToast}
            runAction={runAction}
          />
        </div>

        {/* ===== خريطة الرحلة — مخفية افتراضياً حتى لا تزاحم الإجراء الحالي ===== */}
        <div className="mt-3 rounded-xl border border-cream-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowJourneyMap((open) => !open)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right"
          >
            <span className="flex items-center gap-1.5 font-cairo font-extrabold text-navy-800 text-xs">
              <Sparkles className="w-4 h-4 text-gold-500" />
              جميع مراحل الرحلة
            </span>
            <span className="font-cairo text-[11px] font-bold text-navy-500">
              {showJourneyMap ? 'إخفاء' : 'عرض مراحل الرحلة'}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {showJourneyMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-cream-200 p-3">
                  <VerticalJourney req={req} stage={stage} events={events} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== إلغاء الطلب — مختصر في أسفل الشاشة ===== */}
        {!isTerminal(stage) && (
          <div className="mt-2.5 text-center">
            <button onClick={() => setCancelOpen(true)} disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-cairo font-bold text-rose-500 hover:text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-60">
              <Ban className="w-3.5 h-3.5" /> إلغاء هذا الطلب
            </button>
          </div>
        )}

      </div>

      {/* حوار الإلغاء */}
      <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} busy={busy}
        onConfirm={async (reason: string) => {
          const ok = await runAction('cancel', { reason });
          setCancelOpen(false);
          if (ok) showToast('تم إلغاء الطلب', 'info');
        }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-[2147483647] px-5 py-3 rounded-2xl shadow-2xl font-cairo font-bold text-sm text-white max-w-[90%]
              ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-deep' : 'bg-navy-800'}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
//  الطبقة 2 — لوحة المرحلة النشطة (تتغيّر حسب المرحلة)
// ============================================================
function ActiveStagePanel({
  req, stage, isSender, other, self, busy, showToast, runAction,
}: any) {
  const meta = STAGE_META[stage as JourneyState];
  const c = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;

  // حالات المسارات الجانبية
  if (stage === 'declined' || stage === 'cancelled') {
    return (
      <div className={`rounded-3xl ${c.bgSoft} border ${c.border} p-6 text-center`}>
        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-white mx-auto mb-3`}>
          <Icon className="w-7 h-7" />
        </div>
        <h2 className={`font-cairo font-extrabold text-xl ${c.text}`}>{meta.title}</h2>
        <p className="text-sm text-navy-600 font-cairo mt-2">{meta.whereYouAre}</p>
        {(req.decline_reason || req.cancel_reason) && (
          <p className="text-xs text-navy-500 font-cairo mt-3 bg-white/60 rounded-xl p-2.5">
            السبب: {req.decline_reason || req.cancel_reason}
          </p>
        )}
        <Link to="/search" className="inline-block mt-4 bg-navy-900 text-white font-cairo font-bold px-6 py-3 rounded-2xl">
          ابدأ بحثاً جديداً
        </Link>
      </div>
    );
  }

  // المرحلة: مُرسَل
  if (stage === 'sent') {
    if (!isSender) {
      // المستقبِل يرى قرار القبول/الإلغاء
      return <DecisionPanel req={req} other={other} busy={busy} runAction={runAction} showToast={showToast} mode="incoming" />;
    }
    // ملخص «المطلوب منك الآن» في أعلى الصفحة يوضح حالة الانتظار بالكامل.
    // لا نكرر الصياغة نفسها داخل بطاقة ثانية.
    return null;
  }

  // المرحلة 2: مقبول أو سداد العربون -> سداد العربون عبر محادثة الواتساب المباشرة
  if (stage === 'accepted' || stage === 'seriousness') {
    return <DepositInline req={req} other={other} self={self} busy={busy} runAction={runAction} showToast={showToast} />;
  }

  // المرحلة 3: جاري التنسيق والتواصل بين الأطراف (تحت إشراف الإدارة)
  if (stage === 'coordination' || stage === 'sharia_viewing' || stage === 'engagement') {
    return (
      <CoordinationPanel req={req} other={other} busy={busy} runAction={runAction} showToast={showToast} meta={meta} c={c} Icon={Icon} />
    );
  }

  // المرحلة 4: مكتمل — حدث نصيب وتم تسليم المهر
  const isCompletedSuccess = req.evaluation_result !== 'failed';
  return (
    <HeroCard meta={meta} c={c} Icon={Icon}>
      {isCompletedSuccess ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 text-center shadow-lg border border-emerald-500">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 blur-lg" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-6 -mb-6 blur-lg" />
            
            <Sparkles className="w-12 h-12 text-amber-300 mx-auto mb-3 animate-pulse" />
            
            <h3 className="font-cairo font-extrabold text-xl tracking-tight text-amber-200">🎉 حدث نصيب وتم تسليم المهر!</h3>
            <p className="text-[11.5px] font-mono tracking-widest text-emerald-200 mt-1 uppercase">وثيقة توثيق عقد قران وتوافق جاد مبارك</p>
            
            <p className="text-xs font-serif italic text-cream-100 bg-white/10 rounded-2xl p-3 my-4 leading-relaxed font-medium">
              "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً"
            </p>
            
            <div className="space-y-1 text-right text-xs border-t border-white/20 pt-3">
              <p className="font-cairo"><span className="opacity-80">💍 حالة الرحلة:</span> <strong className="text-emerald-300">مكتملة — حدث نصيب وتم تسليم المهر ✓</strong></p>
              <p className="font-cairo"><span className="opacity-80">📅 تاريخ الإتمام:</span> <strong>{new Date(req.updated_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              <p className="font-cairo"><span className="opacity-80">🔐 رقم التوثيق:</span> <span className="font-mono text-emerald-300">TW-2026-{req.id}</span></p>
            </div>
            
            <div className="mt-4 inline-flex items-center gap-1 bg-amber-400 text-navy-950 px-3.5 py-1.5 rounded-full text-[10.5px] font-cairo font-extrabold shadow-sm">
              👑 اكتملت الرحلة وسداد الأتعاب برعاية المنصة
            </div>
          </div>
          
          {req.evaluation_note && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xs font-cairo text-navy-700 leading-relaxed text-right">
              <strong>📝 ملاحظة الإدارة:</strong> {req.evaluation_note}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5 text-center shadow-sm text-right">
          <HeartHandshake className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="font-cairo font-extrabold text-navy-800 text-base text-center">لم يحدث نصيب 🕊️</h3>
          <p className="text-xs font-cairo text-navy-600 leading-relaxed mt-2 max-w-sm mx-auto text-center">
            انتهت رحلة طلب الاهتمام هذه دون حدوث نصيب. الزواج قسمة ونصيب، ونسأل الله العلي القدير أن يكتب لك الخير والتوفيق ويعوضك خيراً.
          </p>
          {req.cancel_reason && (
            <div className="mt-3 bg-white border border-rose-100 rounded-xl p-3 text-xs font-cairo text-rose-700 leading-relaxed">
              <strong>سبب انتهاء المحاولة:</strong> {req.cancel_reason}
            </div>
          )}
        </div>
      )}
    </HeroCard>
  );
}

// ============================================================
//  لوحة الملكة — رسوم السعي النهائية + إتمام العقد
// ============================================================
function EngagementPanel({ req, busy, runAction, showToast, meta, c, Icon }: any) {
  const { settings } = useSettings();
  const { user } = useApp();
  const currentUserId = user?.memberId || getCurrentUserId();
  const isSender = String(req.sender_id) === String(currentUserId);
  const selfPaid = isSender ? !!req.sender_final_paid : !!req.receiver_final_paid;
  const otherPaid = isSender ? !!req.receiver_final_paid : !!req.sender_final_paid;
  const [mahrConfirmed, setMahrConfirmed] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const openPayment = () => {
    if (!mahrConfirmed) {
      showToast('أكد تسليم المهر أولًا قبل سداد المبلغ المتبقي', 'error');
      return;
    }
    setPayOpen(true);
  };

  const completeFinalPayment = async (): Promise<boolean> => {
    const ok = await runAction('pay_final_fee', { mahrConfirmed: true });
    if (ok) showToast(otherPaid ? 'اكتمل سداد الطرفين بفضل الله' : 'تم سداد المبلغ المتبقي، وبانتظار الطرف الآخر');
    return !!ok;
  };

  return (
    <HeroCard meta={meta} c={c} Icon={Icon}>
      <p className="mb-4 font-cairo text-sm leading-7 text-navy-600">{meta.whereYouAre}</p>

      <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-amber-300/15" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold-gradient shadow-sm">
            <Gem className="h-5 w-5 text-amber-900" />
          </div>
          <div>
            <h4 className="font-cairo text-sm font-extrabold text-navy-900">المتبقي من أتعاب المنصة لكل طرف</h4>
            <p className="mt-1 font-cairo text-xs leading-5 text-navy-500">يستحق بعد نتيجة النظرة الشرعية وتسليم المهر.</p>
          </div>
        </div>
        <div className="relative mt-5 text-center">
          <p className="font-mono text-4xl font-black text-amber-700">{settings.final_fee_amount || 2000}</p>
          <p className="font-cairo text-xs font-bold text-amber-800">ريال لكل طرف</p>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <PaymentState label="دفعت أنت" done={selfPaid} />
          <PaymentState label="دفع الطرف الآخر" done={otherPaid} />
        </div>
      </div>

      {selfPaid ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <Check className="mx-auto h-7 w-7 text-emerald-600" />
          <p className="mt-2 font-cairo text-sm font-extrabold text-emerald-800">تم سداد المبلغ المتبقي من طرفك</p>
          <p className="mt-1 font-cairo text-xs leading-6 text-emerald-700">
            {otherPaid ? 'اكتمل سداد الطرفين، ويتم إكمال الرحلة الآن.' : 'بانتظار سداد الطرف الآخر. سنُخطرك فور اكتمال الرحلة.'}
          </p>
        </div>
      ) : (
        <>
          <label className="mt-4 flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-cream-200 bg-cream-50/70 p-4">
            <input type="checkbox" checked={mahrConfirmed} onChange={(event) => setMahrConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" />
            <span className="font-cairo text-xs font-bold leading-6 text-navy-700">
              أؤكد أن المهر تم تسليمه، وأرغب في سداد المتبقي من أتعاب المنصة من جانبي.
            </span>
          </label>
          <button onClick={openPayment} disabled={!mahrConfirmed || busy}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-4 font-cairo text-sm font-extrabold text-navy-900 shadow-gold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gem className="h-5 w-5 text-amber-800" />}
            سداد المتبقي من جانبي
          </button>
        </>
      )}

      <PaymentGateway
        open={payOpen}
        onClose={() => setPayOpen(false)}
        amount={settings.final_fee_amount || 2000}
        title="المتبقي من أتعاب رحلة التوافق"
        description="يُسدّد بعد تسليم المهر — لكل طرف بصورة مستقلة"
        lineItems={[
          { label: 'المرحلة', value: 'بعد نتيجة النظرة الشرعية وتسليم المهر' },
          { label: 'المبلغ', value: `${settings.final_fee_amount || 2000} ريال لهذا الطرف` },
        ]}
        payLabel="سداد المبلغ المتبقي"
        onPaid={completeFinalPayment}
        requestId={req.id}
        requiresOfflineReview
        applyVat={false}
        metadata={{ paymentStage: 'final_fee', mahrConfirmed: true }}
      />
    </HeroCard>
  );
}

function PaymentState({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${done ? 'border-emerald-200 bg-emerald-50' : 'border-cream-200 bg-white'}`}>
      <span className={`font-cairo text-xs font-extrabold ${done ? 'text-emerald-700' : 'text-navy-500'}`}>
        {done ? 'تم السداد' : 'بانتظار السداد'}
      </span>
      <p className="mt-0.5 font-cairo text-[10px] text-navy-400">{label}</p>
    </div>
  );
}

// ============================================================
//  مشاركة معلومات التواصل — لا يظهر إلا ما يكتبه العضو ويرسله بنفسه
// ============================================================

function ContactExchange({ req, self, busy, runAction, showToast }: any) {
  const isFemale = self?.gender === 'female';
  const ownSubmitted = isFemale ? !!req.guardian_phone : !!req.male_phone;
  const otherSubmitted = isFemale ? !!req.male_phone : !!req.guardian_phone;

  const [phone, setPhone] = useState(isFemale ? (req.guardian_phone || '') : (req.male_phone || ''));
  const [name, setName] = useState(isFemale ? (req.guardian_name || '') : (req.male_name || ''));
  const [relation, setRelation] = useState(isFemale ? (req.guardian_relation || '') : (req.male_relation || ''));
  const [contactTime, setContactTime] = useState(isFemale ? (req.contact_time || '') : (req.male_contact_time || ''));
  const [note, setNote] = useState(isFemale ? (req.contact_note || '') : (req.male_contact_note || ''));
  const [confirmed, setConfirmed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('تعذر التواصل مع الطرف الآخر');

  const submit = async () => {
    if (!phone.trim()) {
      showToast(isFemale ? 'اكتب رقم ولي الأمر أو رقم التواصل الذي اخترت مشاركته' : 'اكتب رقم التواصل الذي اخترت مشاركته', 'error');
      return;
    }
    if (!confirmed) {
      showToast('يرجى تأكيد أنك اخترت مشاركة هذه المعلومات بنفسك', 'error');
      return;
    }
    const payload = isFemale
      ? {
          guardianPhone: phone.trim(), guardianName: name.trim(), guardianRelation: relation.trim(),
          contactTime: contactTime.trim(), contactNote: note.trim(),
        }
      : {
          malePhone: phone.trim(), maleName: name.trim(), maleRelation: relation.trim(),
          maleContactTime: contactTime.trim(), maleContactNote: note.trim(),
        };
    const ok = await runAction('submit_contact', payload);
    if (ok) showToast('تم إرسال معلومات التواصل التي كتبتها للطرف الآخر', 'success');
  };

  const otherContact = isFemale
    ? {
        phone: req.male_phone,
        name: req.male_name,
        relation: req.male_relation,
        time: req.male_contact_time,
        note: req.male_contact_note,
      }
    : {
        phone: req.guardian_phone,
        name: req.guardian_name,
        relation: req.guardian_relation,
        time: req.contact_time,
        note: req.contact_note,
      };

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-right">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
          <div>
            <p className="font-cairo text-sm font-extrabold text-blue-950">خصوصيتك بقرارك</p>
            <p className="mt-1 font-cairo text-xs leading-6 text-blue-800">
              لا نعرض رقم هاتفك أو بريدك المحفوظ في الحساب. لن يرى الطرف الآخر إلا المعلومات التي تكتبها هنا ثم تضغط «إرسال معلومات التواصل».
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-cream-100 pb-3">
          <div>
            <h3 className="font-cairo text-sm font-extrabold text-navy-900">معلومات التواصل التي سأشاركها</h3>
            <p className="mt-1 font-cairo text-[11px] leading-5 text-navy-500">
              {isFemale ? 'يمكنك مشاركة رقم ولي الأمر أو وسيلة التواصل المناسبة لك.' : 'اكتب وسيلة التواصل التي تريد إظهارها للطرف الآخر.'}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 font-cairo text-[10px] font-bold ${ownSubmitted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {ownSubmitted ? 'تم الإرسال' : 'مطلوب منك'}
          </span>
        </div>

        {ownSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="font-cairo text-xs font-extrabold text-emerald-800">تمت مشاركة المعلومات التالية باختيارك</p>
            <div className="mt-3 space-y-1.5 break-words font-cairo text-xs text-navy-700">
              <p><strong>رقم التواصل:</strong> {phone}</p>
              {name && <p><strong>الاسم:</strong> {name}</p>}
              {relation && <p><strong>الصفة أو صلة القرابة:</strong> {relation}</p>}
              {contactTime && <p><strong>الوقت المناسب:</strong> {contactTime}</p>}
              {note && <p><strong>ملاحظة:</strong> {note}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block font-cairo text-xs font-bold text-navy-700">
                {isFemale ? 'رقم ولي الأمر أو رقم التواصل' : 'رقم التواصل'} <span className="text-rose-500">*</span>
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="off"
                placeholder="اكتب الرقم الذي اخترت مشاركته"
                className="min-h-12 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 font-cairo text-sm text-navy-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-cairo text-xs font-bold text-navy-700">اسم شخص التواصل (اختياري)</label>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" placeholder="الاسم الذي تريد إظهاره"
                  className="min-h-12 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 font-cairo text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-xs font-bold text-navy-700">الصفة أو صلة القرابة (اختياري)</label>
                <input value={relation} onChange={(event) => setRelation(event.target.value)} autoComplete="off" placeholder="مثال: ولي الأمر، صاحب الرقم"
                  className="min-h-12 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 font-cairo text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block font-cairo text-xs font-bold text-navy-700">الوقت المناسب للتواصل (اختياري)</label>
              <input value={contactTime} onChange={(event) => setContactTime(event.target.value)} autoComplete="off" placeholder="مثال: من ٥ إلى ٩ مساءً"
                className="min-h-12 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 font-cairo text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block font-cairo text-xs font-bold text-navy-700">ملاحظة للطرف الآخر (اختياري)</label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="اكتب تعليمات قصيرة وواضحة للتواصل"
                className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 font-cairo text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" />
              <span className="font-cairo text-xs leading-6 text-navy-700">
                راجعت المعلومات وأفهم أنها ستظهر للطرف الآخر في طلب التوافق بعد الضغط على الإرسال.
              </span>
            </label>
            <button onClick={submit} disabled={busy || !phone.trim() || !confirmed}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-cairo text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
              إرسال معلومات التواصل
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-cream-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-cairo text-sm font-extrabold text-navy-900">معلومات الطرف الآخر</h3>
          <span className={`rounded-full px-2.5 py-1 font-cairo text-[10px] font-bold ${otherSubmitted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {otherSubmitted ? 'تمت المشاركة' : 'بانتظار الإرسال'}
          </span>
        </div>
        {otherSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="font-cairo text-[11px] leading-5 text-emerald-800">كتب الطرف الآخر هذه المعلومات وأرسلها لك باختياره:</p>
            <div className="mt-3 space-y-2 break-words font-cairo text-xs text-navy-800">
              <p><strong>رقم التواصل:</strong> <a href={`tel:${otherContact.phone}`} className="font-extrabold text-blue-700 underline">{otherContact.phone}</a></p>
              {otherContact.name && <p><strong>الاسم:</strong> {otherContact.name}</p>}
              {otherContact.relation && <p><strong>الصفة أو صلة القرابة:</strong> {otherContact.relation}</p>}
              {otherContact.time && <p><strong>الوقت المناسب:</strong> {otherContact.time}</p>}
              {otherContact.note && <p><strong>ملاحظة:</strong> {otherContact.note}</p>}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 p-5 text-center">
            <Clock className="mx-auto h-6 w-6 text-navy-300" />
            <p className="mt-2 font-cairo text-xs font-bold text-navy-600">بانتظار الطرف الآخر ليكتب معلوماته ويضغط إرسال</p>
            <p className="mt-1 font-cairo text-[11px] text-navy-400">لن تعرض المنصة أي بيانات محفوظة في حسابه تلقائيًا.</p>
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3 text-center">
        <p className="font-cairo text-[11px] leading-5 text-navy-500">إذا كانت المعلومات غير صحيحة أو تعذر التواصل، أخبر إدارة الموقع.</p>
        <button onClick={() => setReportOpen(true)} className="mt-2 min-h-11 rounded-xl border border-rose-200 px-4 font-cairo text-xs font-bold text-rose-700 hover:bg-rose-50">
          إبلاغ الإدارة للمساعدة
        </button>
      </div>

      <DialogShell open={reportOpen} onClose={() => setReportOpen(false)} title="إبلاغ إدارة الموقع">
        <p className="mb-3 font-cairo text-xs leading-6 text-navy-600">اكتب سببًا مختصرًا ليساعد فريق الإدارة على متابعة المشكلة.</p>
        <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} rows={4}
          className="w-full resize-none rounded-xl border border-cream-200 bg-white p-3 font-cairo text-sm outline-none focus:border-rose-300" />
        <button disabled={busy || !reportReason.trim()} onClick={async () => {
          const ok = await runAction('report_contact_issue', { reason: reportReason.trim() });
          if (ok) { showToast('تم إرسال البلاغ إلى إدارة الموقع', 'success'); setReportOpen(false); }
        }} className="mt-3 min-h-12 w-full rounded-xl bg-navy-900 font-cairo text-sm font-bold text-white disabled:opacity-50">
          إرسال البلاغ
        </button>
      </DialogShell>
    </div>
  );
}

function HeroCard({ meta, c, Icon, children }: any) {
  return (
    <div className="rounded-3xl bg-white border border-cream-200 shadow-soft overflow-hidden">
      <div className={`${c.bgSoft} border-b ${c.border} px-5 py-4 flex items-center gap-3`}>
        <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-cairo font-bold text-navy-400">المرحلة الحالية</span>
          <h2 className={`font-cairo font-extrabold text-lg ${c.text}`}>{meta.title}</h2>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DepositInline({ req, other, self, busy, runAction, showToast }: any) {
  const { user, socialSettings } = useApp();
  const currentUserId = user?.memberId || getCurrentUserId();
  const isSender = String(req.sender_id) === String(currentUserId);
  const selfPaid = isSender ? req.sender_paid : req.receiver_paid;
  const otherPaid = isSender ? req.receiver_paid : req.sender_paid;

  const isDepositAlreadyPaid = !!selfPaid;

  const totalFee = req.total_fee || TOTAL_FEE_AMOUNT;
  const depositAmount = req.deposit_fee || DEPOSIT_AMOUNT;
  const selfPaidAmount = isSender
    ? (req.sender_paid_amount !== undefined && req.sender_paid_amount !== null ? Number(req.sender_paid_amount) : (selfPaid ? depositAmount : 0))
    : (req.receiver_paid_amount !== undefined && req.receiver_paid_amount !== null ? Number(req.receiver_paid_amount) : (selfPaid ? depositAmount : 0));
  const remainingAmount = Math.max(0, totalFee - selfPaidAmount);
  const remainingAfterDeposit = Math.max(0, totalFee - (selfPaidAmount > 0 ? selfPaidAmount : depositAmount));

  const myNickname = (user as any)?.nickname || user?.name || self?.nickname || (isSender ? req.sender_nickname : req.receiver_nickname) || 'أنت';
  const otherNickname = other?.nickname || (isSender ? req.receiver_nickname : req.sender_nickname) || 'الطرف الآخر';

  const myId = currentUserId || (isSender ? req.sender_id : req.receiver_id);
  const otherId = isSender ? req.receiver_id : req.sender_id;

  const myUsername = (user as any)?.username || self?.username || (user as any)?.email || self?.email || '';
  const otherUsername = other?.username || other?.email || '';

  const [pledgedRemaining, setPledgedRemaining] = useState(
    isSender ? !!req.sender_pledged_remaining : !!req.receiver_pledged_remaining
  );
  const [pledgeError, setPledgeError] = useState(false);

  const waUrl = getWhatsAppPaymentUrl(
    req.id,
    myNickname,
    otherNickname,
    socialSettings?.whatsappNumber || '97455620331',
    depositAmount,
    myId,
    otherId,
    myUsername,
    otherUsername
  );

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    if (!pledgedRemaining) {
      e.preventDefault();
      setPledgeError(true);
      showToast?.('يرجى تأكيد التعهد بسداد باقي الأتعاب أولاً للمتابعة عبر الواتساب', 'error');
      return;
    }
    await runAction('pledge_remaining_fee');
  };

  // الحالة 1: العضو سدد العربون مسبقاً أو معفي إدارياً
  if (isDepositAlreadyPaid) {
    return (
      <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 sm:p-6 shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="font-cairo text-lg sm:text-xl font-black text-emerald-950">
            {selfPaidAmount === 0 ? 'تم الاعتماد وإعفاء العربون من الإدارة ✓' : 'عربون الجدية مسدد مسبقاً ✓'}
          </h3>
          <p className="mt-2 text-xs sm:text-sm font-cairo text-emerald-900 font-bold leading-relaxed max-w-lg mx-auto bg-emerald-100/60 p-3 rounded-2xl border border-emerald-200">
            بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية تحت إشراف المنصة.
          </p>
        </div>

        {/* ملخص الحساب المالي المباشر */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-center font-cairo">
          <div className="bg-white border border-emerald-100 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">العربون المسدد</span>
            <strong className="text-emerald-700 font-black text-base">
              {selfPaidAmount === 0 ? '0 ر.ق (معفي من الإدارة)' : `${selfPaidAmount} ر.ق`}
            </strong>
            <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">مُعتمد ومسجل بالمنصة</span>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">المتبقي عند تمام الزواج</span>
            <strong className="text-slate-800 font-black text-base">{remainingAmount} ر.ق</strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">فقط عند تسليم المهر</span>
          </div>
        </div>

        {/* حالة الطرف الآخر والتنسيق */}
        <div className="mt-4">
          {otherPaid ? (
            <div className="bg-emerald-600 text-white font-cairo font-bold py-3 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-2 shadow-sm">
              <Check className="w-4 h-4" />
              <span>أكمل الطرفان السداد أو الاعتماد، ويجري التنسيق ونقل الطلب لمرحلة تبادل وسائل التواصل والنظرة الشرعية</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 font-cairo text-xs rounded-xl p-3 text-center flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>تم اعتماد سدادك بنجاح، وبعد استكمال {otherNickname} للسداد سوف تنتقل مباشرة لمرحلة تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // الحالة 2: العضو لم يسدد العربون بعد
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-3.5 sm:p-4 shadow-sm space-y-2.5">
      {/* رأس سداد العربون المدمج */}
      <div className="flex items-center justify-between bg-amber-100/60 border border-amber-200/80 rounded-xl px-3 py-2 font-cairo">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-700 block leading-tight">عربون الجدية المبدئي</span>
            <span className="text-[10px] text-amber-800 font-bold block">طلب التوافق #{req.id} ({myNickname} ⟵ {otherNickname})</span>
          </div>
        </div>
        <div className="text-left font-black text-amber-900 text-lg leading-tight">
          {depositAmount} <span className="text-xs font-bold text-amber-800">ر.ق</span>
        </div>
      </div>

      {/* توضيح مرحلة السداد مع الرسالة المطلوبة */}
      <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-2.5 font-cairo text-xs text-amber-950 leading-snug space-y-1.5">
        <div className="flex items-start gap-1.5 bg-amber-100/70 p-2 rounded-lg border border-amber-200/80 text-amber-900 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-tight">
            بعد السداد سوف تنتقل للمرحلة التالية وهي تبادل معلومات التواصل بين الأهل للتنسيق والنظرة الشرعية.
          </p>
        </div>
        <div className="flex items-start gap-1.5 text-slate-700">
          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-tight">
            المتبقي من الأتعاب (<strong>{remainingAfterDeposit} ر.ق</strong>) لا يُدفع الآن، بل يُستحق فقط بعد تمام النصيب والزواج وتسليم المهر بتنسيق إدارة المنصة.
          </p>
        </div>
      </div>

      {/* التعهد والإقرار بسداد باقي الأتعاب عند الزواج */}
      <div className={`p-2.5 rounded-xl border transition-all ${
        pledgeError && !pledgedRemaining
          ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200'
          : pledgedRemaining
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={pledgedRemaining}
            onChange={(e) => {
              setPledgedRemaining(e.target.checked);
              if (e.target.checked) setPledgeError(false);
            }}
            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5 cursor-pointer accent-amber-600 flex-shrink-0"
          />
          <span className="font-cairo text-[11px] sm:text-xs text-slate-800 leading-snug">
            <strong>أتعهد شرعاً ونظاماً:</strong> بسداد باقي أتعاب المنصة ({remainingAfterDeposit} ر.ق) فور تمام النصيب وعقد القران وتسليم المهر بتنسيق إدارة المنصة.
          </span>
        </label>
        {pledgeError && !pledgedRemaining && (
          <p className="text-[10px] text-rose-600 font-cairo font-bold mt-1 pr-6">
            ⚠️ يرجى التأشير على المربع للموافقة على التعهد قبل المتابعة للدفع عبر الواتساب.
          </p>
        )}
      </div>

      {/* زر الواتساب المباشر */}
      <div>
        <a
          href={waUrl}
          onClick={handleWhatsAppClick}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-cairo font-black py-2.5 px-3 rounded-xl shadow-xs hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>ادفع عبر الواتساب برقم الطلب (#{req.id})</span>
        </a>
      </div>
    </div>
  );
}

function CoordinationPanel({ req, other, busy, runAction, showToast, meta, c, Icon }: any) {
  const { user, socialSettings } = useApp();
  const currentUserId = user?.memberId || getCurrentUserId();
  const isSender = req.sender_id === currentUserId;
  const totalFee = req.total_fee || TOTAL_FEE_AMOUNT;
  const selfPaidAmount = isSender ? (req.sender_paid_amount ?? (req.sender_paid ? DEPOSIT_AMOUNT : 0)) : (req.receiver_paid_amount ?? (req.receiver_paid ? DEPOSIT_AMOUNT : 0));
  const remainingAmount = Math.max(0, totalFee - selfPaidAmount);

  const cleanNumber = socialSettings?.whatsappNumber?.replace(/[+\s-]/g, '') || '97455620331';
  const coordWaUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`السلام عليكم ورحمة الله، بخصوص طلب التوافق رقم #${req.id} (مرحلة التنسيق بين الأطراف): أود متابعة التنسيق والنظرة الشرعية مع الإدارة.`)}`;

  return (
    <HeroCard meta={meta} c={c} Icon={Icon}>
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-cairo font-bold">
          <CalendarClock className="w-3.5 h-3.5" />
          <span>تحت إشراف وتنسيق إدارة المنصة</span>
        </div>

        <h3 className="font-cairo font-black text-xl text-navy-900">
          جاري التنسيق والتواصل بين الأطراف
        </h3>

        <p className="text-xs sm:text-sm text-navy-600 font-cairo leading-relaxed max-w-md mx-auto">
          يقوم فريق إدارة المنصة بالتنسيق المباشر والسري بين الطرفين عبر الواتساب لترتيب الخطوات والنظرة الشرعية بما يحفظ الخصوصية والحرمة الأسرية.
        </p>

        {/* بطاقة الحساب المالي الشفاف */}
        <div className="bg-[#FAF9F5] border border-amber-200/60 rounded-2xl p-4 text-right space-y-2.5 font-cairo">
          <p className="text-xs font-bold text-amber-900 border-b border-amber-200/40 pb-1.5">
            📊 الملخص المالي للطلب:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">إجمالي الأتعاب</span>
              <strong className="text-navy-900 font-bold">{totalFee} ر.ق</strong>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
              <span className="text-[10px] text-emerald-700 block">المسدد (عربون)</span>
              <strong className="text-emerald-800 font-bold">{selfPaidAmount} ر.ق</strong>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
              <span className="text-[10px] text-amber-700 block">المتبقي للأتعاب</span>
              <strong className="text-amber-800 font-bold">{remainingAmount} ر.ق</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal pt-1">
            * يُستحق سداد باقي الأتعاب ({remainingAmount} ر.ق) بعد تمام النصيب وتسليم المهر بتنسيق إدارة المنصة.
          </p>
        </div>

        {/* زر محادثة التنسيق مع الإدارة */}
        <a
          href={coordWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white font-cairo font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>متابعة التنسيق مع الإدارة عبر الواتساب</span>
        </a>
      </div>
    </HeroCard>
  );
}

// لوحة العربون المستقلة (لمرحلة seriousness)
function DepositPanel({ req, isSender, busy, runAction, showToast }: any) {
  const selfPaid = isSender ? req.sender_paid : req.receiver_paid;
  const otherPaid = isSender ? req.receiver_paid : req.sender_paid;
  const meta = STAGE_META.seriousness;
  const c = ACCENT_CLASSES[meta.accent];
  return (
    <HeroCard meta={meta} c={c} Icon={meta.icon}>
      {!selfPaid && <DepositInline req={req} busy={busy} runAction={runAction} showToast={showToast} />}
      {selfPaid && !otherPaid && <WaitingOther />}
    </HeroCard>
  );
}

// زر تسجيل النتيجة
function RecordResultButton({ req, busy, runAction }: any) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<'success' | 'failed'>('success');
  const [note, setNote] = useState('');
  return (
    <>
      <button onClick={() => setOpen(true)} disabled={busy}
        className="w-full mt-4 bg-navy-900 text-white font-cairo font-bold py-3.5 rounded-2xl hover:bg-navy-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        <Eye className="w-4 h-4" /> تسجيل نتيجة النظرة الشرعية
      </button>
      <DialogShell open={open} onClose={() => setOpen(false)} title="نتيجة النظرة الشرعية">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => setChoice('success')}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${choice === 'success' ? 'border-emerald-400 bg-emerald-50' : 'border-cream-200 bg-white'}`}>
            <span className="text-2xl block mb-1">💚</span>
            <span className="font-cairo font-extrabold text-xs text-emerald-700 block">تم القبول بفضل الله</span>
          </button>
          <button onClick={() => setChoice('failed')}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${choice === 'failed' ? 'border-amber-400 bg-amber-50/50' : 'border-cream-200 bg-white'}`}>
            <span className="text-2xl block mb-1">🕊️</span>
            <span className="font-cairo font-extrabold text-xs text-amber-800 block">لم يُكتب النصيب</span>
          </button>
        </div>

        {choice === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-3 text-right space-y-1.5 shadow-sm animate-fade-in">
            <p className="text-xs font-cairo font-extrabold text-emerald-800">تم القبول بفضل الله</p>
            <p className="text-[11px] font-cairo text-navy-600 leading-relaxed">
              الحمد لله الذي بنعمته تتم الصالحات. نسأل الله أن يبارك لكما ويتمم على خير.
            </p>
          </div>
        )}

        {choice === 'failed' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 text-right text-[11px] font-cairo text-amber-800 leading-relaxed shadow-sm">
            <strong>لم يُكتب النصيب:</strong> الزواج قسمة ونصيب، وسيُنهي اختيارك الرحلة باحترام وخصوصية.
          </div>
        )}

        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder={choice === 'failed' ? 'اكتب سبب الاعتذار باحترام (إلزامي)' : 'ملاحظة اختيارية'}
          className="w-full bg-white border border-cream-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-gold-200" />
        {choice === 'failed' && !note.trim() && (
          <p className="text-[11px] text-rose-500 font-cairo mt-1">يرجى توضيح سبب الاعتذار لتسجيل نتيجة الرحلة.</p>
        )}
        <button
          disabled={choice === 'failed' && !note.trim()}
          onClick={async () => { await runAction('record_result', { result: choice, note }); setOpen(false); }}
          className="w-full mt-4 bg-navy-900 text-white font-cairo font-bold py-3.5 rounded-2xl disabled:opacity-50 hover:bg-navy-800 transition-colors">
          {choice === 'success' ? 'تأكيد: تم القبول بفضل الله' : 'تأكيد: لم يُكتب النصيب'}
        </button>
      </DialogShell>
    </>
  );
}

// ============================================================
//  لوحة القرار (المستقبِل: قبول/إلغاء)
// ============================================================
function DecisionPanel({ req, other, busy, runAction, showToast }: any) {
  const [cancelOpen, setCancelOpen] = useState(false);
  return (
    <div className="rounded-3xl bg-white border border-cream-200 shadow-soft overflow-hidden">
      <div className="bg-gold-300/15 border-b border-gold-200 px-5 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center text-navy-900">
          <Heart className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-cairo font-bold text-navy-400">🔔 طلب توافق وارد</span>
          <h2 className="font-cairo font-extrabold text-lg text-navy-800">الرد على طلب {other?.nickname}</h2>
        </div>
      </div>
      <div className="p-5">
        {req.message && (
          <p className="text-sm text-navy-600 font-cairo bg-cream-50 rounded-2xl p-3 mb-4 border border-cream-100 leading-relaxed">"{req.message}"</p>
        )}
        <p className="text-xs text-navy-500 font-cairo mb-3 text-center">
          اقرأ الملف الشخصي جيداً ثم اتخذ قرارك. القبول ينقلكما لمرحلة تأكيد الجدية.
        </p>
        <button onClick={async () => { const ok = await runAction('accept'); if (ok) showToast('🎉 تم قبول الطلب!'); }} disabled={busy}
          className="w-full bg-emerald-500 text-white font-cairo font-extrabold py-3.5 rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />} قبول وبدء رحلة التوافق للزواج
        </button>
        <button onClick={() => setCancelOpen(true)}
          className="w-full mt-2 bg-cream-100 text-navy-600 font-cairo font-bold py-3 rounded-2xl hover:bg-cream-200 transition-all flex items-center justify-center gap-2">
          <X className="w-4 h-4" /> الاعتذار بلطف
        </button>
      </div>
      <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} busy={busy} reasons={DECLINE_REASONS} title="الاعتذار عن الطلب"
        onConfirm={async (reason: string) => { const ok = await runAction('decline', { reason }); setCancelOpen(false); if (ok) showToast('تم الاعتذار بلطف', 'info'); }} />
    </div>
  );
}

// ============================================================
//  حوار الإلغاء/الاعتذار مع ذكر السبب
// ============================================================
function CancelDialog({ open, onClose, onConfirm, busy, reasons = CANCEL_REASONS, title = 'إلغاء الطلب' }: any) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  const finalReason = reason === reasons[reasons.length - 1] ? custom : reason;
  return (
    <DialogShell open={open} onClose={onClose} title={title}>
      <p className="text-sm text-navy-600 font-cairo mb-3">يرجى ذكر السبب:</p>
      <div className="space-y-2">
        {reasons.map((r: string) => (
          <label key={r} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${reason === r ? 'border-rose-300 bg-rose-50' : 'border-cream-200'}`}>
            <input type="radio" checked={reason === r} onChange={() => setReason(r)} className="accent-rose-500" />
            <span className="text-sm font-cairo text-navy-700">{r}</span>
          </label>
        ))}
      </div>
      {reason === reasons[reasons.length - 1] && (
        <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={3} placeholder="اكتب التفاصيل..."
          className="w-full mt-3 bg-white border border-cream-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-rose-200" />
      )}
      <button onClick={() => finalReason.trim() && onConfirm(finalReason)} disabled={busy || !finalReason.trim()}
        className="w-full mt-4 bg-rose-deep text-white font-cairo font-bold py-3.5 rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} تأكيد
      </button>
    </DialogShell>
  );
}

// قشرة حوار بسيطة
function DialogShell({ open, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[97] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="relative w-full max-w-md bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="sticky top-0 bg-cream-50 z-10 flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h3 className="font-cairo font-bold text-lg text-navy-900">{title}</h3>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-navy-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
//  الطبقة 3 — خريطة الرحلة العمودية (كل المراحل)
// ============================================================
function VerticalJourney({ req, stage, events }: { req: any; stage: JourneyState; events: RequestEvent[] }) {
  const [infoFor, setInfoFor] = useState<JourneyState | null>(null);
  const currentIdx = isTerminal(stage) ? 99 : STAGE_INDEX[stage as keyof typeof STAGE_INDEX];

  // For terminal stages, determine how far the journey went before being terminated:
  const lastActiveIdx = useMemo(() => {
    if (!isTerminal(stage)) {
      return STAGE_INDEX[stage as keyof typeof STAGE_INDEX] ?? 0;
    }
    let maxIdx = 0;
    // 1. Check events
    if (events && events.length > 0) {
      events.forEach((e) => {
        const evStage = mapEventToStage(e.type);
        const evIdx = STAGE_INDEX[evStage as keyof typeof STAGE_INDEX];
        if (evIdx !== undefined && evIdx > maxIdx) {
          maxIdx = evIdx;
        }
      });
    }
    // 2. Check request properties to fall back
    if (req) {
      if (req.final_outcome === 'success' || req.journey_stage === 'completed') {
        maxIdx = Math.max(maxIdx, 3);
      } else if (req.journey_stage === 'coordination' || (req.sender_paid && req.receiver_paid)) {
        maxIdx = Math.max(maxIdx, 2);
      } else if (req.journey_stage === 'accepted' || events.some(e => e.type === 'accept' || e.type === 'inquiry_buy')) {
        maxIdx = Math.max(maxIdx, 1);
      }
    }
    return maxIdx;
  }, [stage, events, req]);

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-5">
      <div className="relative">
        {JOURNEY_STAGES.map((sKey, idx) => {
          const meta = STAGE_META[sKey];
          const c = ACCENT_CLASSES[meta.accent];
          const Icon = meta.icon;
          const isDone = isTerminal(stage)
            ? idx < lastActiveIdx
            : idx < currentIdx;
          const isCurrent = isTerminal(stage)
            ? idx === lastActiveIdx
            : idx === currentIdx;
          const stageEvents = events.filter((e) => mapEventToStage(e.type) === sKey);

          return (
            <div key={sKey} className="flex gap-4 pb-5 last:pb-0 relative">
              {/* الخط العمودي */}
              {idx < JOURNEY_STAGES.length - 1 && (
                <div className={`absolute right-[18px] top-10 bottom-0 w-0.5 ${isDone ? 'bg-emerald-300' : 'bg-cream-200'}`} />
              )}
              {/* الأيقونة */}
              <button onClick={() => setInfoFor(sKey)} className="relative z-10 flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? `${c.bg} text-white ring-4 ${c.ring}` : 'bg-cream-100 text-navy-300'}`}>
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
              </button>
              {/* المحتوى */}
              <div className="flex-1 pt-1">
                <button onClick={() => setInfoFor(sKey)} className="flex items-center gap-1.5 text-right">
                  <span className={`font-cairo font-bold ${isDone ? 'text-emerald-700' : isCurrent ? c.text : 'text-navy-400'}`}>
                    {idx + 1}. {meta.title}
                  </span>
                  {isCurrent && <span className={`text-[9px] font-cairo font-bold px-1.5 py-0.5 rounded-full ${c.bgSoft} ${c.text}`}>الآن</span>}
                  <Info className="w-3 h-3 text-navy-300" />
                </button>
                <p className="text-xs text-navy-500 font-cairo mt-0.5 leading-relaxed">{meta.whereYouAre}</p>
                {/* أحداث هذه المرحلة */}
                {stageEvents.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {stageEvents.map((ev, evIdx) => (
                      <div key={(ev?.id !== undefined && ev?.id !== null && !Number.isNaN(Number(ev.id))) ? `j-ev-${ev.id}-${evIdx}` : `j-ev-idx-${evIdx}`} className="flex items-center gap-1.5 text-[10px] font-cairo text-navy-400">
                        <span className="w-1 h-1 rounded-full bg-gold-400" />{ev.note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* بطاقة شرح المرحلة */}
      <AnimatePresence>
        {infoFor && (
          <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setInfoFor(null)} />
            <StageInfo stage={infoFor} onClose={() => setInfoFor(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageInfo({ stage, onClose }: { stage: JourneyState; onClose: () => void }) {
  const meta = STAGE_META[stage];
  const c = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;
  const rows = [
    { label: 'أين أنت الآن', text: meta.whereYouAre, icon: '📍' },
    { label: 'ماذا تفعل', text: meta.whatToDo, icon: '✅' },
    { label: 'المرحلة التالية', text: meta.whatsNext, icon: '➡️' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className="relative w-full max-w-md bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" dir="rtl">
      <div className={`${c.bgSoft} border-b ${c.border} px-6 py-5 relative`}>
        <button onClick={onClose} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-navy-600"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center text-white`}><Icon className="w-6 h-6" /></div>
          <div>
            {meta.step > 0 && <span className="text-[11px] font-cairo font-bold text-navy-400">المرحلة {meta.step} من 6</span>}
            <h3 className={`font-cairo font-extrabold text-xl ${c.text}`}>{meta.title}</h3>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="bg-white rounded-2xl border border-cream-200 p-4">
            <div className="flex items-center gap-2 mb-1"><span>{r.icon}</span><span className="text-xs font-cairo font-extrabold text-navy-800">{r.label}</span></div>
            <p className="text-sm text-navy-600 font-cairo leading-relaxed pr-7">{r.text}</p>
          </div>
        ))}
        <button onClick={onClose} className={`w-full ${c.bg} text-white font-cairo font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2`}>
          فهمت <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ربط نوع الحدث بالمرحلة لعرضه في الخريطة العمودية
function mapEventToStage(type: string): JourneyState {
  switch (type) {
    case 'sent': return 'sent';
    case 'accept': return 'accepted';
    case 'inquiry_buy': return 'accepted';
    case 'pay_deposit':
    case 'payment':
    case 'pledge_remaining_fee': return 'accepted';
    case 'coordination':
    case 'sharia_viewing':
    case 'meeting': return 'coordination';
    case 'completed': return 'completed';
    case 'decline': return 'declined';
    case 'cancel': return 'cancelled';
    default: return 'sent';
  }
}

// ============================================================
//  #7 معاينة المرحلة القادمة — يقلّل قلق المجهول
// ============================================================
function NextStepHint({ stage }: { stage: JourneyState }) {
  if (isTerminal(stage) || stage === 'completed') return null;
  const idx = STAGE_INDEX[stage as keyof typeof STAGE_INDEX];
  const nextKey = JOURNEY_STAGES[idx + 1];
  if (!nextKey) return null;
  const next = STAGE_META[nextKey];
  const c = ACCENT_CLASSES[next.accent];
  const NextIcon = next.icon;
  return (
    <div className="mt-3 bg-white rounded-2xl border border-cream-200 shadow-soft px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${c.bgSoft} flex items-center justify-center ${c.text} flex-shrink-0`}>
        <NextIcon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-cairo font-bold text-navy-400">ماذا ينتظرني بعد ذلك؟</span>
        <p className="font-cairo font-bold text-sm text-navy-700 truncate">
          الخطوة القادمة: <span className={c.text}>{next.title}</span>
        </p>
      </div>
      <ChevronLeft className="w-4 h-4 text-navy-300 flex-shrink-0" />
    </div>
  );
}

// ============================================================
//  #11 حالة "بانتظار الطرف الآخر" — متحركة لطيفة
// ============================================================
function WaitingOther() {
  return (
          <div className="bg-gradient-to-br from-blue-50 to-cream-50 border border-blue-100 rounded-2xl p-5 text-center">
          <div className="relative w-14 h-14 mx-auto mb-3">
            <motion.span
              className="absolute inset-0 rounded-full bg-blue-200/50"
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-blue-200/40"
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="font-cairo font-extrabold text-emerald-600">أكملت سدادك ✓</p>
          <p className="text-sm font-cairo text-navy-500 mt-1">بانتظار سداد الطرف الآخر لبدء التواصل</p>
          <p className="text-[11px] font-cairo text-blue-500 mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> سنُشعرك فور سداده
          </p>
        </div>
  );
}
