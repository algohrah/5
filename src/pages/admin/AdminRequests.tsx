import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Search, Loader2, AlertCircle, ArrowLeft, Check, X,
  CalendarClock, ChevronLeft, ChevronRight, Filter, Eye, Trash2,
  Clock, ShieldCheck, CreditCard, Activity, LogIn, MessageSquare,
  ShieldAlert, CheckCircle2, XCircle, Ban, Snowflake, RefreshCw, Repeat, MapPin,
  CheckSquare, Square, ListChecks,
} from 'lucide-react';
import { useAdminRequests } from '../../lib/useAdminData';
import { useApp } from '../../lib/AppContext';
import { useReviewMarkers } from '../../lib/useReviewMarkers';
import {
  JOURNEY_STAGES, STAGE_INDEX, STAGE_META, ACCENT_CLASSES, legacyToJourney,
  isTerminal, type JourneyState, TOTAL_FEE_AMOUNT, DEPOSIT_AMOUNT,
} from '../../lib/journey';
import Modal from '../../components/ui/Modal';
import FilterDropdown from '../../components/admin/FilterDropdown';
import ActionMenu from '../../components/admin/ActionMenu';
import PageHeader from '../../components/admin/PageHeader';
import { dataService } from '../../lib/data/DataService';

function stageTitle(s: string): string {
  const m = (STAGE_META as any)[s];
  return m ? m.title : s;
}

const ALL_STATES: (JourneyState | 'all')[] = [
  'all', 'sent', 'accepted', 'seriousness', 'coordination', 'sharia_viewing', 'engagement', 'completed', 'declined', 'cancelled',
];

function stageOf(stage: string): JourneyState {
  const valid = ['sent', 'accepted', 'seriousness', 'coordination', 'sharia_viewing', 'engagement', 'completed', 'declined', 'cancelled'];
  if (valid.includes(stage)) return stage as JourneyState;
  return legacyToJourney(stage);
}

function TargetPartySelector({
  value,
  onChange,
  senderName,
  receiverName,
}: {
  value: 'both' | 'sender' | 'receiver';
  onChange: (v: 'both' | 'sender' | 'receiver') => void;
  senderName?: string;
  receiverName?: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
      <label className="block text-xs font-cairo font-bold text-slate-800 mb-2">
        🎯 الأطراف المستهدفة بالإجراء:
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onChange('both')}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            value === 'both'
              ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <p className="text-xs font-cairo">كلا الطرفين</p>
          <p className="text-[10px] opacity-80 font-cairo">المرسل والمستقبل معاً</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('sender')}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            value === 'sender'
              ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <p className="text-xs font-cairo">المرسِل فقط</p>
          <p className="text-[10px] opacity-80 font-cairo truncate">{senderName || 'المرسل'}</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('receiver')}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            value === 'receiver'
              ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <p className="text-xs font-cairo">المستقبِل فقط</p>
          <p className="text-[10px] opacity-80 font-cairo truncate">{receiverName || 'المستقبل'}</p>
        </button>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'journeys' as const, label: 'الرحلات', icon: Heart },
  { id: 'archive' as const, label: 'الأرشيف', icon: Clock },
];

export default function AdminRequests() {
  const { requests, loading, error, actionLoading, setStage, updateCoordination, getMember, fetchEvents, fetchPayments, deleteRequest,
    moveToStage, delayStage, freezeRequest, unfreezeRequest, reactivateRequest, swapParty, members: adminMembers,
    adminSetPayments, adminRecordPayment, adminConfirmMatch, adminCancelNoMatch, adminSetPledges, adminSetViewingResults, adminSetContacts } =
    useAdminRequests();
  const { showToast, impersonateUser, currentAdminName } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'journeys' | 'archive'>('journeys');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [filter, setFilter] = useState<JourneyState | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'registered' | 'imported'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'stage_progress'>('newest');
  const [coordReq, setCoordReq] = useState<{ id: number; meeting_date?: string; meeting_notes?: string } | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [detailReq, setDetailReq] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'payments' | 'contacts'>('overview');
  const [detailEvents, setDetailEvents] = useState<Array<{ stage: string, at: string, by?: string, reason?: string, note?: string }>>([]);
  const [detailPayments, setDetailPayments] = useState<{ items: Array<{ payer: string, type: string, label: string, at: string, amount: number }>; total: number }>({ items: [], total: 0 });
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // ===== حالة الإجراءات الجماعية والتحديد الإداري =====
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmBulkAdminDelete, setConfirmBulkAdminDelete] = useState(false);

  // ===== التحكم بالرحلة (طرف / طرفين) =====
  const [targetParty, setTargetParty] = useState<'both' | 'sender' | 'receiver'>('both');

  const [advanceFor, setAdvanceFor] = useState<any | null>(null);
  const [advanceReason, setAdvanceReason] = useState('');

  const [moveToStageFor, setMoveToStageFor] = useState<any | null>(null);
  const [moveStageValue, setMoveStageValue] = useState<string>('');
  const [moveStageReason, setMoveStageReason] = useState('');

  const [delayFor, setDelayFor] = useState<any | null>(null);
  const [delayReason, setDelayReason] = useState('');

  const [freezeFor, setFreezeFor] = useState<any | null>(null);
  const [freezeReason, setFreezeReason] = useState('');

  const [reactivateFor, setReactivateFor] = useState<any | null>(null);
  const [reactivateStage, setReactivateStage] = useState<string>('accepted');
  const [reactivateReason, setReactivateReason] = useState('');

  const [swapFor, setSwapFor] = useState<any | null>(null);
  const [swapRole, setSwapRole] = useState<'sender' | 'receiver'>('sender');
  const [swapMemberId, setSwapMemberId] = useState<string>('');
  const [swapReason, setSwapReason] = useState('');

  const [confirmCancel, setConfirmCancel] = useState<any | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // ===== فلاتر وإجراءات الإدارة الإضافية للتحكم بالرحلة كاملة للطرفين =====
  const [editPaymentsFor, setEditPaymentsFor] = useState<any | null>(null);
  const [senderPaidAmount, setSenderPaidAmount] = useState<number>(0);
  const [receiverPaidAmount, setReceiverPaidAmount] = useState<number>(0);
  const [senderStatus, setSenderStatus] = useState<'paid' | 'pending' | 'unpaid'>('unpaid');
  const [receiverStatus, setReceiverStatus] = useState<'paid' | 'pending' | 'unpaid'>('unpaid');
  const [advanceToCoordination, setAdvanceToCoordination] = useState<boolean>(true);
  const [customTotalFee, setCustomTotalFee] = useState<number>(5000);
  const [customDepositFee, setCustomDepositFee] = useState<number>(1000);

  const openPaymentModal = (req: any) => {
    setEditPaymentsFor(req);
    const sender = getMember(req.sender_id);
    const receiver = getMember(req.receiver_id);
    const sAmt = Number(req.sender_paid_amount) || 0;
    const rAmt = Number(req.receiver_paid_amount) || 0;
    setSenderPaidAmount(sAmt);
    setReceiverPaidAmount(rAmt);
    setCustomTotalFee(req.total_fee || TOTAL_FEE_AMOUNT);
    setCustomDepositFee(req.deposit_fee || DEPOSIT_AMOUNT);

    const isSenderImported = sender ? (sender.sourceType === 'imported' || !!(sender as any).importBatchId || !!(sender as any).importOfficeName) : false;
    const isReceiverImported = receiver ? (receiver.sourceType === 'imported' || !!(receiver as any).importBatchId || !!(receiver as any).importOfficeName) : false;

    const isSenderExempt = isSenderImported || (req.sender_paid && sAmt === 0);
    const isReceiverExempt = isReceiverImported || (req.receiver_paid && rAmt === 0);

    const sStat: 'paid' | 'pending' | 'unpaid' = isSenderExempt ? 'paid' : (
      (req.sender_paid || sAmt >= 1000 || req.sender_deposit_status === 'paid') ? 'paid' : 'pending'
    );
    const rStat: 'paid' | 'pending' | 'unpaid' = isReceiverExempt ? 'paid' : (
      (req.receiver_paid || rAmt >= 1000 || req.receiver_deposit_status === 'paid') ? 'paid' : 'pending'
    );
    setSenderStatus(sStat);
    setReceiverStatus(rStat);
    setAdvanceToCoordination(req.journey_stage !== 'coordination' && req.journey_stage !== 'completed');
  };

  // خيارات الإدارة النهائية الحاسمة
  const [confirmMatchFor, setConfirmMatchFor] = useState<any | null>(null);
  const [matchNote, setMatchNote] = useState<string>('');
  const [cancelNoMatchFor, setCancelNoMatchFor] = useState<any | null>(null);
  const [cancelNoMatchReason, setCancelNoMatchReason] = useState<string>('');

  const [editPledgesFor, setEditPledgesFor] = useState<{ id: string | number, male_pledged?: boolean, female_pledged?: boolean } | null>(null);
  const [malePledged, setMalePledged] = useState<boolean>(false);
  const [femalePledged, setFemalePledged] = useState<boolean>(false);

  const [editViewingResultsFor, setEditViewingResultsFor] = useState<{ id: string | number, sender_viewing_result?: string, receiver_viewing_result?: string } | null>(null);
  const [senderViewingResult, setSenderViewingResult] = useState<string>('');
  const [receiverViewingResult, setReceiverViewingResult] = useState<string>('');

  const [editContactsFor, setEditContactsFor] = useState<{ id: string | number, male_phone?: string, male_name?: string, guardian_phone?: string, guardian_name?: string, contact_info?: string } | null>(null);
  const [malePhone, setMalePhone] = useState('');
  const [maleName, setMaleName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handleAcceptRequest = async (req: { id: string | number }) => {
    const ok = await setStage(Number(req.id), 'accepted', 'قبول وتفعيل إداري للطلب');
    if (ok) showLocalToast('تم قبول وتفعيل الطلب بنجاح ✓');
  };

  const showLocalToast = (t: string) => {
    setLocalToast(t);
    setTimeout(() => setLocalToast(null), 2500);
  };

  const impersonateAndGo = (memberId: string) => {
    const member = getMember(memberId);
    if (!member) return;
    impersonateUser({
      id: member.id,
      nickname: member.nickname,
      gender: member.gender,
      age: member.age,
      city: member.city,
      country: member.country,
      realName: member.realName,
      email: member.email,
      phone: member.phone,
      plan: member.plan,
    });
    showLocalToast(`تم الدخول كـ ${member.nickname}`);
    setTimeout(() => navigate('/requests'), 300);
  };

  // ===== دوال التحديد المتعدد والإجراءات الجماعية الإدارية =====
  const toggleAdminSelectAll = () => {
    const currentTabIds = filtered.map((r) => r.id);
    const allSelected = currentTabIds.length > 0 && currentTabIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentTabIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...currentTabIds]));
      setSelectedIds(combined);
    }
  };

  const toggleAdminSelectReq = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAdminDelete = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await deleteRequest(id);
    }
    const count = selectedIds.length;
    setSelectedIds([]);
    setConfirmBulkAdminDelete(false);
    showLocalToast(`تم حذف ${count} من طلبات الرحلات المحددة بنجاح ✓`);
  };

  const handleBulkAdminFreeze = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        if (req.frozen) await unfreezeRequest(id);
        else await freezeRequest(id, 'تجميد جماعي بواسطة الإدارة');
      }
    }
    const count = selectedIds.length;
    setSelectedIds([]);
    showLocalToast(`تم تحديث حالة تجميد ${count} طلب بنجاح ✓`);
  };

  const openDetail = async (req: { id: number; sender_id?: string; receiver_id?: string; journey_stage?: string; message?: string; created_at?: string; notes?: string; admin_notes?: string; [key: string]: unknown }) => {
    setDetailReq(req);
    try {
      const [ev, pay] = await Promise.all([
        fetchEvents(req.id).catch(() => []),
        fetchPayments(req.id).catch(() => [])
      ]);
      
      setDetailEvents(Array.isArray(ev) ? ev : []);
      
      let items: Array<{ payer: string, type: string, label: string, at: string, amount: number }> = [];
      let total = 0;
      if (Array.isArray(pay)) {
        items = pay.map((item: { userId?: string, payer?: string, type?: string, label?: string, paid_at?: string, at?: string, amount?: number }) => ({
          payer: item.userId || item.payer || '',
          type: item.type || 'deposit',
          label: item.label || 'رسوم الجدية',
          at: item.paid_at || item.at || '',
          amount: item.amount || 0,
        }));
        total = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      } else if (pay && typeof pay === 'object') {
        items = Array.isArray((pay as { items?: unknown[] }).items) ? (pay as { items: Array<{ payer: string, type: string, label: string, at: string, amount: number }> }).items : [];
        total = typeof (pay as { total?: unknown }).total === 'number' ? (pay as { total: number }).total : 0;
      }
      setDetailPayments({ items, total });
    } catch (err) {
      console.error(err);
      setDetailEvents([]);
      setDetailPayments({ items: [], total: 0 });
    }
  };

  const summary = useMemo(
    () => {
      const regCount = (requests || []).filter((r) => {
        const s = getMember(r.sender_id);
        const rc = getMember(r.receiver_id);
        return r.source_type === 'registered' || (!r.source_type && s?.sourceType !== 'imported' && rc?.sourceType !== 'imported');
      }).length;
      const impCount = (requests || []).filter((r) => {
        const s = getMember(r.sender_id);
        const rc = getMember(r.receiver_id);
        return r.source_type === 'imported' || s?.sourceType === 'imported' || rc?.sourceType === 'imported';
      }).length;

      return {
        total: (requests || []).length,
        registered: regCount,
        imported: impCount,
        waiting: (requests || []).filter((r) => stageOf(r.journey_stage) === 'sent').length,
        active: (requests || []).filter(
          (r) =>
            !isTerminal(stageOf(r.journey_stage)) &&
            !['sent', 'completed'].includes(stageOf(r.journey_stage))
        ).length,
        completed: (requests || []).filter((r) => stageOf(r.journey_stage) === 'completed').length,
        deposits: (requests || []).reduce((n, r) => n + (r.sender_paid ? 1 : 0) + (r.receiver_paid ? 1 : 0), 0),
      };
    },
    [requests, getMember]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => {
        const st = stageOf(r.journey_stage);
        if (activeTab === 'archive') return isTerminal(st);
        if (activeTab === 'journeys' && isTerminal(st)) return false;
        if (filter !== 'all' && st !== filter) return false;

        const s = getMember(r.sender_id);
        const rc = getMember(r.receiver_id);
        const isImported = r.source_type === 'imported' || s?.sourceType === 'imported' || rc?.sourceType === 'imported';
        const reqSrcType = isImported ? 'imported' : 'registered';
        if (sourceFilter !== 'all' && reqSrcType !== sourceFilter) return false;

        if (q) {
          const reqNum = r.request_number || r.id;
          const reqNumMatch = String(reqNum).includes(q) || `#${reqNum}`.includes(q);
          const rawIdMatch = String(r.id).includes(q) || `#${r.id}`.includes(q);
          const typeMatch = (isImported && (q.includes('مستورد') || q.includes('import'))) ||
            (!isImported && (q.includes('مسجل') || q.includes('عضو') || q.includes('regist')));
          const sMatch = s?.nickname?.toLowerCase().includes(q) || s?.realName?.toLowerCase().includes(q) || s?.phone?.includes(q);
          const rcMatch = rc?.nickname?.toLowerCase().includes(q) || rc?.realName?.toLowerCase().includes(q) || rc?.phone?.includes(q);
          const contactMatch = r.male_phone?.includes(q) || r.guardian_phone?.includes(q) || r.male_name?.toLowerCase().includes(q) || r.guardian_name?.toLowerCase().includes(q);
          return Boolean(reqNumMatch || rawIdMatch || typeMatch || sMatch || rcMatch || contactMatch);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return (Number(a.request_number || a.id) || 0) - (Number(b.request_number || b.id) || 0);
        }
        if (sortBy === 'stage_progress') {
          const stA = stageOf(a.journey_stage);
          const stB = stageOf(b.journey_stage);
          const idxA = STAGE_INDEX[stA as keyof typeof STAGE_INDEX] ?? -1;
          const idxB = STAGE_INDEX[stB as keyof typeof STAGE_INDEX] ?? -1;
          return idxB - idxA;
        }
        return (Number(b.request_number || b.id) || 0) - (Number(a.request_number || a.id) || 0);
      });
  }, [requests, filter, sourceFilter, search, sortBy, getMember, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length };
    requests.forEach((r) => {
      const s = stageOf(r.journey_stage);
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [requests]);

  // ⚠️ يجب أن تبقى كل الـ hooks (بما فيها useMemo) قبل أي return مشروط
  // لتجنّب خطأ React #310 (ترتيب الـ hooks غير الثابت).
  if (error && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
        <p className="font-cairo text-slate-700 font-bold">{error}</p>
      </div>
    );
  }

  /* 
  const advanceStage = async (req: { id: string | number, journey_stage?: string }) => {
    const st = stageOf(req.journey_stage);
    const idx = STAGE_INDEX[st as keyof typeof STAGE_INDEX];
    if (idx === undefined || idx >= JOURNEY_STAGES.length - 1) return;
    const next = JOURNEY_STAGES[idx + 1];
    const ok = await setStage(req.id, next, `تقديم إداري للمرحلة: ${STAGE_META[next].title}`);
    if (ok) showLocalToast(`تم النقل لمرحلة: ${STAGE_META[next].title} ✓`);
  };
  */

  return (
    <div className="space-y-5">
      <PageHeader icon={Heart} title="رحلات التوافق للزواج" subtitle="إدارة رحلات التوافق للزواج من الطلب حتى الإتمام" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'كل الطلبات', value: summary.total, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'بانتظار الرد', value: summary.waiting, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'رحلات نشطة', value: summary.active, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'مكتملة', value: summary.completed, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'رسوم مدفوعة', value: summary.deposits, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3`}>
              <Icon className={`w-5 h-5 ${s.color} mb-1`} />
              <p className={`font-cairo font-extrabold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-500 font-cairo">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilter('all');
                setSearch('');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-cairo font-bold text-xs transition-colors ${
                activeTab === tab.id
                  ? 'text-slate-900 border-b-2 border-amber-500 bg-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {true && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم الطلب #ID، الأسماء، أو رقم الهاتف..."
                className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-xs shadow-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-cairo text-xs font-bold focus:border-amber-400 focus:outline-none shadow-xs"
              >
                <option value="newest">الترتيب: الأحدث أولاً</option>
                <option value="oldest">الترتيب: الأقدم أولاً</option>
                <option value="stage_progress">الترتيب: حسب التقدّم</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const nextMode = !isSelectionMode;
                setIsSelectionMode(nextMode);
                if (!nextMode) setSelectedIds([]);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelectionMode
                  ? 'bg-amber-500 text-navy-950 font-black shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}</span>
            </button>

            {isSelectionMode && filtered.length > 0 && (
              <button
                onClick={toggleAdminSelectAll}
                className="px-3 py-2 rounded-xl text-xs font-cairo font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ListChecks className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))
                    ? 'إلغاء تحديد الجميع'
                    : 'تحديد الجميع'}
                </span>
              </button>
            )}

            <FilterDropdown
              label="المرحلة:"
              value={filter}
              onChange={(v) => setFilter(v as JourneyState | 'all')}
              options={ALL_STATES.map((s) => ({
                value: s,
                label: s === 'all' ? 'كل المراحل' : stageTitle(s),
                count: counts[s] || 0,
              }))}
            />

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-cairo">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  sourceFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                الكل ({summary.total})
              </button>
              <button
                onClick={() => setSourceFilter('registered')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sourceFilter === 'registered'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sourceFilter === 'registered' ? 'bg-white' : 'bg-blue-500'}`} />
                المسجلون ({summary.registered})
              </button>
              <button
                onClick={() => setSourceFilter('imported')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sourceFilter === 'imported'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-purple-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sourceFilter === 'imported' ? 'bg-white' : 'bg-purple-500'}`} />
                المستوردون ({summary.imported})
              </button>
            </div>

            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs font-cairo font-bold text-amber-600 hover:underline px-1">
                مسح الفلتر
              </button>
            )}
            <span className="mr-auto text-xs font-cairo text-slate-400 font-bold">{filtered.length} نتيجة</span>
          </div>
        </div>
      )}

      {true && (
        <div className="space-y-3 relative">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-cairo text-slate-500">لا توجد طلبات في هذا التصنيف</p>
            </div>
          )}
          {filtered.map((req) => {
            const st = stageOf(req.journey_stage);
            const meta = STAGE_META[st];
            const c = ACCENT_CLASSES[meta.accent];
            const Icon = meta.icon;
            const sender = getMember(req.sender_id);
            const receiver = getMember(req.receiver_id);
            const isImported = req.source_type === 'imported' || sender?.sourceType === 'imported' || receiver?.sourceType === 'imported';
            const displayReqNumber = req.request_number || req.id;
            const idx = isTerminal(st) ? -1 : STAGE_INDEX[st as keyof typeof STAGE_INDEX];
            const canAdvance = !isTerminal(st) && idx < JOURNEY_STAGES.length - 1;
            const busy = actionLoading === req.id;
            const isSelected = selectedIds.includes(req.id);

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={isSelectionMode ? () => toggleAdminSelectReq(req.id) : undefined}
                className={`bg-white rounded-2xl border transition-all duration-150 relative overflow-visible ${
                  isSelectionMode ? 'cursor-pointer select-none' : ''
                } ${
                  isSelected
                    ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/20'
                    : openMenuId === req.id
                    ? 'z-40 shadow-lg ring-1 ring-amber-500/15 bg-amber-50/5 border-slate-200'
                    : 'z-10 hover:z-20 border-slate-200 shadow-sm'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAdminSelectReq(req.id);
                        }}
                        className="p-1 text-amber-500 hover:text-amber-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-500 fill-amber-100" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    )}
                    <PartyChip member={sender} role="المرسِل" />
                    <ArrowLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <PartyChip member={receiver} role="المستقبِل" />
                    <span className={`mr-auto inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-2.5 py-1 rounded-full ${c.bgSoft} ${c.text}`}>
                      <Icon className="w-3.5 h-3.5" /> {meta.title}
                    </span>
                    {req.frozen && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-600">
                        <Snowflake className="w-3.5 h-3.5" /> مُجمّد
                      </span>
                    )}
                  </div>

                  {((!sender || (sender.status as any) === 'deleted' || sender.deleted) || (!receiver || (receiver.status as any) === 'deleted' || receiver.deleted)) && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 mb-3 text-xs font-cairo font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>تنبيه إداري: أحد أطراف هذه الرحلة تم حذف حسابه أو غير متاح في المنصة.</span>
                    </div>
                  )}

                  {req.message && (
                    <p className="text-xs text-slate-500 font-tajawal bg-slate-50 rounded-xl p-2.5 mb-3 leading-relaxed">
                      "{req.message}"
                    </p>
                  )}

                  {!isTerminal(st) && (
                    <div className="flex items-center gap-1 mb-3">
                      {JOURNEY_STAGES.map((sk, i) => (
                        <div key={sk} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i < idx ? 'bg-emerald-400' : i === idx ? c.dot : 'bg-slate-200'}`} />
                          {i < JOURNEY_STAGES.length - 1 && (
                            <div className={`h-0.5 flex-1 ${i < idx ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-cairo">
                    {isImported ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200/80 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        طلب مستوردين #{displayReqNumber}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/80 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        طلب مسجلين #{displayReqNumber}
                      </span>
                    )}
                    {(() => {
                      const totalFee = req.total_fee || TOTAL_FEE_AMOUNT;
                      const sAmt = Number(req.sender_paid_amount) || 0;
                      const rAmt = Number(req.receiver_paid_amount) || 0;
                      const isSenderImported = sender ? (sender.sourceType === 'imported' || !!(sender as any).importBatchId || !!(sender as any).importOfficeName) : false;
                      const isReceiverImported = receiver ? (receiver.sourceType === 'imported' || !!(receiver as any).importBatchId || !!(receiver as any).importOfficeName) : false;
                      const isSenderExempt = isSenderImported || (req.sender_paid && sAmt === 0);
                      const isReceiverExempt = isReceiverImported || (req.receiver_paid && rAmt === 0);

                      const sStat: 'paid' | 'pending' | 'unpaid' = isSenderExempt ? 'paid' : (
                        (req.sender_paid || sAmt >= 1000 || req.sender_deposit_status === 'paid') ? 'paid' : 'pending'
                      );
                      const rStat: 'paid' | 'pending' | 'unpaid' = isReceiverExempt ? 'paid' : (
                        (req.receiver_paid || rAmt >= 1000 || req.receiver_deposit_status === 'paid') ? 'paid' : 'pending'
                      );

                      return (
                        <>
                          <span className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 font-bold ${
                            isSenderExempt ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                            sStat === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            المرسِل: {isSenderExempt ? 'معفي (عضو مستورد) ✓' : sStat === 'paid' ? `مسدد (${sAmt.toLocaleString('ar-QA')} ر.ق) ✓` : `بانتظار السداد (${sAmt > 0 ? `${sAmt.toLocaleString('ar-QA')} ر.ق` : '1,000 ر.ق'})`}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 font-bold ${
                            isReceiverExempt ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                            rStat === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            المستقبِل: {isReceiverExempt ? 'معفي (عضو مستورد) ✓' : rStat === 'paid' ? `مسدد (${rAmt.toLocaleString('ar-QA')} ر.ق) ✓` : `بانتظار السداد (${rAmt > 0 ? `${rAmt.toLocaleString('ar-QA')} ر.ق` : '1,000 ر.ق'})`}
                          </span>
                        </>
                      );
                    })()}
                    {(req.male_phone || req.guardian_phone || req.contact_info) && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold flex items-center gap-1">
                        📱 بيانات التواصل متوفرة
                      </span>
                    )}
                    {req.meeting_date && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> {req.meeting_date}
                      </span>
                    )}
                  </div>

                  {(req.decline_reason || req.cancel_reason) && (
                    <p className="text-[11px] font-cairo text-rose-600 bg-rose-50 rounded-md px-2 py-1 mb-3">
                      السبب: {req.decline_reason || req.cancel_reason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openDetail(req)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-cairo font-bold text-xs flex items-center gap-1 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> التفاصيل
                    </button>

                    {st === 'sent' && (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-cairo font-bold text-xs flex items-center gap-1 transition-colors"
                          title="قبول وتفعيل الطلب"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> قبول
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDecline(req);
                            setDeclineReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-cairo font-bold text-xs flex items-center gap-1 transition-colors"
                          title="رفض الطلب"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" /> رفض
                        </button>
                      </>
                    )}

                    {(st === 'accepted' || st === 'seriousness' || st === 'coordination') && (
                      <button
                        onClick={() => openPaymentModal(req)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-cairo font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" /> إدارة وسداد العربون
                      </button>
                    )}

                    {st === 'coordination' && (
                      <>
                        <button
                          onClick={() => {
                            setConfirmMatchFor(req);
                            setMatchNote('تم عقد القران وتسليم المهر بفضل الله وتوفيقه');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-cairo font-extrabold text-xs flex items-center gap-1 hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" /> حدث نصيب وتم تسليم المهر
                        </button>
                        <button
                          onClick={() => {
                            setCancelNoMatchFor(req);
                            setCancelNoMatchReason('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-cairo font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> لم يحدث نصيب
                        </button>
                        <button
                          onClick={() => {
                            setEditPaymentsFor(req);
                            setSenderPaidAmount(req.sender_paid_amount ?? (req.sender_paid ? 1000 : 0));
                            setReceiverPaidAmount(req.receiver_paid_amount ?? (req.receiver_paid ? 1000 : 0));
                            setAdvanceToCoordination(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-cairo font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-600" /> مبالغ الأتعاب
                        </button>
                      </>
                    )}

                    <div className="mr-auto">
                      <ActionMenu
                        busy={busy}
                        onOpenChange={(isOpen) => setOpenMenuId(isOpen ? req.id : null)}
                        items={[
                          // القسم 1: إدارة الحسابات
                          { sectionHeader: '👤 إدارة الحسابات والأطراف', label: '', icon: <></>, onClick: () => {} },
                          {
                            label: 'الدخول كـ المرسِل',
                            icon: <LogIn className="w-4 h-4 text-blue-500" />,
                            variant: 'primary',
                            hidden: !sender,
                            onClick: () => impersonateAndGo(req.sender_id),
                          },
                          {
                            label: 'الدخول كـ المستقبِل',
                            icon: <LogIn className="w-4 h-4 text-rose-500" />,
                            variant: 'primary',
                            hidden: !receiver,
                            onClick: () => impersonateAndGo(req.receiver_id),
                          },
                          {
                            label: 'تبديل طرف بالطلب',
                            icon: <Repeat className="w-4 h-4 text-amber-500" />,
                            hidden: isTerminal(st),
                            onClick: () => {
                              setSwapFor(req);
                              setSwapRole('sender');
                              setSwapMemberId('');
                              setSwapReason('');
                            },
                          },

                          // القسم 2: التحكم بالرحلة والمراحل
                          { sectionHeader: '⚡ التحكم بالرحلة (طرف / طرفين)', label: '', icon: <></>, onClick: () => {} },
                          {
                            label: 'تقديم للمرحلة التالية (طرف/طرفين)',
                            icon: <ChevronLeft className="w-4 h-4 text-emerald-600" />,
                            variant: 'success',
                            hidden: !canAdvance || req.frozen,
                            onClick: () => {
                              setAdvanceFor(req);
                              setTargetParty('both');
                              setAdvanceReason('');
                            },
                          },
                          {
                            label: 'نقل لأي مرحلة (طرف/طرفين)',
                            icon: <MapPin className="w-4 h-4 text-sky-600" />,
                            variant: 'primary',
                            hidden: isTerminal(st),
                            onClick: () => {
                              setMoveToStageFor(req);
                              setMoveStageValue(st);
                              setMoveStageReason('');
                              setTargetParty('both');
                            },
                          },
                          {
                            label: 'تأخير مرحلة (رجوع خطوة)',
                            icon: <ChevronRight className="w-4 h-4 text-amber-600" />,
                            hidden: isTerminal(st) || idx <= 0,
                            onClick: () => {
                              setDelayFor(req);
                              setDelayReason('');
                              setTargetParty('both');
                            },
                          },
                          {
                            label: req.frozen ? 'إلغاء تجميد الطلب' : 'تجميد الطلب (طرف/طرفين)',
                            icon: <Snowflake className="w-4 h-4 text-sky-500" />,
                            variant: req.frozen ? 'success' : undefined,
                            hidden: isTerminal(st),
                            onClick: () => {
                              if (req.frozen) {
                                unfreezeRequest(req.id).then((ok) => ok && showLocalToast('تم إلغاء التجميد ✓'));
                              } else {
                                setFreezeFor(req);
                                setFreezeReason('');
                                setTargetParty('both');
                              }
                            },
                          },
                          {
                            label: 'تحديد موعد التنسيق',
                            icon: <CalendarClock className="w-4 h-4 text-purple-600" />,
                            variant: 'primary',
                            hidden: isTerminal(st) || st !== 'coordination',
                            onClick: () => {
                              setCoordReq(req);
                              setMeetingDate(req.meeting_date || '');
                              setMeetingNotes(req.meeting_notes || '');
                            },
                          },

                          // القسم 3: تعديل البيانات والسجلات
                          { sectionHeader: '📝 تعديل البيانات والسجلات والمدفوعات', label: '', icon: <></>, onClick: () => {} },
                          {
                            label: 'تسجيل المدفوعات ونقل للتنسيق',
                            icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
                            variant: 'primary',
                            onClick: () => {
                              setEditPaymentsFor(req);
                              setSenderPaidAmount(req.sender_paid_amount ?? (req.sender_paid ? 1000 : 0));
                              setReceiverPaidAmount(req.receiver_paid_amount ?? (req.receiver_paid ? 1000 : 0));
                              setAdvanceToCoordination(st !== 'coordination');
                            },
                          },
                          {
                            label: 'تعديل تعهدات الجدية والعهد',
                            icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
                            onClick: () => {
                              setEditPledgesFor(req);
                              setMalePledged(!!req.male_pledged);
                              setFemalePledged(!!req.female_pledged);
                            },
                          },
                          {
                            label: 'تعديل بيانات التواصل مباشرة',
                            icon: <Repeat className="w-4 h-4 text-sky-500" />,
                            onClick: () => {
                              setEditContactsFor(req);
                              setMalePhone(req.male_phone || '');
                              setMaleName(req.male_name || '');
                              setGuardianPhone(req.guardian_phone || '');
                              setGuardianName(req.guardian_name || '');
                              setContactInfo(req.contact_info || '');
                            },
                          },

                          // القسم 4: الإجراءات الحاسمة
                          { sectionHeader: '⚠️ الإجراءات الحاسمة والأرشيف', label: '', icon: <></>, onClick: () => {} },
                          {
                            label: 'حدث نصيب وتم تسليم المهر',
                            icon: <Heart className="w-4 h-4 text-emerald-600 fill-emerald-100" />,
                            variant: 'success',
                            hidden: isTerminal(st) || st === 'sent',
                            onClick: () => {
                              setConfirmMatchFor(req);
                              setMatchNote('تم عقد القران وتسليم المهر وتوثيق الزواج بنجاح');
                            },
                          },
                          {
                            label: 'لم يحدث نصيب (إنهاء وإلغاء)',
                            icon: <X className="w-4 h-4 text-amber-600" />,
                            variant: 'danger',
                            hidden: isTerminal(st),
                            onClick: () => {
                              setCancelNoMatchFor(req);
                              setCancelNoMatchReason('');
                            },
                          },
                          {
                            label: 'قبول وتفعيل الطلب (بالنيابة)',
                            icon: <Check className="w-4 h-4 text-emerald-600" />,
                            variant: 'success',
                            hidden: isTerminal(st) || st === 'accepted' || st === 'completed',
                            onClick: () => handleAcceptRequest(req),
                          },
                          {
                            label: 'إعادة تفعيل طلب منتهٍ',
                            icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
                            hidden: !isTerminal(st),
                            onClick: () => {
                              setReactivateFor(req);
                              setReactivateStage('accepted');
                              setReactivateReason('');
                            },
                          },
                          {
                            label: 'رفض/اعتذار عن الطلب (بالنيابة)',
                            icon: <X className="w-4 h-4 text-rose-600" />,
                            variant: 'danger',
                            hidden: isTerminal(st),
                            onClick: () => {
                              setConfirmDecline(req);
                              setDeclineReason('');
                            },
                          },
                          {
                            label: 'إلغاء الطلب نهائياً',
                            icon: <X className="w-4 h-4 text-rose-600" />,
                            variant: 'danger',
                            hidden: isTerminal(st) || st === 'completed',
                            onClick: () => setConfirmCancel(req),
                          },
                          {
                            label: 'حذف نهائي',
                            icon: <Trash2 className="w-4 h-4 text-rose-700" />,
                            variant: 'danger',
                            onClick: () => setConfirmDelete(req),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!detailReq}
        onClose={() => setDetailReq(null)}
        title={`تفاصيل الطلب ${detailReq ? ((detailReq.source_type === 'imported' || getMember(detailReq.sender_id)?.sourceType === 'imported' || getMember(detailReq.receiver_id)?.sourceType === 'imported') ? `(مستوردين #${detailReq.request_number || detailReq.id})` : `(مسجلين #${detailReq.request_number || detailReq.id})`) : ''}`}
        size="lg"
      >
        {detailReq &&
          (() => {
            const st = stageOf(detailReq.journey_stage);
            const meta = STAGE_META[st];
            const c = ACCENT_CLASSES[meta.accent];
            const sender = getMember(detailReq.sender_id);
            const receiver = getMember(detailReq.receiver_id);
            const isImported = detailReq.source_type === 'imported' || sender?.sourceType === 'imported' || receiver?.sourceType === 'imported';
            const displayNum = detailReq.request_number || detailReq.id;
            return (
              <div className="space-y-4">
                {/* رأس النافذة مع الطرفين */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isImported ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-cairo font-bold text-xs border border-purple-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        طلب مستوردين #{displayNum}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-cairo font-bold text-xs border border-blue-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        طلب مسجلين #{displayNum}
                      </span>
                    )}
                    <PartyChip member={sender} role="المرسِل" />
                    <ArrowLeft className="w-4 h-4 text-slate-300" />
                    <PartyChip member={receiver} role="المستقبِل" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-3 py-1 rounded-full ${c.bgSoft} ${c.text}`}>
                    {meta.title}
                  </span>
                </div>

                {/* شريط التنقل الداخلي للتفاصيل */}
                <div className="flex border-b border-slate-200 gap-2">
                  <button
                    onClick={() => setDetailTab('overview')}
                    className={`pb-2 px-3 text-xs font-cairo font-bold border-b-2 transition-colors ${
                      detailTab === 'overview'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    نظرة عامة والرحلة
                  </button>
                  <button
                    onClick={() => setDetailTab('payments')}
                    className={`pb-2 px-3 text-xs font-cairo font-bold border-b-2 transition-colors ${
                      detailTab === 'payments'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    السداد والمدفوعات ({detailPayments.total} ر.س)
                  </button>
                  <button
                    onClick={() => setDetailTab('contacts')}
                    className={`pb-2 px-3 text-xs font-cairo font-bold border-b-2 transition-colors ${
                      detailTab === 'contacts'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    بيانات التواصل
                  </button>
                </div>

                {/* التبويب 1: نظرة عامة */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    {detailReq.message && (
                      <p className="text-xs text-slate-700 font-tajawal bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 leading-relaxed">
                        <strong>رسالة الطلب:</strong> "{detailReq.message}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => impersonateAndGo(detailReq.sender_id)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-l from-slate-900 to-slate-800 text-amber-300 font-cairo font-bold text-xs hover:brightness-110 transition-all border border-amber-500/30"
                      >
                        <LogIn className="w-3.5 h-3.5" /> دخول كـ المرسِل
                      </button>
                      <button
                        onClick={() => impersonateAndGo(detailReq.receiver_id)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-l from-slate-900 to-slate-800 text-amber-300 font-cairo font-bold text-xs hover:brightness-110 transition-all border border-amber-500/30"
                      >
                        <LogIn className="w-3.5 h-3.5" /> دخول كـ المستقبِل
                      </button>
                    </div>

                    {detailReq.meeting_date && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
                        <span className="flex items-center gap-1.5 text-blue-700 font-cairo font-bold mb-1">
                          <CalendarClock className="w-4 h-4" /> موعد التنسيق المحدد
                        </span>
                        <p className="font-cairo text-slate-800 font-bold">{detailReq.meeting_date}</p>
                        {detailReq.meeting_notes && <p className="text-xs text-slate-600 font-cairo mt-1">{detailReq.meeting_notes}</p>}
                      </div>
                    )}

                    <div>
                      <h4 className="font-cairo font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-500" /> سجل الأحداث والتنقلات
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {detailEvents.length === 0 && <p className="text-xs text-slate-400 font-cairo text-center py-3">لا توجد أحداث مسجّلة بعد</p>}
                        {detailEvents.map((ev: any, evIdx: number) => (
                          <div key={ev.id || evIdx} className="flex items-start gap-2 text-xs font-cairo bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-slate-800 font-bold">{ev.note}</p>
                              <p className="text-[10px] text-slate-400">{(ev.created_at || ev.at) ? new Date(ev.created_at || ev.at).toLocaleString('ar-SA') : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* التبويب 2: المدفوعات */}
                {/* التبويب 2: المدفوعات */}
                {detailTab === 'payments' && (
                  <div className="space-y-4">
                    {(() => {
                      const totalFee = detailReq.total_fee || TOTAL_FEE_AMOUNT;
                      const depositFee = detailReq.deposit_fee || DEPOSIT_AMOUNT;
                      const sAmt = detailReq.sender_paid_amount ?? (detailReq.sender_paid ? 1000 : 0);
                      const rAmt = detailReq.receiver_paid_amount ?? (detailReq.receiver_paid ? 1000 : 0);
                      const sRem = Math.max(0, totalFee - sAmt);
                      const rRem = Math.max(0, totalFee - rAmt);

                      const isSenderImported = sender ? (sender.sourceType === 'imported' || !!(sender as any).importBatchId || !!(sender as any).importOfficeName) : false;
                      const isReceiverImported = receiver ? (receiver.sourceType === 'imported' || !!(receiver as any).importBatchId || !!(receiver as any).importOfficeName) : false;
                      const isSenderExempt = isSenderImported || (detailReq.sender_paid && sAmt === 0);
                      const isReceiverExempt = isReceiverImported || (detailReq.receiver_paid && rAmt === 0);

                      return (
                        <>
                          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-cairo">
                            <div>
                              <span className="font-bold text-amber-900 block">إجمالي أتعاب التوافق المقررة</span>
                              <span className="text-[11px] text-amber-700">العربون المطلوب لبدء التنسيق: {depositFee.toLocaleString('ar-QA')} ر.ق</span>
                            </div>
                            <span className="font-extrabold text-base text-amber-800">{totalFee.toLocaleString('ar-QA')} ر.ق</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-cairo">
                            <div className={`p-3 rounded-xl border ${isSenderExempt ? 'bg-purple-50/80 border-purple-200 text-purple-900' : sAmt > 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
                              <p className="font-bold flex items-center justify-between">
                                <span>سداد المرسِل ({sender?.nickname || 'المرسل'})</span>
                                {isSenderImported && <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">مستورد</span>}
                              </p>
                              <p className={`text-sm font-black mt-1 ${isSenderExempt ? 'text-purple-800' : sAmt > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                                {isSenderExempt ? 'معفي إدارياً (0 ر.ق) ✓' : sAmt > 0 ? `المدفوع: ${sAmt.toLocaleString('ar-QA')} ر.ق ✓` : 'بانتظار السداد (1,000 ر.ق)'}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                المتبقي من الأتعاب: <strong className="text-slate-800">{sRem.toLocaleString('ar-QA')} ر.ق</strong>
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isReceiverExempt ? 'bg-purple-50/80 border-purple-200 text-purple-900' : rAmt > 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
                              <p className="font-bold flex items-center justify-between">
                                <span>سداد المستقبِل ({receiver?.nickname || 'المستقبل'})</span>
                                {isReceiverImported && <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">مستورد</span>}
                              </p>
                              <p className={`text-sm font-black mt-1 ${isReceiverExempt ? 'text-purple-800' : rAmt > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                                {isReceiverExempt ? 'معفي إدارياً (0 ر.ق) ✓' : rAmt > 0 ? `المدفوع: ${rAmt.toLocaleString('ar-QA')} ر.ق ✓` : 'بانتظار السداد (1,000 ر.ق)'}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                المتبقي من الأتعاب: <strong className="text-slate-800">{rRem.toLocaleString('ar-QA')} ر.ق</strong>
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-cairo font-bold text-xs text-slate-700 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-500" /> تفاصيل المدفوعات المسجلة
                        </h4>
                        <button
                          onClick={() => openPaymentModal(detailReq)}
                          className="text-xs font-cairo font-bold text-amber-600 hover:underline"
                        >
                          تعديل / إدخال مبالغ وحالة الدفع
                        </button>
                      </div>

                      {detailPayments.items.length === 0 ? (
                        <p className="text-xs text-slate-400 font-cairo text-center py-4 bg-slate-50 rounded-xl">لا توجد عمليات سداد مسجلة بعد</p>
                      ) : (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                          {detailPayments.items.map((p, i) => {
                            const payer = p.payer === 'الطرفان' ? 'الطرفان' : (getMember(p.payer)?.nickname || p.payer);
                            const typeColor = p.type === 'deposit' ? 'text-amber-600' : p.type === 'inquiry' ? 'text-slate-500' : 'text-emerald-600';
                            return (
                              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-200 last:border-0">
                                <div className="min-w-0">
                                  <p className={`text-xs font-cairo font-bold ${typeColor}`}>{p.label}</p>
                                  <p className="text-[10px] text-slate-400 font-cairo">
                                    {payer}{p.at ? ` · ${new Date(p.at).toLocaleDateString('ar-SA')}` : ''}
                                  </p>
                                </div>
                                <span className="font-cairo font-extrabold text-sm text-slate-800 flex-shrink-0">{p.amount} ر.ق</span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border-t border-emerald-200">
                            <span className="text-xs font-cairo font-bold text-emerald-800">إجمالي مدفوعات الرحلة</span>
                            <span className="font-cairo font-black text-base text-emerald-700">{detailPayments.total} ر.ق</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* التبويب 3: بيانات التواصل */}
                {detailTab === 'contacts' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-cairo font-bold text-xs text-slate-700">📱 أرقام وهواتف التواصل المتاحة للطلب</h4>
                      <button
                        onClick={() => {
                          setEditContactsFor(detailReq);
                          setMalePhone(detailReq.male_phone || '');
                          setMaleName(detailReq.male_name || '');
                          setGuardianPhone(detailReq.guardian_phone || '');
                          setGuardianName(detailReq.guardian_name || '');
                          setContactInfo(detailReq.contact_info || '');
                        }}
                        className="text-xs font-cairo font-bold text-amber-600 hover:underline"
                      >
                        تحديث البيانات
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 font-cairo text-xs">
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-slate-500">رقم المرسِل ({sender?.nickname || 'المرسل'}):</span>
                        <span className="font-bold text-slate-900">{sender?.phone || 'غير مسجّل'}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-slate-500">رقم المستقبِل ({receiver?.nickname || 'المستقبل'}):</span>
                        <span className="font-bold text-slate-900">{receiver?.phone || 'غير مسجّل'}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-slate-500">هاتف المتقدم الذكر:</span>
                        <span className="font-bold text-slate-900">{detailReq.male_phone || 'غير محدد'} {detailReq.male_name ? `(${detailReq.male_name})` : ''}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-slate-500">هاتف ولي الأمر:</span>
                        <span className="font-bold text-slate-900">{detailReq.guardian_phone || 'غير محدد'} {detailReq.guardian_name ? `(${detailReq.guardian_name})` : ''}</span>
                      </div>
                      {detailReq.contact_info && (
                        <div className="p-3 bg-amber-50/50">
                          <span className="text-slate-500 block mb-1">ملاحظات التواصل الإضافية:</span>
                          <span className="font-bold text-slate-800 leading-relaxed">{detailReq.contact_info}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="حذف الطلب">
        <p className="text-sm text-slate-600 font-tajawal mb-4">
          هل أنت متأكد من حذف هذا الطلب وسجله بالكامل؟ لا يمكن التراجع.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (confirmDelete) {
                await deleteRequest(Number(confirmDelete.id));
                setConfirmDelete(null);
                showLocalToast('تم حذف الطلب');
              }
            }}
            className="flex-1 bg-rose-deep text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> حذف نهائي
          </button>
          <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-slate-100 text-slate-600 font-cairo font-bold py-3 rounded-xl">
            إلغاء
          </button>
        </div>
      </Modal>

      <Modal open={!!coordReq} onClose={() => setCoordReq(null)} title="تحديد موعد التنسيق">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-cairo font-bold text-slate-600 mb-1">الموعد</label>
            <input
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              placeholder="مثال: 2026-07-10 الساعة 8 مساءً"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs font-cairo font-bold text-slate-600 mb-1">ملاحظات</label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              rows={3}
              placeholder="تفاصيل التنسيق..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button
            onClick={async () => {
              if (!coordReq) return;
              const ok = await updateCoordination(coordReq.id, meetingDate, meetingNotes);
              setCoordReq(null);
              if (ok) showLocalToast('تم حفظ الموعد ✓');
            }}
            className="w-full bg-blue-500 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> حفظ الموعد
          </button>
        </div>
      </Modal>

      {/* ===== نافذة تأكيد الإلغاء ===== */}
      <Modal open={!!confirmCancel} onClose={() => setConfirmCancel(null)} title="تأكيد إلغاء الطلب">
        {confirmCancel && (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-cairo leading-relaxed">
                سيتم إلغاء الطلب بين <strong>{getMember(confirmCancel.sender_id)?.nickname || 'المرسِل'}</strong> و <strong>{getMember(confirmCancel.receiver_id)?.nickname || 'المستقبِل'}</strong> وإشعار الطرفين.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const ok = await setStage(confirmCancel.id, 'cancelled', 'إلغاء إداري');
                  setConfirmCancel(null);
                  if (ok) showLocalToast('تم إلغاء الطلب');
                }}
                className="flex-1 bg-rose-600 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors"
              >
                <X className="w-4 h-4" /> نعم، إلغاء الطلب
              </button>
              <button onClick={() => setConfirmCancel(null)} className="flex-1 bg-slate-100 text-slate-600 font-cairo font-bold py-3 rounded-xl">
                تراجع
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== نافذة تأكيد الرفض/الاعتذار ===== */}
      <Modal open={!!confirmDecline} onClose={() => setConfirmDecline(null)} title="تأكيد رفض واعتذار عن الطلب">
        {confirmDecline && (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-cairo leading-relaxed">
                سيتم رفض الطلب واعتذاره بين <strong>{getMember(confirmDecline.sender_id)?.nickname || 'المرسِل'}</strong> و <strong>{getMember(confirmDecline.receiver_id)?.nickname || 'المستقبِل'}</strong> وتحويله لمرحلة "اعتذار".
              </p>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5 font-tajawal">سبب الرفض/الاعتذار (اختياري)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="مثال: عدم ملاءمة الشروط، رغبة الطرف الثاني..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const ok = await setStage(confirmDecline.id, 'declined', declineReason.trim() || 'اعتذار إداري عن الطلب');
                  setConfirmDecline(null);
                  if (ok) showLocalToast('تم رفض واعتذار الطلب ✓');
                }}
                className="flex-1 bg-rose-600 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors"
              >
                <X className="w-4 h-4" /> نعم، ارفض الطلب
              </button>
              <button onClick={() => setConfirmDecline(null)} className="flex-1 bg-slate-100 text-slate-600 font-cairo font-bold py-3 rounded-xl">
                تراجع
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تقديم للمرحلة التالية ===== */}
      <Modal open={!!advanceFor} onClose={() => setAdvanceFor(null)} title="تقديم الطلب للمرحلة التالية">
        {advanceFor && (
          <div className="space-y-4">
            <TargetPartySelector
              value={targetParty}
              onChange={setTargetParty}
              senderName={getMember(advanceFor.sender_id)?.nickname}
              receiverName={getMember(advanceFor.receiver_id)?.nickname}
            />

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
              <ChevronLeft className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-cairo leading-relaxed">
                المرحلة الحالية: <strong>{stageTitle(advanceFor.journey_stage)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">ملاحظات/سبب التقديم الإداري (اختياري)</label>
              <textarea
                value={advanceReason}
                onChange={(e) => setAdvanceReason(e.target.value)}
                rows={2}
                placeholder="مثال: استيفاء الشروط تلفونياً، موافقة شفهية..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-xs"
              />
            </div>

            <button
              onClick={async () => {
                const st = stageOf(advanceFor.journey_stage);
                const idx = STAGE_INDEX[st as keyof typeof STAGE_INDEX];
                if (idx === undefined || idx >= JOURNEY_STAGES.length - 1) return;
                const next = JOURNEY_STAGES[idx + 1];

                let targetText = 'كلا الطرفين';
                if (targetParty === 'sender') targetText = `المرسِل (${getMember(advanceFor.sender_id)?.nickname || 'المرسل'}) فقط`;
                if (targetParty === 'receiver') targetText = `المستقبِل (${getMember(advanceFor.receiver_id)?.nickname || 'المستقبل'}) فقط`;

                const note = `تقديم إداري لـ [${targetText}] للمرحلة (${STAGE_META[next].title})${advanceReason.trim() ? ` — السبب: ${advanceReason.trim()}` : ''}`;
                const ok = await setStage(advanceFor.id, next, note);
                if (ok) {
                  showLocalToast(`تم تقديم الطلب لـ (${targetText}) للمرحلة التاليّة ✓`);
                  setAdvanceFor(null);
                  setAdvanceReason('');
                  setTargetParty('both');
                }
              }}
              className="w-full bg-emerald-600 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" /> تأكيد تقديم الطلب
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: نقل لأي مرحلة ===== */}
      <Modal open={!!moveToStageFor} onClose={() => setMoveToStageFor(null)} title="نقل الطلب لمرحلة محددة">
        {moveToStageFor && (
          <div className="space-y-4">
            <TargetPartySelector
              value={targetParty}
              onChange={setTargetParty}
              senderName={getMember(moveToStageFor.sender_id)?.nickname}
              receiverName={getMember(moveToStageFor.receiver_id)?.nickname}
            />

            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">المرحلة المستهدفة</label>
              <select
                value={moveStageValue}
                onChange={(e) => setMoveStageValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              >
                {JOURNEY_STAGES.map((s) => (
                  <option key={`move-stage-opt-${s}`} value={s}>{STAGE_META[s].title}</option>
                ))}
                <option key="move-stage-opt-declined" value="declined">اعتذار (منتهٍ)</option>
                <option key="move-stage-opt-cancelled" value="cancelled">إلغاء (منتهٍ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">سبب النقل <span className="text-rose-500">*</span></label>
              <textarea
                value={moveStageReason}
                onChange={(e) => setMoveStageReason(e.target.value)}
                rows={3}
                placeholder="مثال: خطأ في المرحلة، طلب العضو، تعديل إداري..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!moveStageReason.trim()) return;
                let targetText = 'كلا الطرفين';
                if (targetParty === 'sender') targetText = `المرسِل (${getMember(moveToStageFor.sender_id)?.nickname || 'المرسل'}) فقط`;
                if (targetParty === 'receiver') targetText = `المستقبِل (${getMember(moveToStageFor.receiver_id)?.nickname || 'المستقبل'}) فقط`;

                const note = `نقل إداري لـ [${targetText}] لمرحلة (${stageTitle(moveStageValue)}) — السبب: ${moveStageReason.trim()}`;
                const ok = await moveToStage(moveToStageFor.id, moveStageValue, note);
                if (ok) {
                  showLocalToast(`تم نقل الطلب لـ (${targetText}) ✓`);
                  setMoveToStageFor(null);
                  setMoveStageReason('');
                  setTargetParty('both');
                }
              }}
              disabled={!moveStageReason.trim()}
              className="w-full bg-slate-900 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" /> تأكيد النقل
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تأخير مرحلة ===== */}
      <Modal open={!!delayFor} onClose={() => setDelayFor(null)} title="تأخير المرحلة (رجوع خطوة)">
        {delayFor && (
          <div className="space-y-4">
            <TargetPartySelector
              value={targetParty}
              onChange={setTargetParty}
              senderName={getMember(delayFor.sender_id)?.nickname}
              receiverName={getMember(delayFor.receiver_id)?.nickname}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-cairo leading-relaxed">
                سيتم رجوع الطلب خطوة واحدة للخلف وتسجيل السبب في سجل الأحداث. المرحلة الحالية: <strong>{stageTitle(delayFor.journey_stage)}</strong>
              </p>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">سبب التأخير <span className="text-rose-500">*</span></label>
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                rows={3}
                placeholder="مثال: يحتاج الطرف لوقت إضافي، طلب مراجعة..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!delayReason.trim()) return;
                let targetText = 'كلا الطرفين';
                if (targetParty === 'sender') targetText = `المرسِل (${getMember(delayFor.sender_id)?.nickname || 'المرسل'}) فقط`;
                if (targetParty === 'receiver') targetText = `المستقبِل (${getMember(delayFor.receiver_id)?.nickname || 'المستقبل'}) فقط`;

                const note = `تأخير إداري لـ [${targetText}] — السبب: ${delayReason.trim()}`;
                const ok = await delayStage(delayFor.id, note);
                if (ok) {
                  showLocalToast(`تم تأخير الطلب لـ (${targetText}) خطوة للخلف ✓`);
                  setDelayFor(null);
                  setDelayReason('');
                  setTargetParty('both');
                }
              }}
              disabled={!delayReason.trim()}
              className="w-full bg-amber-500 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" /> تأكيد التأخير
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تجميد الطلب ===== */}
      <Modal open={!!freezeFor} onClose={() => setFreezeFor(null)} title="تجميد الطلب مؤقتاً">
        {freezeFor && (
          <div className="space-y-4">
            <TargetPartySelector
              value={targetParty}
              onChange={setTargetParty}
              senderName={getMember(freezeFor.sender_id)?.nickname}
              receiverName={getMember(freezeFor.receiver_id)?.nickname}
            />

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2">
              <Snowflake className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700 font-cairo leading-relaxed">
                سيظهر الطلب للعضو كـ <strong>"بانتظار تنسيق الإدارة"</strong> وليس كمنتهٍ. يمكن إلغاء التجميد في أي وقت.
              </p>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">سبب التجميد <span className="text-rose-500">*</span></label>
              <textarea
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={3}
                placeholder="مثال: مراجعة المستندات، نزاع بين الطرفين، تحقق من البيانات..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!freezeReason.trim()) return;
                let targetText = 'كلا الطرفين';
                if (targetParty === 'sender') targetText = `المرسِل (${getMember(freezeFor.sender_id)?.nickname || 'المرسل'}) فقط`;
                if (targetParty === 'receiver') targetText = `المستقبِل (${getMember(freezeFor.receiver_id)?.nickname || 'المستقبل'}) فقط`;

                const note = `تجميد إداري لـ [${targetText}] — السبب: ${freezeReason.trim()}`;
                const ok = await freezeRequest(freezeFor.id, note);
                if (ok) {
                  showLocalToast(`تم تجميد الطلب لـ (${targetText}) ✓`);
                  setFreezeFor(null);
                  setFreezeReason('');
                  setTargetParty('both');
                }
              }}
              disabled={!freezeReason.trim()}
              className="w-full bg-sky-500 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors disabled:opacity-50"
            >
              <Snowflake className="w-4 h-4" /> تأكيد التجميد
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: إعادة تفعيل ===== */}
      <Modal open={!!reactivateFor} onClose={() => setReactivateFor(null)} title="إعادة تفعيل طلب منتهٍ">
        {reactivateFor && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 font-cairo leading-relaxed">
                الطلب حالياً <strong>{stageTitle(reactivateFor.journey_stage)}</strong>. سيتم إعادته لمرحلة نشطة.
              </p>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">المرحلة المستهدفة</label>
              <select
                value={reactivateStage}
                onChange={(e) => setReactivateStage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              >
                {JOURNEY_STAGES.filter((s) => s !== 'completed').map((s) => (
                  <option key={`reactivate-stage-opt-${s}`} value={s}>{STAGE_META[s].title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">سبب إعادة التفعيل <span className="text-rose-500">*</span></label>
              <textarea
                value={reactivateReason}
                onChange={(e) => setReactivateReason(e.target.value)}
                rows={3}
                placeholder="مثال: إلغاء بالخطأ، طلب استثنائي من الطرفين..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!reactivateReason.trim()) return;
                const ok = await reactivateRequest(reactivateFor.id, reactivateStage, reactivateReason.trim());
                if (ok) {
                  showLocalToast('تمت إعادة تفعيل الطلب ✓');
                  setReactivateFor(null);
                }
              }}
              disabled={!reactivateReason.trim()}
              className="w-full bg-emerald-500 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> تأكيد إعادة التفعيل
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تبديل طرف ===== */}
      <Modal open={!!swapFor} onClose={() => setSwapFor(null)} title="تبديل طرف في الطلب">
        {swapFor && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Repeat className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-cairo leading-relaxed">
                استبدال أحد الطرفين بعضو آخر — يُستخدم لحالات الخطأ في الإرسال.
              </p>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">الطرف المراد تبديله</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSwapRole('sender')}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${swapRole === 'sender' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                >
                  <p className="font-cairo font-bold text-xs text-slate-800">المرسِل</p>
                  <p className="text-[10px] text-slate-500">{getMember(swapFor.sender_id)?.nickname || '—'}</p>
                </button>
                <button
                  onClick={() => setSwapRole('receiver')}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${swapRole === 'receiver' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                >
                  <p className="font-cairo font-bold text-xs text-slate-800">المستقبِل</p>
                  <p className="text-[10px] text-slate-500">{getMember(swapFor.receiver_id)?.nickname || '—'}</p>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">العضو البديل</label>
              <select
                value={swapMemberId}
                onChange={(e) => setSwapMemberId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              >
                <option value="">— اختر عضواً —</option>
                {adminMembers.filter((m) => m.id !== swapFor.sender_id && m.id !== swapFor.receiver_id).map((m) => (
                  <option key={m.id} value={m.id}>{m.nickname} — {m.realName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">سبب التبديل <span className="text-rose-500">*</span></label>
              <textarea
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                rows={3}
                placeholder="مثال: خطأ في إرسال الطلب، تبديل بأمر الإدارة..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 focus:outline-none font-tajawal text-slate-900 text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!swapMemberId || !swapReason.trim()) return;
                const ok = await swapParty(swapFor.id, swapRole, swapMemberId, swapReason.trim());
                if (ok) {
                  showLocalToast('تم تبديل الطرف بنجاح ✓');
                  setSwapFor(null);
                }
              }}
              disabled={!swapMemberId || !swapReason.trim()}
              className="w-full bg-slate-900 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Repeat className="w-4 h-4" /> تأكيد التبديل
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: إدخال وتسجيل المدفوعات إدارياً ===== */}
      <Modal open={!!editPaymentsFor} onClose={() => setEditPaymentsFor(null)} title="إدارة وتحديد سداد العربون والأتعاب">
        {editPaymentsFor && (() => {
          const totalFee = editPaymentsFor.total_fee || TOTAL_FEE_AMOUNT;
          const depositFee = editPaymentsFor.deposit_fee || DEPOSIT_AMOUNT;
          const sender = getMember(editPaymentsFor.sender_id);
          const receiver = getMember(editPaymentsFor.receiver_id);
          const senderRem = Math.max(0, totalFee - (Number(senderPaidAmount) || 0));
          const receiverRem = Math.max(0, totalFee - (Number(receiverPaidAmount) || 0));

          const isSenderImported = sender ? (sender.sourceType === 'imported' || !!(sender as any).importBatchId || !!(sender as any).importOfficeName) : false;
          const isReceiverImported = receiver ? (receiver.sourceType === 'imported' || !!(receiver as any).importBatchId || !!(receiver as any).importOfficeName) : false;

          return (
            <div className="space-y-4" dir="rtl">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5">
                <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-cairo leading-relaxed text-amber-900">
                  <p className="font-bold">خيارات الإدارة لتحديد حالة ومبلغ سداد العربون:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    عربون الجدية: <strong>{depositFee.toLocaleString('ar-QA')} ر.ق</strong> (من إجمالي {totalFee.toLocaleString('ar-QA')} ر.ق).
                    يمكنك تأشير كل عضو (مسدد / بانتظار السداد / لم يسدد) وتعديل المبلغ المسدد بدقة.
                  </p>
                </div>
              </div>

              {/* مدفوعات الطرف الأول (المرسل) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-cairo font-black text-slate-800">
                    المرسِل: {sender?.nickname || 'المرسل'} {sender?.realName ? `(${sender.realName})` : ''}
                  </span>
                  <span className="text-[11px] font-cairo font-bold text-slate-500">
                    المتبقي: <strong className="text-amber-700">{senderRem.toLocaleString('ar-QA')} ر.ق</strong>
                  </span>
                </div>

                {isSenderImported && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs font-cairo font-bold text-purple-900 flex items-center justify-between">
                    <span>✨ عضو مستورد (معفي تلقائياً من عربون الجدية)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold">معفي 0 ر.ق</span>
                  </div>
                )}

                {/* خيارات التأشير على السداد للمرسل */}
                <div>
                  <label className="block text-[11px] font-cairo font-bold text-slate-700 mb-1.5">
                    تأشير حالة سداد العربون:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSenderStatus('paid');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        senderStatus === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> مسدد / معفي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSenderStatus('pending')}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        senderStatus === 'pending'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> بانتظار السداد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSenderStatus('unpaid');
                        setSenderPaidAmount(0);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        senderStatus === 'unpaid'
                          ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> لم يسدد بعد
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-cairo font-bold text-slate-700 mb-1">
                    كتابة المبلغ المسدد (ر.ق):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={senderPaidAmount}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setSenderPaidAmount(val);
                      if (senderStatus !== 'paid') {
                        if (val >= depositFee) setSenderStatus('paid');
                        else if (val > 0) setSenderStatus('pending');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-cairo font-bold focus:outline-none focus:ring-2 focus:ring-amber-200 text-left"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setSenderPaidAmount(0); setSenderStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  >
                    إعفاء (0 ر.ق - مسدد)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSenderPaidAmount(0); setSenderStatus('unpaid'); }}
                    className="text-[10px] font-cairo font-bold px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    تصفير (0 ر.ق - لم يسدد)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSenderPaidAmount(depositFee); setSenderStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                  >
                    عربون ({depositFee.toLocaleString('ar-QA')} ر.ق)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSenderPaidAmount(totalFee); setSenderStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  >
                    كامل الأتعاب ({totalFee.toLocaleString('ar-QA')} ر.ق)
                  </button>
                </div>
              </div>

              {/* مدفوعات الطرف الثاني (المستقبل) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-cairo font-black text-slate-800">
                    المستقبِل: {receiver?.nickname || 'المستقبل'} {receiver?.realName ? `(${receiver.realName})` : ''}
                  </span>
                  <span className="text-[11px] font-cairo font-bold text-slate-500">
                    المتبقي: <strong className="text-amber-700">{receiverRem.toLocaleString('ar-QA')} ر.ق</strong>
                  </span>
                </div>

                {isReceiverImported && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs font-cairo font-bold text-purple-900 flex items-center justify-between">
                    <span>✨ عضو مستورد (معفي تلقائياً من عربون الجدية)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold">معفي 0 ر.ق</span>
                  </div>
                )}

                {/* خيارات التأشير على السداد للمستقبل */}
                <div>
                  <label className="block text-[11px] font-cairo font-bold text-slate-700 mb-1.5">
                    تأشير حالة سداد العربون:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiverStatus('paid');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        receiverStatus === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> مسدد / معفي
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiverStatus('pending')}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        receiverStatus === 'pending'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> بانتظار السداد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiverStatus('unpaid');
                        setReceiverPaidAmount(0);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-cairo font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        receiverStatus === 'unpaid'
                          ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> لم يسدد بعد
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-cairo font-bold text-slate-700 mb-1">
                    كتابة المبلغ المسدد (ر.ق):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={receiverPaidAmount}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setReceiverPaidAmount(val);
                      if (receiverStatus !== 'paid') {
                        if (val >= depositFee) setReceiverStatus('paid');
                        else if (val > 0) setReceiverStatus('pending');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-cairo font-bold focus:outline-none focus:ring-2 focus:ring-amber-200 text-left"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setReceiverPaidAmount(0); setReceiverStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  >
                    إعفاء (0 ر.ق - مسدد)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReceiverPaidAmount(0); setReceiverStatus('unpaid'); }}
                    className="text-[10px] font-cairo font-bold px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    تصفير (0 ر.ق - لم يسدد)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReceiverPaidAmount(depositFee); setReceiverStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                  >
                    عربون ({depositFee.toLocaleString('ar-QA')} ر.ق)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReceiverPaidAmount(totalFee); setReceiverStatus('paid'); }}
                    className="text-[10px] font-cairo font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  >
                    كامل الأتعاب ({totalFee.toLocaleString('ar-QA')} ر.ق)
                  </button>
                </div>
              </div>

              {/* خيار الانتقال لمرحلة التنسيق والتواصل */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advanceToCoordination}
                  onChange={(e) => setAdvanceToCoordination(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <p className="text-xs font-cairo font-bold text-emerald-900">
                    نقل الطلب تلقائياً إلى مرحلة «جاري التنسيق والتواصل»
                  </p>
                  <p className="text-[10px] text-emerald-700 font-cairo">
                    يظهر للطرفين في الموقع بأن الإدارة تقوم بالتنسيق بينهما في سرية تامة عبر الواتساب.
                  </p>
                </div>
              </label>

              <button
                onClick={async () => {
                  const ok = await adminRecordPayment(editPaymentsFor.id, {
                    sender_paid_amount: Number(senderPaidAmount) || 0,
                    receiver_paid_amount: Number(receiverPaidAmount) || 0,
                    sender_status: senderStatus,
                    receiver_status: receiverStatus,
                    advance_to_coordination: advanceToCoordination,
                    total_fee: totalFee,
                    deposit_fee: depositFee,
                  });
                  if (ok) {
                    showLocalToast('تم تسجيل واعتماد حالة المدفوعات بنجاح ✓');
                    setEditPaymentsFor(null);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-cairo font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> اعتماد وحفظ إعدادات السداد
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* ===== نافذة: حدث نصيب وتم تسليم المهر ===== */}
      <Modal open={!!confirmMatchFor} onClose={() => setConfirmMatchFor(null)} title="💍 حدث نصيب وتم تسليم المهر">
        {confirmMatchFor && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-cairo text-emerald-900 leading-relaxed">
              <p className="font-extrabold text-sm mb-1 text-emerald-800">
                🎉 اعتماد إتمام الزواج وتوثيق عقد القران وتسليم المهر
              </p>
              <p>
                سيتم نقل الطلب بين <strong>{getMember(confirmMatchFor.sender_id)?.nickname || 'المرسِل'}</strong> و <strong>{getMember(confirmMatchFor.receiver_id)?.nickname || 'المستقبِل'}</strong> إلى مرحلة «مكتملة» بنجاح، وإرسال إشعار تهنئة مبارك للطرفين.
              </p>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1">
                ملاحظات التوثيق الإدارية (اختياري):
              </label>
              <textarea
                value={matchNote}
                onChange={(e) => setMatchNote(e.target.value)}
                rows={3}
                placeholder="مثال: تم تسليم المهر وتوقيع عقد النكاح بحمد الله..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-cairo focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const ok = await adminConfirmMatch(confirmMatchFor.id, matchNote);
                  if (ok) {
                    showLocalToast('💍 بارك الله لهما وبارك عليهما! تم اعتماد إتمام الزواج بنجاح ✓');
                    setConfirmMatchFor(null);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-cairo font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-current" /> تأكيد: حدث نصيب وتم تسليم المهر
              </button>
              <button
                onClick={() => setConfirmMatchFor(null)}
                className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo font-bold py-3.5 rounded-xl transition-all cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: لم يحدث نصيب ===== */}
      <Modal open={!!cancelNoMatchFor} onClose={() => setCancelNoMatchFor(null)} title="🕊️ لم يحدث نصيب (إنهاء وإلغاء الطلب)">
        {cancelNoMatchFor && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-cairo text-amber-900 leading-relaxed">
              <p className="font-extrabold text-sm mb-1 text-amber-800">
                الزواج قسمة ونصيب — إنهاء الرحلة وأرشفتها
              </p>
              <p>
                سيتم إلغاء الطلب بين <strong>{getMember(cancelNoMatchFor.sender_id)?.nickname || 'المرسِل'}</strong> و <strong>{getMember(cancelNoMatchFor.receiver_id)?.nickname || 'المستقبِل'}</strong>، وأرشفته تحت حالة ملغي باحترام، وإشعار الطرفين.
              </p>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-slate-700 mb-1">
                سبب الاعتذار أو عدم التوافق (إلزامي):
              </label>
              <textarea
                value={cancelNoMatchReason}
                onChange={(e) => setCancelNoMatchReason(e.target.value)}
                rows={3}
                placeholder="اكتب سبب عدم التوافق بلطف واحترام (مثال: عدم توافق وجهات النظر بعد التنسيق...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-cairo focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div className="flex gap-2">
              <button
                disabled={!cancelNoMatchReason.trim()}
                onClick={async () => {
                  const ok = await adminCancelNoMatch(cancelNoMatchFor.id, cancelNoMatchReason);
                  if (ok) {
                    showLocalToast('تم إنهاء الطلب بقرار «لم يحدث نصيب» وأرشفته بنجاح ✓');
                    setCancelNoMatchFor(null);
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-cairo font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" /> تأكيد: لم يحدث نصيب (إلغاء الطلب)
              </button>
              <button
                onClick={() => setCancelNoMatchFor(null)}
                className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo font-bold py-3.5 rounded-xl transition-all cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تعديل تعهدات الجدية إدارياً ===== */}
      <Modal open={!!editPledgesFor} onClose={() => setEditPledgesFor(null)} title="تحديث التعهدات وإقرارات الجدية">
        {editPledgesFor && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-cairo leading-relaxed">
                تأكيد توقيع إقرار الجدية والعهد للطرف الذكر والأنثى بالنيابة عنهما.
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors w-full">
                <input
                  type="checkbox"
                  checked={malePledged}
                  onChange={(e) => setMalePledged(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-cairo font-bold text-slate-800">الطرف الذكر (قسم الجدية والعهد)</p>
                  <p className="text-[10px] text-slate-500 font-cairo">مكتمل وموقع بالقسم والعهد</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors w-full">
                <input
                  type="checkbox"
                  checked={femalePledged}
                  onChange={(e) => setFemalePledged(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-cairo font-bold text-slate-800">الطرف الأنثى (قسم الجدية والعهد)</p>
                  <p className="text-[10px] text-slate-500 font-cairo">مكتمل وموقع بالقسم والعهد</p>
                </div>
              </label>
            </div>
            <button
              onClick={async () => {
                const ok = await adminSetPledges(Number(editPledgesFor.id), malePledged, femalePledged);
                if (ok) {
                  showLocalToast('تم تحديث التعهدات بنجاح ✓');
                  setEditPledgesFor(null);
                }
              }}
              className="w-full bg-amber-500 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
            >
              <Check className="w-4 h-4" /> حفظ التعهدات
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تعديل نتائج النظرة الشرعية ===== */}
      <Modal open={!!editViewingResultsFor} onClose={() => setEditViewingResultsFor(null)} title="تحديث نتائج النظرة الشرعية">
        {editViewingResultsFor && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
              <Eye className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700 font-cairo leading-relaxed">
                تحديد رغبة الطرفين بالتوافق أو الاعتذار بعد النظرة الشرعية لإجبار الرحلة على المتابعة أو الرفض.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">رأي المرسِل (الطرف الأول)</label>
                <select
                  value={senderViewingResult}
                  onChange={(e) => setSenderViewingResult(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:outline-none font-tajawal text-slate-900 text-sm"
                >
                  <option value="">قيد الانتظار</option>
                  <option value="success">رغبة بالتوافق ✓</option>
                  <option value="failed">اعتذار وعدم توافق</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-cairo font-bold text-slate-700 mb-1.5">رأي المستقبِل (الطرف الثاني)</label>
                <select
                  value={receiverViewingResult}
                  onChange={(e) => setReceiverViewingResult(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-400 focus:outline-none font-tajawal text-slate-900 text-sm"
                >
                  <option value="">قيد الانتظار</option>
                  <option value="success">رغبة بالتوافق ✓</option>
                  <option value="failed">اعتذار وعدم توافق</option>
                </select>
              </div>
            </div>
            <button
              onClick={async () => {
                const ok = await adminSetViewingResults(
                  Number(editViewingResultsFor.id),
                  senderViewingResult || null,
                  receiverViewingResult || null
                );
                if (ok) {
                  showLocalToast('تم تحديث نتائج النظرة الشرعية إدارياً ✓');
                  setEditViewingResultsFor(null);
                }
              }}
              className="w-full bg-purple-600 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Check className="w-4 h-4" /> حفظ وتحديث النتيجة
            </button>
          </div>
        )}
      </Modal>

      {/* ===== نافذة: تعديل بيانات التواصل مباشرة ===== */}
      <Modal open={!!editContactsFor} onClose={() => setEditContactsFor(null)} title="تحديث بيانات التواصل المباشرة">
        {editContactsFor && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2">
              <Repeat className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700 font-cairo leading-relaxed">
                تعديل وتجاوز معلومات التواصل للطرفين مباشرة لتظهر لديهما بدقة وتفادي أي أخطاء في الإدخال.
              </p>
            </div>
            
            <div className="space-y-3 text-right" dir="rtl">
              <h4 className="font-cairo font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">بيانات التواصل للطرف الذكر (الخاطب)</h4>
              <div>
                <label className="block text-[11px] font-cairo font-bold text-slate-600 mb-1">اسم الخاطب</label>
                <input
                  type="text"
                  value={maleName}
                  onChange={(e) => setMaleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-tajawal text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-cairo font-bold text-slate-600 mb-1">رقم هاتف الخاطب</label>
                <input
                  type="text"
                  value={malePhone}
                  onChange={(e) => setMalePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-tajawal text-slate-900 text-xs text-left"
                />
              </div>

              <h4 className="font-cairo font-bold text-xs text-slate-900 border-b border-slate-100 pt-3 pb-1">بيانات التواصل للطرف الأنثى (المخطوبة)</h4>
              <div>
                <label className="block text-[11px] font-cairo font-bold text-slate-600 mb-1">اسم ولي الأمر</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-tajawal text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-cairo font-bold text-slate-600 mb-1">رقم هاتف ولي الأمر</label>
                <input
                  type="text"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-tajawal text-slate-900 text-xs text-left"
                />
              </div>

              <h4 className="font-cairo font-bold text-xs text-slate-900 border-b border-slate-100 pt-3 pb-1">تفاصيل إضافية / عامة</h4>
              <div>
                <label className="block text-[11px] font-cairo font-bold text-slate-600 mb-1">معلومات الاتصال المباشرة البديلة</label>
                <textarea
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none font-tajawal text-slate-900 text-xs"
                  placeholder="ملاحظات التواصل أو طريقة التنسيق البديلة..."
                />
              </div>
            </div>

            <button
              onClick={async () => {
                const ok = await adminSetContacts(Number(editContactsFor.id), {
                  male_name: maleName,
                  male_phone: malePhone,
                  guardian_name: guardianName,
                  guardian_phone: guardianPhone,
                  contact_info: contactInfo,
                });
                if (ok) {
                  showLocalToast('تم تحديث بيانات التواصل للطرفين ✓');
                  setEditContactsFor(null);
                }
              }}
              className="w-full bg-sky-600 text-white font-cairo font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-700 transition-colors"
            >
              <Check className="w-4 h-4" /> حفظ بيانات التواصل
            </button>
          </div>
        )}
      </Modal>

      {/* ===== شريط الإجراءات الجماعية الإداري العائم ===== */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 80, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[90] w-[94%] max-w-xl bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-navy-950 font-black font-cairo text-sm flex items-center justify-center shadow-sm">
                {selectedIds.length}
              </span>
              <div>
                <span className="text-xs font-cairo font-bold text-slate-100 block">طلبات محددة إدارياً</span>
                <span className="text-[10px] font-cairo text-amber-400">تحكّم شامل بالمجموعة</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkAdminFreeze}
                className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-cairo font-bold flex items-center gap-1.5 border border-sky-500/30 transition-all cursor-pointer"
              >
                <Snowflake className="w-4 h-4" />
                <span>تجميد/إلغاء تجميد</span>
              </button>

              <button
                onClick={() => setConfirmBulkAdminDelete(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-cairo font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحددة</span>
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

      {/* ===== مودال تأكيد الحذف الإداري الجماعي ===== */}
      <Modal open={confirmBulkAdminDelete} onClose={() => setConfirmBulkAdminDelete(false)} title="حذف طلبات الرحلات المحددة نهائياً">
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-cairo font-extrabold text-sm text-rose-900">
                هل أنت تأكد كأدمن من حذف وإزالة {selectedIds.length} طلب توافق بشكل دائم؟
              </p>
              <p className="font-cairo text-xs text-rose-700 mt-1 leading-relaxed">
                سيتم مسح جميع هذه الرحلات وسجلاتها من القاعدة تماماً. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleBulkAdminDelete}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-cairo font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد مسح وحذف {selectedIds.length} طلب</span>
            </button>
            <button
              onClick={() => setConfirmBulkAdminDelete(false)}
              className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo font-bold py-3 rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {localToast && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl font-cairo font-bold text-sm text-white bg-emerald-600"
        >
          {localToast}
        </motion.div>
      )}
    </div>
  );
}

function PartyChip({ member, role }: { member: { id?: string, nickname?: string, realName?: string, name?: string, status?: string, deleted?: boolean, gender?: string } | undefined | null; role: string }) {
  const isDeleted = !member || member?.status === 'deleted' || member?.deleted === true;
  const isBanned = member?.status === 'banned';
  const isSuspended = member?.status === 'suspended';

  const name = isDeleted
    ? (member?.nickname || member?.realName || member?.name || 'حساب محذوف')
    : (member?.nickname || member?.realName || member?.name || member?.id || 'غير معروف');
  const initial = name.charAt(0) || 'ع';
  const isMale = member?.gender === 'male';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${isDeleted ? 'bg-slate-500' : isMale ? 'bg-blue-500' : 'bg-rose-500'}`}>
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-cairo font-bold text-slate-900 text-xs truncate">{name}</p>
          {isDeleted && (
            <span className="text-[9px] font-cairo font-black text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-md">
              ⚠️ حساب محذوف
            </span>
          )}
          {isBanned && (
            <span className="text-[9px] font-cairo font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
              ⛔ محظور
            </span>
          )}
          {isSuspended && (
            <span className="text-[9px] font-cairo font-black text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">
              ⚠️ موقوف
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-cairo">{role}</p>
      </div>
    </div>
  );
}
