import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Send, Inbox, Archive, Search, X, Loader2, AlertCircle,
  ShieldCheck, CalendarClock, MapPin, BadgeCheck, ChevronLeft, Info, Sparkles, Ban,
  Zap, CreditCard, UserCheck, Compass, Mail, Clock, CheckSquare, Square, Trash2, CheckCircle2, ListChecks, MessageCircle,
  RotateCcw, EyeOff,
} from 'lucide-react';
import { getAvatar, getGenderColors } from '../lib/types';
import {
  useInterestRequests, fetchRequestEvents, getCurrentUserId,
  isRequestUnseen, markAllRequestsSeen, getUnseenRequestsCount,
  type ApiRequest, type RequestEvent,
} from '../lib/useInterestRequests';
import { useApp } from '../lib/AppContext';
import { dataService } from '../lib/data/DataService';
import {
  STAGE_META, ACCENT_CLASSES, getPrimaryAction, isTerminal,
  requiresMyAction, actionUrgency,
  getJourneyStage, getJourneyStatusSummary,
  getWhatsAppPaymentUrl, DEPOSIT_AMOUNT, TOTAL_FEE_AMOUNT,
  DECLINE_REASONS, CANCEL_REASONS, type JourneyState, type RequestRole,
} from '../lib/journey';
import { useSettings } from '../lib/useSettings';
import Modal from '../components/ui/Modal';
import RequestStatusPanel from '../components/requests/RequestStatusPanel';

type Tab = 'incoming' | 'active' | 'completed' | 'archive';

function stageOf(r: ApiRequest, userId: string): JourneyState {
  return getJourneyStage(r, userId);
}

function canRequestBeRestored(req: ApiRequest, activeId: string, isOtherUnavailable?: boolean): boolean {
  if (isOtherUnavailable) return false;
  const isSender = req.sender_id === activeId;
  const stage = req.journey_stage;

  // إذا كان المستخدم هو المرسل والطرف المستقبِل هو من اعتذر: غير قابل للاستعادة
  if (isSender && stage === 'declined') {
    return false;
  }

  // إذا كان المستخدم هو المستقبِل والطرف المرسِل ألغى طلبه: غير قابل للاستعادة
  if (!isSender && stage === 'cancelled') {
    return false;
  }

  // في جميع الحالات الأخرى (أرشفة يدوية، أو اعتذار/إلغاء قام به المستخدم بنفسه): قابل للاستعادة
  return true;
}

export default function InterestRequests() {
  const { user } = useApp();
  const { settings } = useSettings();
  const activeId = user?.memberId || getCurrentUserId();
  const {
    requests, loading, error, actionLoading,
    getMember, runAction, refresh,
  } = useInterestRequests(activeId);

  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('incoming');
  const [query, setQuery] = useState('');
  const [subFilter, setSubFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [initialUnseenCount, setInitialUnseenCount] = useState<number>(0);
  const [initialUnseenIds, setInitialUnseenIds] = useState<number[]>([]);
  const [hasEnteredPage, setHasEnteredPage] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  // بمجرد فتح صفحة الطلبات: نقوم بحصر الطلبات الجديدة ثم تفريغ الإشارة لتختفي فوراً من القائمة السفلية
  useEffect(() => {
    if (!activeId) return;

    if (!hasEnteredPage) {
      // قراءة العداد الحالي قبل تفريغه
      const unread = getUnseenRequestsCount(activeId);
      if (unread > 0) {
        setInitialUnseenCount(unread);
      }

      // تعليم جميع الطلبات كمشاهدة فوراً لتختفي الإشارة من القائمة السفلية
      markAllRequestsSeen(activeId);
      setHasEnteredPage(true);
    }
  }, [activeId, hasEnteredPage]);

  // عند اكتمال جلب الطلبات، نحدد المعرفات التي كانت جديدة لعرض شارة أنيقة داخل البطاقة
  useEffect(() => {
    if (!activeId || requests.length === 0) return;
    if (initialUnseenCount > 0 && initialUnseenIds.length === 0) {
      const unseenList = requests
        .filter((r) => isRequestUnseen(r.id, r.updated_at, activeId))
        .map((r) => r.id);
      if (unseenList.length > 0) {
        setInitialUnseenIds(unseenList);
      }
      // تأكيد التعليم
      markAllRequestsSeen(activeId);
    }
  }, [activeId, requests, initialUnseenCount, initialUnseenIds.length]);

  const [declineModal, setDeclineModal] = useState<ApiRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineCustom, setDeclineCustom] = useState('');
  const [payModal, setPayModal] = useState<ApiRequest | null>(null);
  const [pledge, setPledge] = useState(false);
  const [resultModal, setResultModal] = useState<ApiRequest | null>(null);
  const [resultChoice, setResultChoice] = useState<'success' | 'failed'>('success');
  const [resultNote, setResultNote] = useState('');
  const [coordModal, setCoordModal] = useState<ApiRequest | null>(null);
  const [cancelModal, setCancelModal] = useState<ApiRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelCustom, setCancelCustom] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [archiveNoticeModal, setArchiveNoticeModal] = useState<ApiRequest | null>(null);
  const [dismissedArchiveNote, setDismissedArchiveNote] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hide_archive_note') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissArchiveNote = () => {
    setDismissedArchiveNote(true);
    try {
      localStorage.setItem('hide_archive_note', 'true');
    } catch {}
  };

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkCancel, setConfirmBulkCancel] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState('');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  const needsAction = (r: ApiRequest): boolean => {
    const stage = stageOf(r, activeId);
    const isSender = r.sender_id === activeId;
    const role: RequestRole = isSender ? 'sender' : 'receiver';
    const selfPaid = isSender ? r.sender_paid : r.receiver_paid;
    const otherPaid = isSender ? r.receiver_paid : r.sender_paid;
    return requiresMyAction(stage, role, { selfPaid, otherPaid });
  };

  const isArchived = (r: ApiRequest, userId: string): boolean => {
    return Array.isArray(r.archived_by) && r.archived_by.includes(userId);
  };

  const isHidden = (r: ApiRequest, userId: string): boolean => {
    return Array.isArray(r.hidden_by) && r.hidden_by.includes(userId);
  };

  const buckets = useMemo(() => {
    const incoming: ApiRequest[] = [];
    const active: ApiRequest[] = [];
    const completed: ApiRequest[] = [];
    const archive: ApiRequest[] = [];

    for (const r of requests) {
      if (isHidden(r, activeId)) continue;
      const stage = stageOf(r, activeId);
      const userArchived = isArchived(r, activeId);

      // إذا كان منتهياً بالاعتذار/الإلغاء أو مؤرشفاً يدوياً يذهب للأرشيف
      if (isTerminal(stage) || userArchived) {
        archive.push(r);
        continue;
      }

      // إذا كان مكتملاً بنجاح (عقد القِران)
      if (stage === 'completed') {
        completed.push(r);
        continue;
      }

      // إذا كان يحتاج إجراء عاجل
      if (needsAction(r)) {
        incoming.push(r);
        continue;
      }

      // قيد المتابعة
      active.push(r);
    }
    return { incoming, active, completed, archive };
  }, [requests, activeId]);

  useEffect(() => {
    if (!loading && tab === 'incoming' && buckets.incoming.length === 0 && buckets.active.length > 0) {
      setTab('active');
    }
  }, [loading, tab, buckets]);

  const list = useMemo(() => {
    let arr = buckets[tab] || [];
    if (subFilter !== 'all') {
      arr = arr.filter((r) => subFilter === 'sent' ? r.sender_id === activeId : r.receiver_id === activeId);
    }
    if (query.trim()) {
      const q = query.trim();
      arr = arr.filter((r) => {
        const other = r.sender_id === activeId ? r.receiver_id : r.sender_id;
        const m = getMember(other);
        return m?.nickname.includes(q) || m?.city.includes(q);
      });
    }
    return [...arr].sort((a, b) => {
      if (tab === 'archive') {
        const aOther = a.sender_id === activeId ? a.receiver_id : a.sender_id;
        const bOther = b.sender_id === activeId ? b.receiver_id : b.sender_id;
        const aMem = getMember(aOther);
        const bMem = getMember(bOther);
        const aUnavailable = !aMem || aMem.status === 'deleted' || aMem.deleted === true || aMem.status === 'banned' || aMem.status === 'suspended';
        const bUnavailable = !bMem || bMem.status === 'deleted' || bMem.deleted === true || bMem.status === 'banned' || bMem.status === 'suspended';

        const aCan = canRequestBeRestored(a, activeId, aUnavailable) ? 1 : 0;
        const bCan = canRequestBeRestored(b, activeId, bUnavailable) ? 1 : 0;
        if (aCan !== bCan) {
          return bCan - aCan; // 1 (restorable) first, 0 (non-restorable) last
        }
      } else {
        const aAct = needsAction(a) ? 1 : 0;
        const bAct = needsAction(b) ? 1 : 0;
        if (aAct !== bAct) return bAct - aAct;
      }
      const at = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bt - at;
    });
  }, [tab, buckets, query, subFilter, getMember, activeId]);

  const stats = useMemo(() => {
    let respond = 0, pay = 0, active = 0;
    for (const r of requests) {
      const stage = stageOf(r, activeId);
      if (isTerminal(stage) || stage === 'completed') continue;
      const isSender = r.sender_id === activeId;
      const role: RequestRole = isSender ? 'sender' : 'receiver';
      const selfPaid = isSender ? r.sender_paid : r.receiver_paid;
      const otherPaid = isSender ? r.receiver_paid : r.sender_paid;
      const urgency = actionUrgency(stage, role, { selfPaid, otherPaid });
      if (urgency === 'respond') respond++;
      else if (urgency === 'pay') pay++;
      active++;
    }
    return { respond, pay, active };
  }, [requests, activeId]);

  const onAccept = async (req: ApiRequest) => {
    const res = await runAction(req.id, 'accept');
    if (res.ok) {
      showToast('تم قبول طلب التوافق بنجاح، جاري نقلك لرحلة التوافق...', 'success');
      navigate(`/journey/${req.id}`);
    } else {
      showToast(res.error || 'تعذّر القبول', 'error');
    }
  };

  const onDecline = async () => {
    if (!declineModal) return;
    const reason = declineReason === DECLINE_REASONS[DECLINE_REASONS.length - 1] ? declineCustom : declineReason;
    if (!reason.trim()) { showToast('يرجى اختيار سبب الاعتذار', 'error'); return; }
    const res = await runAction(declineModal.id, 'decline', { reason });
    await dataService.db.archiveRequest(declineModal.id, activeId);
    setDeclineModal(null); setDeclineReason(''); setDeclineCustom('');
    showToast(res.ok ? 'تم الاعتذار عن الطلب ونُقل تلقائياً إلى تبويب المؤرشفة 📁' : (res.error || 'خطأ'), res.ok ? 'info' : 'error');
    refresh();
  };

  const onPay = async () => {
    if (!payModal || !pledge) { showToast('يرجى الموافقة على عهد الجدية', 'error'); return; }
    const requestId = payModal.id;
    setPayModal(null); setPledge(false);
    navigate(`/journey/${requestId}?tab=deposit`);
  };

  const onRecordResult = async () => {
    if (!resultModal) return;
    const res = await runAction(resultModal.id, 'record_result', { result: resultChoice, note: resultNote });
    setResultModal(null); setResultNote('');
    showToast(res.ok ? 'تم حفظ نتيجة النظرة الشرعية' : (res.error || 'خطأ'), res.ok ? 'success' : 'error');
  };

  const onAdvanceIntro = async (req: ApiRequest) => {
    const res = await runAction(req.id, 'confirm_advance', { nextStage: 'sharia_viewing' });
    setCoordModal(null);
    showToast(
      res.ok ? 'تم تسجيل تأكيدك. تنتقل الرحلة بعد تأكيد الطرف الآخر.' : (res.error || 'خطأ'),
      res.ok ? 'success' : 'error',
    );
  };

  const onCancel = async () => {
    if (!cancelModal) return;
    const reason = cancelReason === CANCEL_REASONS[CANCEL_REASONS.length - 1] ? cancelCustom : cancelReason;
    if (!reason.trim()) { showToast('يرجى اختيار سبب الإلغاء', 'error'); return; }
    const res = await runAction(cancelModal.id, 'cancel', { reason });
    await dataService.db.archiveRequest(cancelModal.id, activeId);
    setCancelModal(null); setCancelReason(''); setCancelCustom('');
    showToast(res.ok ? 'تم إلغاء الطلب ونُقل إلى تبويب المؤرشفة 📁' : (res.error || 'خطأ'), res.ok ? 'info' : 'error');
    refresh();
  };

  const onArchiveSingle = async (req: ApiRequest) => {
    let seen = false;
    try {
      seen = localStorage.getItem('seen_archive_first_time') === 'true';
    } catch {}

    if (!seen) {
      setArchiveNoticeModal(req);
      return;
    }

    await dataService.db.archiveRequest(req.id, activeId);
    showToast('تم نقل الطلب إلى تبويب المؤرشفة 📁', 'info');
    refresh();
  };

  const confirmArchiveNotice = async () => {
    if (!archiveNoticeModal) return;
    try {
      localStorage.setItem('seen_archive_first_time', 'true');
    } catch {}
    const req = archiveNoticeModal;
    setArchiveNoticeModal(null);
    await dataService.db.archiveRequest(req.id, activeId);
    showToast('تم نقل الطلب إلى تبويب المؤرشفة 📁 ويمكنك استعادته في أي وقت', 'info');
    refresh();
  };

  const onUnarchiveSingle = async (req: ApiRequest) => {
    const isSender = req.sender_id === activeId;
    const otherId = isSender ? req.receiver_id : req.sender_id;
    const otherMem = getMember(otherId);
    const isOtherUnavailable = !otherMem || otherMem.status === 'deleted' || otherMem.deleted === true || otherMem.status === 'banned' || otherMem.status === 'suspended';

    if (!canRequestBeRestored(req, activeId, isOtherUnavailable)) {
      showToast('لا يمكن استعادة هذا الطلب لأن الطرف الآخر قد اعتذر أو قام بالإلغاء', 'error');
      return;
    }

    const stage = stageOf(req, activeId);
    if (stage === 'declined' || stage === 'cancelled') {
      await runAction(req.id, 'reactivate', { stage: 'sent', note: 'استعادة الطلب بواسطة العضو' });
    }
    await dataService.db.unarchiveRequest(req.id, activeId);
    showToast('تمت استعادة الطلب بنجاح إلى القائمة الفعّالة ↺', 'success');
    refresh();
  };

  const onHideSingle = async (req: ApiRequest) => {
    await dataService.db.hideRequestFromUser(req.id, activeId);
    showToast('تم إخفاء الطلب من الأرشيف بنجاح', 'info');
    refresh();
  };

  const toggleSelectAll = () => {
    const currentTabIds = list.map((r) => r.id);
    const allSelected = currentTabIds.length > 0 && currentTabIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentTabIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...currentTabIds]));
      setSelectedIds(combined);
    }
  };

  const toggleSelectReq = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await dataService.db.archiveRequest(id, activeId);
    }
    const count = selectedIds.length;
    setSelectedIds([]);
    showToast(`تم نقل ${count} من الطلبات إلى المؤرشفة 📁`, 'info');
    refresh();
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    let restoredCount = 0;
    let skippedCount = 0;
    for (const id of selectedIds) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        const isSender = req.sender_id === activeId;
        const otherId = isSender ? req.receiver_id : req.sender_id;
        const otherMem = getMember(otherId);
        const isOtherUnavailable = !otherMem || otherMem.status === 'deleted' || otherMem.deleted === true || otherMem.status === 'banned' || otherMem.status === 'suspended';

        if (!canRequestBeRestored(req, activeId, isOtherUnavailable)) {
          skippedCount++;
        } else {
          const stage = stageOf(req, activeId);
          if (stage === 'declined' || stage === 'cancelled') {
            await runAction(req.id, 'reactivate', { stage: 'sent', note: 'استعادة الطلب بواسطة العضو' });
          }
          await dataService.db.unarchiveRequest(req.id, activeId);
          restoredCount++;
        }
      }
    }
    setSelectedIds([]);
    if (skippedCount > 0 && restoredCount === 0) {
      showToast('الطلبات المحددة غير قابلة للاستعادة (اعتذر أو ألغى الطرف الآخر)', 'error');
    } else if (skippedCount > 0) {
      showToast(`تمت استعادة ${restoredCount} طلب، وتخطي ${skippedCount} طلبات غير قابلة للاستعادة`, 'info');
    } else {
      showToast(`تمت استعادة ${restoredCount} من الطلبات بنجاح إلى القائمة الفعّالة ↺`, 'success');
    }
    refresh();
  };

  const handleBulkHide = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await dataService.db.hideRequestFromUser(id, activeId);
    }
    const count = selectedIds.length;
    setSelectedIds([]);
    showToast(`تم إخفاء ${count} من الطلبات من الأرشيف بنجاح 👁️`, 'info');
    refresh();
  };

  const handleBulkCancel = async () => {
    if (selectedIds.length === 0) return;
    const reason = bulkCancelReason.trim() || 'إلغاء جماعي من رحلات التوافق';
    for (const id of selectedIds) {
      await runAction(id, 'cancel', { reason });
      await dataService.db.archiveRequest(id, activeId);
    }
    const count = selectedIds.length;
    setSelectedIds([]);
    setConfirmBulkCancel(false);
    setBulkCancelReason('');
    showToast(`تم إلغاء ${count} من الرحلات ونقلها للمؤرشفة`, 'info');
    refresh();
  };

  const handleBulkMarkSeen = () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      dataService.db.markRequestSeen(id);
    }
    showToast(`تم تعليم ${selectedIds.length} من الرحلات كـ "تمت مشاهدتها" ✓`);
    refresh();
  };

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'incoming', label: 'تحتاج إجراء منك', icon: Inbox, count: buckets.incoming.length },
    { key: 'active', label: 'قيد المتابعة', icon: Heart, count: buckets.active.length },
    { key: 'completed', label: 'المكتملة بالزواج', icon: Sparkles, count: buckets.completed.length },
    { key: 'archive', label: 'المؤرشفة', icon: Archive, count: buckets.archive.length },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-neutral-900 font-sans selection:bg-[#7B113A]/10 selection:text-[#7B113A]" dir="rtl">
      {/* Sleek compact header distributed right and left */}
      <div className="relative bg-gradient-to-l from-[#680E30] via-[#7B113A] to-[#8B1D41] text-white overflow-hidden py-4 sm:py-5 border-b border-[#D4AF37]/20 shadow-md">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-3xl mx-auto px-4 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#E5C158] to-[#F3DB83] flex items-center justify-center text-[#680E30] shadow-sm flex-shrink-0 border border-white/30">
              <Heart className="w-5 h-5 text-[#7B113A] fill-[#7B113A]/20 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-cairo font-extrabold text-base sm:text-xl text-white tracking-tight leading-tight">طلباتي</h1>
              <p className="text-white/80 text-[11px] sm:text-xs font-cairo">
                {(() => {
                  const me = getMember(activeId);
                  return me
                    ? <>مرحباً <span className="text-[#F3DB83] font-bold">{me.nickname}</span> · تابع طلباتك</>
                    : 'تابع طلباتك والتحديثات مباشرة';
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F3DB83]" />
              <span className="text-[11px] font-cairo font-bold text-white hidden sm:inline">وساطة قطرية آمنة</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 -mt-3 pb-20 relative z-20">
        <JourneyLegend />

        <div className="flex gap-1.5 bg-white dark:bg-navy-900 rounded-2xl p-1.5 shadow-2xs border border-slate-100 dark:border-navy-800 mt-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-cairo font-bold text-[11px] sm:text-xs transition-all duration-200 cursor-pointer
                  ${active 
                    ? 'bg-[#7B113A] text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-[#7B113A] hover:bg-[#FDF2F4]'}`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F3DB83]' : 'text-neutral-400'}`} />
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors ${active ? 'bg-white text-[#7B113A] font-black' : 'bg-neutral-100 text-neutral-700'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reassuring note explaining archive on decline with permanent dismiss button */}
        {!dismissedArchiveNote && (
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-[11px] font-cairo text-amber-900 dark:text-amber-200 mt-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                💡 <strong>ملاحظة:</strong> عند الاعتذار عن أي طلب توافق، ينتقل الطلب تلقائياً وبشكل مباشر إلى تبويب <strong>«المؤرشفة»</strong> لحفظ خصوصيتك وسجلك المرجعي.
              </span>
            </div>
            <button
              onClick={handleDismissArchiveNote}
              className="p-1 text-amber-800/60 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white hover:bg-amber-400/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="إغلاق الملاحظة نهائياً وعدم عرضها مجدداً"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {tab === 'archive' && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-rose-50/70 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-[11px] font-cairo text-rose-900 dark:text-rose-200 mt-2">
            <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>
              📁 <strong>ترتيب المؤرشفة:</strong> تُعرض في المقدمة <strong>الطلبات القابلة للاستعادة</strong> بالزر الأخضر، بينما تُعرض في الأسفل بأطراف حمراء <strong>الطلبات غير القابلة للاستعادة</strong> (التي اعتذر عنها أو ألغاها الطرف الآخر).
            </span>
          </div>
        )}

        {/* شريط الإجراءات والفلترة الموحد: في صف واحد أفقي بالكامل (الفلاتر باليمين، والبحث والتحديد بالشمال) */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mt-4 bg-white dark:bg-navy-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-navy-800 shadow-sm flex-nowrap overflow-x-auto">
          {/* الجانب الأيمن: فلاتر التصنيف (الكل / أرسلتها / استقبلتها) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/80 dark:bg-navy-800/80 p-0.5 sm:p-1 rounded-xl border border-slate-200/70 dark:border-navy-700/60 shadow-2xs">
              {([
                { key: 'all', label: 'الكل' },
                { key: 'sent', label: 'أرسلتها' },
                { key: 'received', label: 'استقبلتها' },
              ] as const).map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setSubFilter(chip.key)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-cairo transition-all cursor-pointer select-none whitespace-nowrap ${
                    subFilter === chip.key 
                      ? 'bg-white dark:bg-navy-900 text-slate-950 dark:text-white shadow-2xs font-black' 
                      : 'font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {isSelectionMode && selectedIds.length > 0 && (
              <span className="hidden md:inline-flex text-[11px] font-cairo font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/60 whitespace-nowrap">
                ({selectedIds.length}) محدد
              </span>
            )}
          </div>

          {/* الجانب الأيسر (الشمال): أدوات البحث والتحديد في نفس الصف */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* زر وحقل البحث */}
            {showSearch || query ? (
              <div className="relative w-32 sm:w-44 md:w-52">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث..."
                  className="w-full bg-slate-50 dark:bg-navy-800 border border-amber-300 dark:border-amber-400/30 rounded-xl py-1 pr-8 pl-6 text-[11px] sm:text-xs font-cairo focus:outline-none focus:ring-2 focus:ring-amber-400/20 text-slate-900 dark:text-white shadow-2xs"
                />
                <button
                  onClick={() => {
                    setQuery('');
                    setShowSearch(false);
                  }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="إغلاق البحث"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-cream-100 hover:bg-slate-200 dark:hover:bg-navy-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs font-cairo font-bold shadow-2xs whitespace-nowrap"
                title="بحث عن طلب"
              >
                <Search className="w-3.5 h-3.5 text-slate-500 dark:text-cream-300" />
                <span>بحث</span>
              </button>
            )}

            {/* زر تحديد */}
            <button
              onClick={() => {
                const nextMode = !isSelectionMode;
                setIsSelectionMode(nextMode);
                if (!nextMode) setSelectedIds([]);
              }}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                isSelectionMode
                  ? 'bg-amber-500 text-navy-950 font-black shadow-md'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-cream-100 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'إنهاء' : 'تحديد'}</span>
            </button>

            {/* زر تحديد الجميع عند تفعيل وضع التحديد */}
            {isSelectionMode && list.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-cairo font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-cream-100 hover:bg-slate-200 dark:hover:bg-navy-700 flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-navy-700 shadow-2xs whitespace-nowrap"
              >
                <ListChecks className="w-3 h-3 text-amber-500" />
                <span>
                  {list.length > 0 && list.every((r) => selectedIds.includes(r.id))
                    ? 'إلغاء'
                    : 'الكل'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-[2rem] shadow-sm">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-amber-500 mb-3 sm:mb-4" />
              <p className="font-cairo text-sm text-slate-600 dark:text-slate-300 font-medium">جارٍ تحميل طلبات التوافق الآمنة...</p>
              <p className="font-cairo text-xs text-slate-400 dark:text-slate-400 mt-1">نحن نهتم بخصوصيتك ونقوم بتهيئة البيانات</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-rose-100 rounded-[2rem] p-6 shadow-sm">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
              <p className="font-cairo text-slate-800 font-extrabold text-base mb-1">{error}</p>
              <p className="font-cairo text-xs text-slate-400 mb-4">حدث خطأ أثناء تحميل البيانات، يرجى التحديث</p>
              <button onClick={refresh} className="font-cairo text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-5 py-2.5 rounded-xl border border-amber-200/50 transition-colors cursor-pointer">
                إعادة المحاولة والاتصال
              </button>
            </div>
          )}

          {!loading && !error && list.length === 0 && (
            <EmptyState tab={tab} />
          )}

          {!loading && !error && initialUnseenCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#7B113A]/5 to-transparent border border-amber-400/30 flex items-center justify-between gap-3 text-right shadow-xs mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-cairo font-bold text-xs sm:text-sm text-slate-900">
                    {initialUnseenCount === 1 
                      ? 'لديك طلب توافق جديد أو تحديث حديث — تم الاطلاع عليه واختفت إشارة التنبيه من القائمة السفلية'
                      : `لديك ${initialUnseenCount} طلبات توافق جديدة أو تحديثات حديثة — تم الاطلاع عليها واختفت إشارة التنبيه من القائمة السفلية`}
                  </p>
                  <p className="text-[11px] text-slate-500 font-cairo mt-0.5">
                    الطلبات موضحة ومحدثة أدناه ويمكنك متابعة تفاصيلها والرد عليها في أي وقت
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInitialUnseenCount(0)}
                className="text-xs font-cairo font-bold text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {!loading && !error && (
            <AnimatePresence mode="popLayout">
              {list.map((req, idx) => (
                <RequestCard
                  key={(req?.id !== undefined && req?.id !== null && !Number.isNaN(Number(req.id))) ? `req-${req.id}-${idx}` : `req-idx-${idx}`}
                  req={req}
                  activeId={activeId}
                  currentTab={tab}
                  getMember={getMember}
                  busy={actionLoading === req.id}
                  urgent={needsAction(req)}
                  unseen={initialUnseenIds.includes(req.id) || isRequestUnseen(req.id, req.updated_at, activeId)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(req.id)}
                  onToggleSelect={() => toggleSelectReq(req.id)}
                  onAccept={() => onAccept(req)}
                  onDecline={() => { setDeclineModal(req); setDeclineReason(''); }}
                  onPay={() => { setPayModal(req); setPledge(false); }}
                  onCoord={() => setCoordModal(req)}
                  onResult={() => { setResultModal(req); setResultChoice('success'); setResultNote(''); }}
                  onCancel={() => { setCancelModal(req); setCancelReason(''); setCancelCustom(''); }}
                  onArchive={() => onArchiveSingle(req)}
                  onUnarchive={() => onUnarchiveSingle(req)}
                  onHide={() => onHideSingle(req)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <Modal open={!!declineModal} onClose={() => setDeclineModal(null)} title="الاعتذار عن الطلب">
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3">
          <Info className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-900 font-cairo leading-relaxed font-semibold">
            💡 <strong>تنبيه:</strong> عند تأكيد الاعتذار، سينتقل الطلب تلقائياً وبشكل مباشر إلى تبويب <strong>«المؤرشفة»</strong> لحفظ خصوصيتك وسجلك المرجعي.
          </p>
        </div>
        <p className="text-sm text-navy-600 font-cairo mb-4">الاعتذار حق مشروع. اختر السبب الأقرب — لن يظهر اسمك للطرف الآخر بشكل محرج.</p>
        <div className="space-y-2">
          {DECLINE_REASONS.map((reason) => (
            <label key={reason} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
              ${declineReason === reason ? 'border-rose-300 bg-rose-50' : 'border-cream-200 hover:bg-cream-50'}`}>
              <input type="radio" name="decline" checked={declineReason === reason} onChange={() => setDeclineReason(reason)} className="accent-rose-500" />
              <span className="text-sm font-cairo text-navy-700">{reason}</span>
            </label>
          ))}
        </div>
        {declineReason === DECLINE_REASONS[DECLINE_REASONS.length - 1] && (
          <textarea
            value={declineCustom} onChange={(e) => setDeclineCustom(e.target.value)}
            placeholder="اكتب التفاصيل..." rows={3}
            className="w-full mt-3 bg-white border border-cream-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        )}
        <button onClick={onDecline} disabled={actionLoading !== null}
          className="w-full mt-4 bg-rose-deep text-white font-cairo font-bold py-3.5 rounded-2xl hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          تأكيد الاعتذار
        </button>
      </Modal>

      {/* مودال التوضيح لأول مرة عند الأرشفة */}
      <Modal open={!!archiveNoticeModal} onClose={() => setArchiveNoticeModal(null)} title="نقل الطلب إلى تبويب المؤرشفة">
        <div className="p-1 space-y-4 font-cairo text-right">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Archive className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h4 className="font-black text-slate-900 dark:text-white text-base">
              معلومة هامة عن أرشفة الطلب
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تظهر لك هذه الملاحظة التوضيحية لأول مرة فقط لمساعدتك على معرفة آلية الأرشيف:
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-sm">📁</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>تنظيم قائمتك:</strong> أرشفة الطلب تنقله مباشرة من قائمتك الفعّالة إلى تبويب <strong>«المؤرشفة»</strong> لحفظ ترتيب طلباتك دون إحراج لأي طرف.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold text-sm">↺</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>إمكانية الاستعادة:</strong> يمكنك في أي وقت فتح تبويب «المؤرشفة» والضغط على <strong>«استعادة للقائمة النشطة»</strong> لإعادة الطلب للعمل كالمعتاد.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            (لن تظهر هذه الملاحظة مرة أخرى عند أرشفة أي طلب مستقبلاً).
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={confirmArchiveNotice}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
            >
              فهمت، أرشف الطلب الآن
            </button>
            <button
              onClick={() => setArchiveNoticeModal(null)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="إلغاء الطلب">
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-2xl p-3 mb-4">
          <Ban className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-navy-600 font-cairo leading-relaxed">
            يمكنك إلغاء هذا الطلب في أي مرحلة. يرجى تحديد السبب لتحسين تجربة المنصة.
            <span className="block mt-1 font-bold text-rose-600">⚠️ ملاحظة هامة: رسوم تأكيد الجدية وجميع الرسوم المدفوعة غير مستردة نهائياً تحت أي ظرف بعد السداد.</span>
          </p>
        </div>
        <div className="space-y-2">
          {CANCEL_REASONS.map((reason) => (
            <label key={reason} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
              ${cancelReason === reason ? 'border-rose-300 bg-rose-50' : 'border-cream-200 hover:bg-cream-50'}`}>
              <input type="radio" name="cancel" checked={cancelReason === reason} onChange={() => setCancelReason(reason)} className="accent-rose-500" />
              <span className="text-sm font-cairo text-navy-700">{reason}</span>
            </label>
          ))}
        </div>
        {cancelReason === CANCEL_REASONS[CANCEL_REASONS.length - 1] && (
          <textarea
            value={cancelCustom} onChange={(e) => setCancelCustom(e.target.value)}
            placeholder="اكتب سبب الإلغاء..." rows={3}
            className="w-full mt-3 bg-white border border-cream-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={() => setCancelModal(null)}
            className="flex-1 bg-cream-100 text-navy-600 font-cairo font-bold py-3.5 rounded-2xl hover:bg-cream-200 transition-all">
            تراجع
          </button>
          <button onClick={onCancel} disabled={actionLoading !== null}
            className="flex-1 bg-rose-deep text-white font-cairo font-bold py-3.5 rounded-2xl hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            تأكيد الإلغاء
          </button>
        </div>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="عربون المنصة وتأكيد الجدية">
        {payModal && (() => {
          const isSender = payModal.sender_id === activeId;
          const alreadyPaid = isSender ? !!payModal.sender_paid : !!payModal.receiver_paid;
          return (
            <div>
              {alreadyPaid ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="font-cairo font-black text-lg text-emerald-800">تم سداد العربون مسبقاً ✓</p>
                  <p className="text-xs text-emerald-700 font-cairo mt-1">
                    أنت معفي من تكرار السداد لأن العربون يُطلب <strong>مرة واحدة فقط</strong> كجزء من أتعاب المنصة وجهود الإدارة.
                  </p>
                  <p className="text-[11px] text-slate-600 font-cairo mt-2 bg-white/80 rounded-xl p-2.5 border border-emerald-100">
                    باقي أتعاب المنصة (4,000 ر.ق) مستحقة عند حدوث النصيب وتسليم المهر بتنسيق إدارة المنصة.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-center">
                  <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="font-cairo font-black text-2xl text-amber-800">1,000 <span className="text-sm font-bold">ر.ق</span></p>
                  <p className="text-xs text-slate-700 font-cairo mt-1 font-bold">عربون تأكيد الجدية — يُطلب <strong>مرة واحدة فقط</strong></p>
                  <p className="text-[11px] text-slate-600 font-cairo mt-1">
                    جزء من إجمالي أتعاب المنصة (5,000 ر.ق) ومقابل جهد الإدارة في التنسيق والمتابعة والتوفيق بين الطرفين.
                  </p>
                </div>
              )}

              <PayProgress req={payModal} activeId={activeId} />

              {!alreadyPaid && (
                <label className="flex items-start gap-2.5 mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 cursor-pointer">
                  <input type="checkbox" checked={pledge} onChange={(e) => setPledge(e.target.checked)} className="mt-1 accent-amber-600 w-4 h-4" />
                  <span className="text-xs font-cairo text-slate-800 leading-relaxed font-medium">
                    أتعهّد أمام الله بأن طلبي جاد بنية الزواج الشرعي، وأتعهد بسداد باقي أتعاب المنصة وقدرها (4,000 ر.ق) فور حدوث النصيب وإتمام الزواج وتسليم المهر بتنسيق الإدارة.
                  </span>
                </label>
              )}

              <button
                onClick={onPay}
                disabled={(!alreadyPaid && !pledge) || actionLoading !== null}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-cairo font-black py-3.5 rounded-2xl shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : alreadyPaid ? <Sparkles className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                {alreadyPaid ? 'الانتقال إلى رحلة التوافق' : 'متابعة السداد عبر الواتساب'}
              </button>
            </div>
          );
        })()}
      </Modal>

      <Modal open={!!coordModal} onClose={() => setCoordModal(null)} title="تنسيق التواصل">
        {coordModal && (
          <div className="space-y-3">
            {coordModal.meeting_date ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <CalendarClock className="w-5 h-5" />
                  <span className="font-cairo font-bold text-sm">موعد التنسيق</span>
                </div>
                <p className="font-cairo text-navy-800 font-bold">{coordModal.meeting_date}</p>
                {coordModal.meeting_notes && <p className="text-xs text-navy-500 font-cairo mt-1">{coordModal.meeting_notes}</p>}
              </div>
            ) : (
              <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4 text-center">
                <Loader2 className="w-6 h-6 text-blue-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-cairo text-navy-600">الإدارة تنسّق الموعد حالياً. ستصلك التفاصيل قريباً.</p>
              </div>
            )}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs font-cairo text-navy-600 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-500 inline ml-1" />
              عند تأكيد الموعد وإتمام التوافق الأولي، انتقل لمرحلة تبادل القنوات الرسمية.
            </div>
            {stageOf(coordModal, activeId) === 'coordination' && coordModal.guardian_phone && coordModal.male_phone && (
              <button onClick={() => onAdvanceIntro(coordModal)} disabled={actionLoading !== null}
                className="w-full bg-indigo-500 text-white font-cairo font-bold py-3.5 rounded-2xl hover:brightness-105 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                تأكيد الاستعداد من جانبي
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!resultModal} onClose={() => setResultModal(null)} title="نتيجة النظرة الشرعية">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => setResultChoice('success')}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${resultChoice === 'success' ? 'border-emerald-400 bg-emerald-50' : 'border-cream-200'}`}>
            <span className="text-2xl block mb-1">💚</span>
            <span className="font-cairo font-bold text-sm text-emerald-700">تم القبول بفضل الله</span>
          </button>
          <button onClick={() => setResultChoice('failed')}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${resultChoice === 'failed' ? 'border-slate-400 bg-slate-50' : 'border-cream-200'}`}>
            <span className="text-2xl block mb-1">🤝</span>
            <span className="font-cairo font-bold text-sm text-slate-600">لم يُكتب النصيب</span>
          </button>
        </div>
        <textarea value={resultNote} onChange={(e) => setResultNote(e.target.value)} rows={3} placeholder="ملاحظة (اختياري)..."
          className="w-full bg-white border border-cream-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-gold-200" />
        <button onClick={onRecordResult} disabled={actionLoading !== null}
          className="w-full mt-4 bg-navy-900 text-white font-cairo font-bold py-3.5 rounded-2xl hover:bg-navy-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          حفظ نتيجة النظرة الشرعية
        </button>
      </Modal>

      <AnimatePresence>
        {isSelectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 80, x: '-50%' }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 z-[90] w-[96%] sm:w-[94%] max-w-xl bg-navy-950/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center justify-between gap-2 sm:gap-3 flex-wrap backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-navy-950 font-black font-cairo text-sm flex items-center justify-center shadow-sm">
                {selectedIds.length}
              </span>
              <div>
                <span className="text-xs font-cairo font-bold text-slate-100 block">رحلات محددة</span>
                <span className="text-[10px] font-cairo text-amber-400/90">اختر إجراءً للمجموعة</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {tab === 'archive' ? (
                <>
                  <button
                    onClick={handleBulkRestore}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] sm:text-xs font-cairo font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="استعادة الطلبات غير المرفوضة للقائمة النشطة"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-950" />
                    <span>استعادة المحددة</span>
                  </button>

                  <button
                    onClick={handleBulkHide}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                    title="إخفاء السجلات من شاشة الأرشيف"
                  >
                    <EyeOff className="w-4 h-4 text-slate-300" />
                    <span>إخفاء المحددة</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBulkArchive}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
                    title="نقل الطلبات المحددة للمؤرشفة"
                  >
                    <Archive className="w-4 h-4 text-amber-400" />
                    <span>أرشفة المحددة</span>
                  </button>

                  <button
                    onClick={() => setConfirmBulkCancel(true)}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>إلغاء المحددة</span>
                  </button>
                </>
              )}

              <button
                onClick={handleBulkMarkSeen}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                title="تعليم الرحلات المحددة كـ تمت مشاهدتها"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تعليم كمقروء</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="تفريغ التحديد"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={confirmBulkCancel} onClose={() => setConfirmBulkCancel(false)} title="إلغاء الرحلات المحددة">
        <div className="space-y-4">
          <p className="font-cairo text-sm text-slate-700 dark:text-cream-200 font-bold">
            سيتم إلغاء {selectedIds.length} رحلة من رحلات التوافق المحددة. يرجى اختيار أو كتابة سبب الإلغاء الجماعي:
          </p>
          <input
            value={bulkCancelReason}
            onChange={(e) => setBulkCancelReason(e.target.value)}
            placeholder="سبب الإلغاء الجماعي (مثال: عدم الرغبة بالمتابعة حالياً...)"
            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl p-3 text-xs sm:text-sm font-cairo focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-navy-950 text-slate-900 dark:text-cream-50"
          />
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleBulkCancel}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-navy-950 font-cairo font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span>تأكيد إلغاء {selectedIds.length} رحلة</span>
            </button>
            <button
              onClick={() => setConfirmBulkCancel(false)}
              className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo font-bold py-3 rounded-xl transition-all cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl font-cairo font-bold text-sm text-white max-w-[90%]
              ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-deep' : 'bg-navy-800'}`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequestCard({
  req, activeId, currentTab, getMember, busy, urgent, unseen, isSelectionMode, isSelected, onToggleSelect, onAccept, onDecline, onPay, onCoord, onResult, onCancel,
  onArchive, onUnarchive, onHide,
}: {
  key?: any;
  req: ApiRequest;
  activeId: string;
  currentTab?: Tab;
  getMember: (id: string) => any;
  busy: boolean;
  urgent: boolean;
  unseen: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
  onPay: () => void;
  onCoord: () => any;
  onResult: () => void;
  onCancel: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onHide?: () => void;
}) {
  const stage = stageOf(req, activeId);
  const isSender = req.sender_id === activeId;
  const role: RequestRole = isSender ? 'sender' : 'receiver';
  const otherResolved = getMember(isSender ? req.receiver_id : req.sender_id);
  const isOtherDeleted = !otherResolved || otherResolved.status === 'deleted' || otherResolved.deleted === true;
  const isOtherBanned = otherResolved?.status === 'banned';
  const isOtherSuspended = otherResolved?.status === 'suspended';
  const isOtherUnavailable = isOtherDeleted || isOtherBanned || isOtherSuspended;
  const isDeclinedOrCancelled = stage === 'declined' || stage === 'cancelled';
  const isUserArchived = Array.isArray(req.archived_by) && req.archived_by.includes(activeId);
  const canRestore = canRequestBeRestored(req, activeId, isOtherUnavailable);

  const other = otherResolved || {
    id: isSender ? req.receiver_id : req.sender_id,
    nickname: isSender ? (req.receiver_nickname || 'عضو سابق (مُحذوف)') : (req.sender_nickname || 'عضو سابق (مُحذوف)'),
    gender: isSender ? (req.receiver_gender || 'female') : (req.sender_gender || 'male'),
    age: 28,
    country: 'قطر',
    city: 'الدوحة',
    verified: false,
    premium: false,
  };
  const meta = STAGE_META[stage];

  const selfPaid = isSender ? req.sender_paid : req.receiver_paid;
  const otherPaid = isSender ? req.receiver_paid : req.sender_paid;
  const action = getPrimaryAction(stage, role, { selfPaid, otherPaid });

  const [showDetails, setShowDetails] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const loadTimeline = async () => {
    if (!showTimeline && events.length === 0) {
      setEvents(await fetchRequestEvents(req.id));
    }
    setShowTimeline((v) => !v);
  };

  const summary = getJourneyStatusSummary(req, activeId, other.nickname);

  // Status pill text matching the screenshot style
  let statusBadgeText = meta?.title || 'رحلة توافق';
  if (stage === 'sent') {
    statusBadgeText = isSender ? 'بانتظار رد الطرف الآخر' : 'طلب جديد - بانتظار ردك';
  } else if (stage === 'accepted' || stage === 'seriousness') {
    statusBadgeText = selfPaid ? 'تم القبول والبدء في رحلة التوافق' : 'تم القبول - بانتظار سداد الجدية';
  } else if (stage === 'coordination' || stage === 'sharia_viewing') {
    statusBadgeText = 'مرحلة التنسيق والنظرة الشرعية';
  } else if (stage === 'engagement') {
    statusBadgeText = 'تم الخطبة والتوافق';
  } else if (stage === 'completed') {
    statusBadgeText = 'تم عقد القرأن مبارك 💚';
  } else if (stage === 'declined' || stage === 'cancelled') {
    statusBadgeText = 'طلب غير نشط';
  }

  // نص مختصر مخصص لكل مرحلة مستقل عن نص تفاصيل إضافية
  const getStageBriefText = () => {
    if (stage === 'sent') {
      if (role === 'receiver') {
        return {
          badge: 'طلب وارد',
          text: `وصلك طلب توافق من ${other.nickname}، يمكنك القبول للبدء برحلة التوافق أو الاعتذار بكل سرية واحترام.`,
        };
      }
      return {
        badge: 'طلب صادر',
        text: `طلبك قيد انتظار مراجعة وقبول الطرف الآخر (${other.nickname}) لمتابعة الخطوات التالية.`,
      };
    }
    if (stage === 'accepted' || stage === 'seriousness') {
      if (!selfPaid) {
        return {
          badge: 'مرحلة السداد',
          text: 'تمت الموافقة المبدئية، بانتظار سداد عربون الجدية لترتيب التواصل والنظرة الشرعية برعاية الإدارة.',
        };
      }
      return {
        badge: 'مرحلة التنسيق',
        text: 'تم سداد وتأكيد الجدية، بانتظار استكمال تنسيق التواصل والنظرة الشرعية بين الأهل.',
      };
    }
    if (stage === 'coordination' || stage === 'sharia_viewing') {
      return {
        badge: 'مرحلة الرؤية الشرعية',
        text: 'جاري التنسيق بين الطرفين والأهل لترتيب الموعد والنظرة الشرعية بإشراف مباشر من إدارة المنصة.',
      };
    }
    if (stage === 'engagement') {
      return {
        badge: 'مرحلة الخطبة',
        text: 'تمت الموافقة والنظرة الشرعية بنجاح، بانتظار استكمال مراسم الخطبة وتأكيد النصيب.',
      };
    }
    if (stage === 'completed') {
      return {
        badge: 'مبارك الزواج',
        text: 'تم عقد القِران وتسليم المهر بنجاح وتوفيق من الله مبارك لكما.',
      };
    }
    if (stage === 'declined') {
      return {
        badge: 'طلب معتذر عنه',
        text: 'تم الاعتذار عن الطلب بلطف وخصوصية، ونسأل الله التوفيق للجميع.',
      };
    }
    if (stage === 'cancelled') {
      return {
        badge: 'طلب ملغي',
        text: 'تم إيقاف وإلغاء هذا الطلب من المتابعة.',
      };
    }
    return {
      badge: 'متابعة الطلب',
      text: 'طلبك قيد المتابعة والتحديث من قبل إدارة المنصة وستصلك التحديثات أولاً بأول.',
    };
  };

  const brief = getStageBriefText();
  const maxLength = 58;
  const isLong = brief.text.length > maxLength;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={isSelectionMode ? onToggleSelect : undefined}
      className={`relative rounded-3xl transition-all duration-300 shadow-xs hover:shadow-md
        ${isSelectionMode ? 'cursor-pointer select-none' : ''}
        ${isSelected 
          ? 'ring-2 ring-amber-500 border-2 border-amber-400 bg-amber-50/20' 
          : currentTab === 'archive' && !canRestore
            ? 'border-2 border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/25 ring-1 ring-rose-200 dark:ring-rose-900/30'
            : currentTab === 'archive' && canRestore
              ? 'border-2 border-amber-300/80 dark:border-amber-500/40 bg-white dark:bg-navy-900'
              : urgent 
                ? 'border-amber-300 ring-2 ring-amber-400/20 bg-white' 
                : 'border border-cream-200/80 bg-white'}`}
    >
      {isSelectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className="absolute top-3 left-3 z-30 p-2 bg-white rounded-xl shadow-md border border-amber-400 cursor-pointer flex items-center justify-center"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-amber-500 fill-amber-100" />
          ) : (
            <Square className="w-5 h-5 text-slate-300" />
          )}
        </button>
      )}

      {/* Main compact body matching screenshot layout */}
      <div className="p-3.5 sm:p-4">
        {/* Header row: Avatar + Profile Click Hint + Nickname + Info & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Avatar with click prompt */}
            <Link 
              to={`/member/${other.id}`} 
              className="flex-shrink-0 group relative block"
              title="اضغط على صورة الملف لمعرفة معلومات العضو"
            >
              <img
                src={getAvatar(other.gender)}
                alt={other.nickname}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover ring-2 shadow-xs transition-all duration-200 group-hover:scale-105 ${
                  currentTab === 'archive' && !canRestore
                    ? 'ring-rose-400 dark:ring-rose-500'
                    : 'ring-sky-400/80 group-hover:ring-amber-500'
                }`}
              />
              <span className="absolute -bottom-1 -left-1 bg-slate-900/80 text-amber-300 text-[9px] px-1 rounded-full font-cairo font-bold pointer-events-none sm:hidden">
                الملف
              </span>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* ID Badge (#1) */}
                <span className="bg-cream-100 text-slate-700 font-cairo font-black text-[11px] px-2 py-0.5 rounded-md">
                  #{req.id}
                </span>

                {/* Verified check */}
                {other.verified && !isOtherDeleted && (
                  <BadgeCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/20 flex-shrink-0" />
                )}

                {/* Member Nickname */}
                <Link
                  to={`/member/${other.id}`}
                  className="font-cairo font-black text-sm sm:text-base text-slate-900 hover:text-amber-600 transition-colors leading-tight truncate"
                >
                  {other.nickname}
                </Link>

                {unseen && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" title="تحديث جديد" />
                )}
              </div>

              {/* Subtitle line: Age, City, Request direction tag */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-cairo mt-0.5">
                <span>{other.age} سنة</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 inline" />
                  {other.city}
                </span>
                <span>·</span>
                <span className="font-semibold text-slate-600">
                  {isSender ? 'طلب صادر' : 'طلب وارد'}
                </span>
              </div>

              {/* Subtle hint to click avatar for full profile */}
              <p className="text-[10px] text-slate-400 font-cairo mt-0.5 flex items-center gap-1">
                <span>اضغط على صورة الملف لمعرفة معلومات العضو</span>
              </p>
            </div>
          </div>

          {/* Status Pill Badge (Top-left in RTL) */}
          <div className="flex-shrink-0">
            {currentTab === 'archive' && !canRestore ? (
              <div className="bg-rose-100 text-rose-800 border border-rose-300 dark:border-rose-700 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>غير قابل للاستعادة</span>
              </div>
            ) : currentTab === 'archive' && canRestore ? (
              <div className="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>مؤرشف (قابل للاستعادة)</span>
              </div>
            ) : (
              <div className="bg-sky-50 text-sky-800 border border-sky-200/70 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-cairo font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>{statusBadgeText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status summary explanation banner directly visible and compact at the top */}
        <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-2 text-right">
          <span className="text-xs mt-0.5 flex-shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-cairo text-slate-800 leading-snug">
              <span className="font-bold text-amber-700 ml-1">{brief.badge}:</span>
              <span className="font-medium text-slate-600">
                {isLong && !isTextExpanded ? (
                  <>
                    <span>{brief.text.slice(0, maxLength)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTextExpanded(true);
                      }}
                      className="inline-flex items-center text-amber-700 font-black hover:text-amber-800 px-1 py-0.2 mx-0.5 bg-amber-100 hover:bg-amber-200 rounded transition-colors cursor-pointer select-none"
                      title="اضغط على النقاط لعرض بقية النص"
                    >
                      ...
                    </button>
                  </>
                ) : (
                  <>
                    <span>{brief.text}</span>
                    {isLong && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTextExpanded(false);
                        }}
                        className="inline-flex items-center text-slate-400 hover:text-slate-600 text-[10px] mx-1 transition-colors cursor-pointer underline select-none"
                        title="إخفاء النص الإضافي"
                      >
                        (إخفاء)
                      </button>
                    )}
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Divider line */}
        <div className="my-2.5 border-t border-slate-100" />

        {/* Action Button visible prominently on the exterior */}
        {currentTab === 'archive' && canRestore ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-amber-50/70 border border-amber-300/80 rounded-2xl">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-cairo font-bold text-slate-800">
                طلب مؤرشف تنظيمياً (يمكنك استعادته في أي وقت للقائمة الفعّالة)
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={onUnarchive}
                disabled={busy}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-cairo font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة للقائمة النشطة</span>
              </button>
              <button
                onClick={onHide}
                disabled={busy}
                className="px-2.5 py-2 text-slate-400 hover:text-slate-600 text-xs font-cairo cursor-pointer"
                title="إخفاء السجل من الأرشيف"
              >
                إخفاء
              </button>
            </div>
          </div>
        ) : currentTab === 'archive' && !canRestore ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-xs font-cairo font-bold">
                طلب غير قابل للاستعادة ({isSender && stage === 'declined' ? 'اعتذر الطرف الآخر عن طلب التوافق' : !isSender && stage === 'cancelled' ? 'ألغى الطرف الآخر طلبه' : 'سجل منتهٍ ومحفوظ'})
              </span>
            </div>
            <button
              onClick={onHide}
              disabled={busy}
              className="px-2.5 py-1 text-rose-700 hover:text-rose-900 font-cairo text-xs underline cursor-pointer"
              title="إخفاء من قائمة الأرشيف"
            >
              إخفاء السجل
            </button>
          </div>
        ) : isOtherUnavailable ? (
          <div className="flex items-center justify-between gap-2 bg-rose-50 border border-rose-200 p-3 rounded-2xl">
            <span className="text-xs font-cairo font-bold text-rose-800">حساب الطرف الآخر غير متاح</span>
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-3 py-2 bg-rose-600 text-white font-cairo font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              إلغاء الطلب
            </button>
          </div>
        ) : action.type === 'accept_decline' ? (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              disabled={busy}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-cairo font-black py-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-all"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 text-white" />}
              قبول طلب التوافق
            </button>
            <button
              onClick={onDecline}
              disabled={busy}
              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo font-bold py-3 rounded-2xl text-xs cursor-pointer transition-all"
            >
              اعتذار
            </button>
          </div>
        ) : (
          <Link
            to={`/journey/${req.id}`}
            className="w-full bg-[#0d1527] hover:bg-[#18233c] text-white font-cairo font-extrabold py-3.5 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>الانتقال إلى رحلة التوافق</span>
            <span className="text-amber-400 font-bold">←</span>
          </Link>
        )}

        {/* Collapsible toggle for extra details if user wants */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-cairo px-1">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="hover:text-slate-600 font-bold cursor-pointer flex items-center gap-1"
          >
            {showDetails ? 'إخفاء التفاصيل' : 'تفاصيل إضافية'}
            <ChevronLeft className={`w-3 h-3 transition-transform ${showDetails ? '-rotate-90' : ''}`} />
          </button>

          <div className="flex items-center gap-3">
            {currentTab !== 'archive' && (
              <button
                onClick={onArchive}
                disabled={busy}
                className="text-slate-400 hover:text-amber-600 font-bold cursor-pointer flex items-center gap-1 transition-colors"
                title="أرشفة الطلب ونقله للمؤرشفة"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>أرشفة</span>
              </button>
            )}

            {!isTerminal(stage) && action.type !== 'accept_decline' && currentTab !== 'archive' && (
              <button
                onClick={onCancel}
                disabled={busy}
                className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
              >
                إلغاء الطلب
              </button>
            )}
          </div>
        </div>

        {/* Expandable Extra Details Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-slate-100 space-y-3"
            >
              <RequestStatusPanel summary={summary} compact />

              {stage === 'declined' && req.decline_reason && (
                <div className="text-xs font-cairo text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <span className="font-bold">سبب الاعتذار:</span> {req.decline_reason}
                </div>
              )}

              <button
                onClick={loadTimeline}
                className="w-full text-center text-xs font-cairo text-slate-500 font-bold py-1 hover:text-slate-700 cursor-pointer"
              >
                {showTimeline ? 'إخفاء سجل التحديثات' : 'عرض سجل التحديثات'}
              </button>

              {showTimeline && (
                <div className="space-y-1.5 pt-1">
                  {events.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-cairo text-center">لا توجد أحداث مسجلة</p>
                  )}
                  {events.map((ev, idx) => (
                    <div key={`ev-${idx}`} className="text-xs font-cairo bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-slate-700 font-medium">{ev.note}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{new Date(ev.created_at).toLocaleString('ar-SA')}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PrimaryActionBar({
  stage, action, busy, requestId, onAccept, onDecline, onPay, onCoord, onResult,
}: {
  stage: JourneyState; action: ReturnType<typeof getPrimaryAction>; busy: boolean; requestId: number;
  onAccept: () => void; onDecline: () => void; onPay: () => void; onCoord: () => void; onResult: () => void;
}) {
  if (action.type === 'pay_whatsapp') {
    return (
      <Link to={`/journey/${requestId}`}
        className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-cairo font-black py-3.5 sm:py-4 rounded-2xl shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
        <MessageCircle className="w-5 h-5 text-white" /> {action.label}
      </Link>
    );
  }

  if (action.type === 'open_journey') {
    return (
      <Link to={`/journey/${requestId}`}
        className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-cairo font-black py-3.5 sm:py-4 rounded-2xl shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
        <Sparkles className="w-5 h-5 text-slate-950" /> {action.label}
      </Link>
    );
  }

  if (action.type === 'accept_decline') {
    return (
      <div className="flex gap-2 sm:gap-3">
        <button onClick={onAccept} disabled={busy}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-cairo font-black py-3 sm:py-3.5 rounded-2xl shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 text-white" />} قبول طلب التوافق
        </button>
        <button onClick={onDecline} disabled={busy}
          className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-cairo font-black py-3 sm:py-3.5 rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm">
          <X className="w-4 h-4 text-slate-500" /> اعتذار بلطف
        </button>
      </div>
    );
  }

  if (action.type === 'none') {
    return (
      <div className="text-center py-4 bg-[#FAF9F5] dark:bg-navy-900/40 rounded-2xl border border-slate-200/50">
        <p className="text-xs sm:text-sm font-cairo font-black text-slate-800">{action.label}</p>
        <p className="text-[10px] sm:text-xs font-cairo text-slate-500 mt-1">{action.hint}</p>
      </div>
    );
  }

  const handler = action.type === 'view_coordination' ? onCoord : () => {};

  return (
    <button onClick={handler} disabled={busy}
      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-cairo font-black py-3.5 sm:py-4 rounded-2xl hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm shadow-md">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-5 h-5" />}
      {action.label}
    </button>
  );
}

function PayProgress({ req, activeId }: { req: ApiRequest; activeId: string }) {
  const isSender = req.sender_id === activeId;
  const isSelfPaid = isSender ? !!req.sender_paid : !!req.receiver_paid;
  const isOtherPaid = isSender ? !!req.receiver_paid : !!req.sender_paid;
  const selfPaidAmt = isSender ? (req.sender_paid_amount || 0) : (req.receiver_paid_amount || 0);
  const otherPaidAmt = isSender ? (req.receiver_paid_amount || 0) : (req.sender_paid_amount || 0);
  const totalFee = req.total_fee || TOTAL_FEE_AMOUNT;
  const remaining = Math.max(0, totalFee - selfPaidAmt);

  const items = [
    {
      label: 'سدادك أنت (العربون: 1,000 ر.ق)',
      amount: selfPaidAmt,
      paid: isSelfPaid,
      status: isSelfPaid ? 'تم سداد العربون مسبقاً ✓ معفي' : 'بانتظار السداد عبر الواتساب',
    },
    {
      label: 'سداد الطرف الآخر (العربون: 1,000 ر.ق)',
      amount: otherPaidAmt,
      paid: otherPaidAmt > 0 || (isSender ? req.receiver_paid : req.sender_paid),
      status: (otherPaidAmt > 0 || (isSender ? req.receiver_paid : req.sender_paid)) ? 'تم السداد ✓' : 'بانتظار السداد عبر الواتساب',
    },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2.5">
        {items.map((it) => (
          <div key={it.label} className={`flex-1 rounded-2xl p-3 text-center border transition-all ${it.paid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-cairo font-bold text-slate-500">{it.label}</p>
            <p className={`text-xs font-cairo font-black mt-1 ${it.paid ? 'text-emerald-700' : 'text-slate-500'}`}>
              {it.status}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-[#FAF9F5] border border-amber-200/60 rounded-xl p-3 text-[11px] font-cairo text-slate-700 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>إجمالي أتعاب المنصة: <strong className="text-slate-900">{totalFee} ر.ق</strong></span>
          <span>المتبقي بعد إتمام الزواج: <strong className="text-amber-800 font-extrabold">{remaining} ر.ق</strong></span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200/50 pt-1.5">
          ℹ️ العربون (1,000 ر.ق) يُطلب <strong>مرة واحدة فقط</strong> لكل عضو كجزء من أتعاب المنصة وجهد الإدارة في التنسيق والتوفيق والتحقق، ويتعهد العضو بسداد باقي الأتعاب (4,000 ر.ق) فور حدوث النصيب وتسليم المهر.
        </p>
      </div>
    </div>
  );
}

function JourneyLegend() {
  const [open, setOpen] = useState(false);
  const stages: JourneyState[] = ['sent', 'accepted', 'coordination', 'completed'];
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(15,23,42,0.02)] overflow-hidden transition-all duration-300">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-slate-50/50 transition-colors">
        <span className="flex items-center gap-2 sm:gap-2.5 font-cairo font-black text-[11px] sm:text-sm text-slate-800">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" /> 
          <span>كيف تعمل رحلة التوافق للزواج الشرعي الميسر؟ (٣ خطوات أساسية وواضحة)</span>
        </span>
        <ChevronLeft className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${open ? '-rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 space-y-3 sm:space-y-3.5 border-t border-slate-100/50">
              {stages.map((s, i) => {
                const m = STAGE_META[s];
                if (!m) return null;
                const c = ACCENT_CLASSES[m.accent] || ACCENT_CLASSES.gold;
                const Icon = m.icon;
                return (
                  <div key={`journey-stage-item-${s}-${i}`} className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50/70 transition-colors">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${c.bg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                      <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-600 font-cairo">{i === 3 ? 'النتيجة النهائية' : `الخطوة ${i + 1}`}</span>
                        <p className="font-cairo font-black text-sm text-slate-900">{m.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-cairo leading-relaxed mt-1">{m.whereYouAre}</p>
                      <p className="text-[10px] text-indigo-600 font-cairo font-black mt-1">
                        تلقائياً التالي: <span className="underline">{m.whatsNext}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatChip({
  value, label, icon: Icon, tone, active, onClick,
}: {
  value: number; label: string; icon: typeof Heart; tone: 'gold' | 'rose' | 'emerald'; active: boolean; onClick: () => void;
}) {
  const tones = {
    gold: { 
      ring: 'ring-amber-400/40 border-amber-400/40', 
      icon: 'text-amber-300', 
      val: 'text-amber-300',
      bg: 'bg-amber-500/10'
    },
    rose: { 
      ring: 'ring-rose-400/40 border-rose-400/40', 
      icon: 'text-rose-300', 
      val: 'text-rose-300',
      bg: 'bg-rose-500/10'
    },
    emerald: { 
      ring: 'ring-emerald-400/40 border-emerald-400/40', 
      icon: 'text-emerald-300', 
      val: 'text-emerald-300',
      bg: 'bg-emerald-500/10'
    },
  }[tone];
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl px-2 sm:px-3.5 py-2.5 sm:py-3 text-center transition-all duration-300 cursor-pointer border border-white/10
        ${active ? `ring-2 ${tones.ring} ${tones.bg}` : ''}`}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${tones.icon}`} />
        <span className={`font-cairo font-black text-base sm:text-2xl tracking-tight ${active ? tones.val : 'text-white'}`}>{value}</span>
      </div>
      <p className="text-[9px] sm:text-[10px] font-cairo text-slate-300 mt-1 leading-none font-medium">{label}</p>
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const config = {
    incoming: {
      icon: Mail,
      title: 'أنت على المسار الصحيح',
      desc: 'لا يوجد إجراء مطلوب منك الآن. سنضع هنا أي طلب يحتاج ردك أو سدادك أو قرارك.',
      cta: 'تصفّح أعضاء جدد', link: '/search',
    },
    active: {
      icon: Compass,
      title: 'لا توجد طلبات قيد المتابعة',
      desc: 'الطلبات التي تنتظر رد الطرف الآخر أو تستكمل مراحل التوافق ستظهر هنا.',
      cta: 'تصفّح الأعضاء', link: '/search',
    },
    completed: {
      icon: Sparkles,
      title: 'لا توجد رحلات مكتملة بالزواج حالياً',
      desc: 'رحلات التوافق المباركة التي تكلل بعقد القِران وتسليم المهر ستظهر هنا.',
      cta: '🔍 ابدأ تصفّح الأعضاء الآن', link: '/search',
    },
    archive: {
      icon: Archive,
      title: 'الأرشيف نظيف ولا توجد رحلات مؤرشفة',
      desc: 'الطلبات المعتذر عنها، الملغاة، أو المؤرشفة تنظيمياً تظهر هنا للرجوع إليها بكل خصوصية.',
      cta: 'تصفّح الأعضاء', link: '/search',
    },
  }[tab];
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-5 sm:px-6 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(15,23,42,0.015)]"
    >
      <div className="relative mb-5 sm:mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] sm:rounded-[2.2rem] bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center border border-amber-200/20">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 stroke-[1.8]" />
        </div>
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -inset-2.5 rounded-[2.8rem] border-2 border-amber-300/30"
        />
      </div>
      <h3 className="font-cairo font-black text-base sm:text-lg text-slate-900">{config.title}</h3>
      <p className="font-cairo text-xs sm:text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">{config.desc}</p>
      <Link
        to={config.link}
        className="mt-5 sm:mt-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-cairo font-black px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all text-xs sm:text-sm"
      >
        {config.cta}
      </Link>
    </motion.div>
  );
}
