import { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  ShieldCheck,
  Crown,
  Banknote,
  Gift,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getAdminFinancialReport } from '../../lib/data/adapters/local/localStore';

export default function AdminFinancials() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'deposits' | 'remaining' | 'exemptions' | 'packages'>('deposits');
  const [search, setSearch] = useState('');
  const [localToast, setLocalToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const rep = await getAdminFinancialReport();
      const serverRes = await fetch('/api/financials').catch(() => null);
      if (serverRes && serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData && (serverData.totalDeposits > 0 || serverData.packageRevenue > 0 || serverData.totalRemaining > 0)) {
          const dep = serverData.totalDeposits || rep.summary.totalDepositsAmount;
          const pkg = serverData.packageRevenue || rep.summary.totalPackagesAmount;
          rep.summary = {
            ...rep.summary,
            totalDepositsAmount: dep,
            totalRemainingAmount: serverData.totalRemaining || rep.summary.totalRemainingAmount,
            totalExemptionsCount: serverData.totalExempted || rep.summary.totalExemptionsCount,
            totalPackagesAmount: pkg,
            grandTotalCollected: dep + pkg,
          };
        }
      }
      setReport(rep);
    } catch (err) {
      console.error('Failed to load financial report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (t: string) => {
    setLocalToast(t);
    setTimeout(() => setLocalToast(null), 2500);
  };

  const currentList = useMemo(() => {
    if (!report) return [];
    let list: any[] = [];

    if (activeTab === 'deposits') list = report.deposits || [];
    else if (activeTab === 'remaining') list = report.remaining || [];
    else if (activeTab === 'exemptions') list = report.exemptions || [];
    else if (activeTab === 'packages') list = report.packageSubscriptions || [];

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((item) => {
      const matchId = item.requestId ? String(item.requestId).includes(q) : false;
      const matchMemberId = item.memberId ? String(item.memberId).includes(q) : false;
      const matchName = item.memberName?.toLowerCase().includes(q) || item.realName?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchPkg = item.packageName?.toLowerCase().includes(q);
      return matchId || matchMemberId || matchName || matchUser || matchPkg;
    });
  }, [report, activeTab, search]);

  const exportCSV = () => {
    if (currentList.length === 0) {
      showToast('لا توجد بيانات للتصدير');
      return;
    }

    const headers = ['المعرف', 'اسم العضو', 'الاسم الحقيقي', 'اسم المستخدم', 'البيانات / المبلغ', 'التاريخ'];
    const rows = currentList.map((item) => [
      item.id || item.requestId || item.memberId,
      item.memberName || '',
      item.realName || '',
      item.username || '',
      item.amount || item.dueAmount || item.totalFee || item.packageName || '',
      item.date ? new Date(item.date).toLocaleDateString('ar-QA') : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `twafok_financials_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير البيانات إلى ملف CSV بنجاح ✓');
  };

  const summary = report?.summary || {
    totalDepositsAmount: 0,
    totalRemainingAmount: 0,
    totalExemptionsCount: 0,
    totalPackagesAmount: 0,
    grandTotalCollected: 0,
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Toast Alert */}
      {localToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-cairo font-bold px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{localToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 border border-amber-200/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">الرقابة المالية وإيرادات المنصة والباقات</h1>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                متابعة دقيقة لكل التدفقات المالية: عربون الجدية، المتبقي عند الزواج، المعفيون، وإيرادات الباقات.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Deposits */}
        <div
          onClick={() => setActiveTab('deposits')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'deposits'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 border-amber-500 shadow-md scale-[1.01]'
              : 'bg-white border-slate-200/80 hover:border-amber-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${activeTab === 'deposits' ? 'text-slate-950/80' : 'text-slate-500'}`}>
              عربون الجدية المسدد
            </span>
            <CreditCard className={`w-5 h-5 ${activeTab === 'deposits' ? 'text-slate-950' : 'text-amber-600'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight">
            {summary.totalDepositsAmount.toLocaleString('ar-QA')} <span className="text-xs font-bold">ر.ق</span>
          </p>
          <span className={`text-[10px] font-bold block mt-1 ${activeTab === 'deposits' ? 'text-slate-950/80' : 'text-emerald-700'}`}>
            {report?.deposits?.length || 0} عملية سداد عربون
          </span>
        </div>

        {/* Card 2: Remaining */}
        <div
          onClick={() => setActiveTab('remaining')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'remaining'
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-900 shadow-md scale-[1.01]'
              : 'bg-white border-slate-200/80 hover:border-slate-400 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${activeTab === 'remaining' ? 'text-slate-300' : 'text-slate-500'}`}>
              المتبقي عند عقد القران
            </span>
            <Clock className={`w-5 h-5 ${activeTab === 'remaining' ? 'text-amber-400' : 'text-slate-600'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight">
            {summary.totalRemainingAmount.toLocaleString('ar-QA')} <span className="text-xs font-bold">ر.ق</span>
          </p>
          <span className={`text-[10px] font-bold block mt-1 ${activeTab === 'remaining' ? 'text-amber-300' : 'text-amber-700'}`}>
            {report?.remaining?.length || 0} أتعاب مستحقة بالرحلات
          </span>
        </div>

        {/* Card 3: Exemptions */}
        <div
          onClick={() => setActiveTab('exemptions')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'exemptions'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md scale-[1.01]'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${activeTab === 'exemptions' ? 'text-emerald-100' : 'text-slate-500'}`}>
              المعفيون إدارياً / مستوردين
            </span>
            <Gift className={`w-5 h-5 ${activeTab === 'exemptions' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight">
            {summary.totalExemptionsCount} <span className="text-xs font-bold">عضو/طلب</span>
          </p>
          <span className={`text-[10px] font-bold block mt-1 ${activeTab === 'exemptions' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            معفيون من عربون الجدية
          </span>
        </div>

        {/* Card 4: Packages */}
        <div
          onClick={() => setActiveTab('packages')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'packages'
              ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-600 shadow-md scale-[1.01]'
              : 'bg-white border-slate-200/80 hover:border-indigo-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${activeTab === 'packages' ? 'text-indigo-100' : 'text-slate-500'}`}>
              مبيعات الباقات المميزة
            </span>
            <Crown className={`w-5 h-5 ${activeTab === 'packages' ? 'text-amber-300' : 'text-indigo-600'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight">
            {summary.totalPackagesAmount.toLocaleString('ar-QA')} <span className="text-xs font-bold">ر.ق</span>
          </p>
          <span className={`text-[10px] font-bold block mt-1 ${activeTab === 'packages' ? 'text-indigo-100' : 'text-indigo-700'}`}>
            {report?.packageSubscriptions?.length || 0} عمليات شراء وترقية
          </span>
        </div>
      </div>

      {/* Tabs Filter Bar & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Navigation Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>العربون ({report?.deposits?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('remaining')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'remaining'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>المتبقي ({report?.remaining?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('exemptions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exemptions'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>المعفيون ({report?.exemptions?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'packages'
                ? 'bg-indigo-600 text-white font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>مشتريات الباقات ({report?.packageSubscriptions?.length || 0})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب، العضو، اليوزر..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="text-xs font-bold">جاري تحميل السجلات والبيانات المالية...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">لا توجد سجلات مالية متطابقة مع البحث الحالي</p>
            <p className="text-xs text-slate-500">جرّب اختيار تبويب آخر أو تغيير كلمات البحث.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-extrabold">
                  <th className="py-3 px-4">رقم الطلب / المعرف</th>
                  <th className="py-3 px-4">العضو / الاسم</th>
                  <th className="py-3 px-4">اليوزر / البريد الإلكتروني</th>
                  {activeTab === 'deposits' && <th className="py-3 px-4">المبلغ المسدد</th>}
                  {activeTab === 'remaining' && <th className="py-3 px-4">المبلغ المستحق</th>}
                  {activeTab === 'exemptions' && <th className="py-3 px-4">سبب الإعفاء</th>}
                  {activeTab === 'packages' && <th className="py-3 px-4">الباقة المشتراة</th>}
                  {activeTab === 'packages' && <th className="py-3 px-4">قيمة الباقة</th>}
                  <th className="py-3 px-4">الحالة والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-bold">
                {currentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Identifier */}
                    <td className="py-3 px-4 font-mono text-amber-800">
                      {item.requestId ? `#${item.requestId}` : `#${item.memberId || item.id}`}
                    </td>

                    {/* Member Details */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900">{item.memberName || 'عضو'}</span>
                        {item.realName && <span className="text-[10px] text-slate-500 font-normal">({item.realName})</span>}
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {item.username || '—'}
                    </td>

                    {/* Tab Specific Values */}
                    {activeTab === 'deposits' && (
                      <td className="py-3 px-4 text-emerald-700 font-black">
                        {item.amount?.toLocaleString('ar-QA')} ر.ق
                      </td>
                    )}

                    {activeTab === 'remaining' && (
                      <td className="py-3 px-4 text-amber-800 font-black">
                        {item.dueAmount?.toLocaleString('ar-QA')} ر.ق
                        {item.pledged && (
                          <span className="mr-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            متعهد شرعاً ✓
                          </span>
                        )}
                      </td>
                    )}

                    {activeTab === 'exemptions' && (
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                          <Gift className="w-3 h-3 text-emerald-600" />
                          {item.reason || 'إعفاء إداري'}
                        </span>
                      </td>
                    )}

                    {activeTab === 'packages' && (
                      <td className="py-3 px-4 text-indigo-900 font-extrabold">
                        {item.packageName || 'باقة متميزة'}
                      </td>
                    )}

                    {activeTab === 'packages' && (
                      <td className="py-3 px-4 text-indigo-700 font-black">
                        {item.amount?.toLocaleString('ar-QA')} ر.ق
                      </td>
                    )}

                    {/* Status & Date */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-normal">
                          {item.date ? new Date(item.date).toLocaleDateString('ar-QA') : '—'}
                        </span>
                        {activeTab === 'deposits' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> مسدد
                          </span>
                        )}
                        {activeTab === 'exemptions' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> معفي (0 ر.ق)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
