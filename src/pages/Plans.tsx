import { Link } from 'react-router-dom';
import { Check, ShieldCheck, Star, MessageSquare, ArrowLeft } from 'lucide-react';
import { PLANS } from '../lib/data';

export default function Plans() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#1C1917] font-['Tajawal',sans-serif]" dir="rtl">
      <header className="bg-gradient-to-tr from-[#680E30] to-[#7B113A] px-4 py-12 text-center text-white">
        <span className="inline-flex rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-['Cairo'] font-bold text-[#FFF0D4]">
          عضوية وباقات تناسب احتياجك 🇶🇦
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-['Cairo'] font-black">
          باقات منصة تلاقي القطرية للزواج
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-md mx-auto">
          خيارات واضحة ورصينة، ورسوم التنسيق والرحلة مستقلة عن العضوية.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* قسم الباقات المميزة بمددها المختلفة */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-['Cairo'] font-extrabold text-[#7B113A] bg-[#7B113A]/10 px-3 py-1 rounded-full border border-[#7B113A]/20">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>اختر المدة الأنسب لرحلتك</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-['Cairo'] font-black text-[#1C1917] mt-2">
              باقات العضوية المميزة (شهر · ٦ أشهر · سنة)
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1 max-w-lg mx-auto">
              تمنحك وصولاً غير محدود لكافة فلاتر البحث المتقدمة، وأولوية الظهور، وحصة موسعة من طلبات التوافق اليومية.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 text-right">
            {PLANS.filter(p => p.id !== 'free').map((plan) => {
              const isPopular = plan.popular;
              const isYearly = plan.id === 'featured_1y';

              return (
                <section
                  key={plan.id}
                  className={`relative rounded-3xl bg-white p-5 sm:p-6 border transition-all flex flex-col justify-between ${
                    isPopular
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-lg shadow-[#7B113A]/10 -translate-y-1'
                      : isYearly
                        ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'border-[#EAE3D9] shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#F3DB83] text-neutral-950 font-['Cairo'] font-extrabold text-[11px] px-3 py-0.5 rounded-full shadow-xs border border-white">
                      الأكثر طلباً ⭐ وفّر 33%
                    </div>
                  )}
                  {isYearly && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-['Cairo'] font-extrabold text-[11px] px-3 py-0.5 rounded-full shadow-xs border border-white">
                      أفضل قيمة 👑 وفّر 42%
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-['Cairo'] font-bold px-2.5 py-0.5 rounded-full ${
                        isPopular ? 'bg-[#FEF8EC] text-[#A16207] border border-[#F1E0B6]' : isYearly ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#FAF7F2] text-[#7B113A]'
                      }`}>
                        {plan.period}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isPopular ? 'bg-[#FEF8EC] text-[#A16207]' : isYearly ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FAF7F2] text-[#7B113A]'
                      }`}>
                        <Star className="h-4.5 w-4.5 fill-current" />
                      </div>
                    </div>

                    <h3 className="font-['Cairo'] font-black text-lg text-[#1C1917]">{plan.name}</h3>
                    <p className="mt-1 text-xs text-[#78716C] leading-relaxed min-h-[38px]">{plan.description}</p>

                    <div className="mt-4 font-['Cairo'] text-[#1C1917] pb-4 border-b border-[#F5EFE7]">
                      <div className="flex items-baseline gap-1.5">
                        <strong className="text-3xl font-black text-[#7B113A]">{plan.price}</strong>
                        <span className="text-xs text-[#78716C] font-tajawal">ريال قطري</span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-tajawal block mt-0.5">
                        صلاحية {plan.period}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2.5 text-right">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-[#57534E]">
                          <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-4">
                    <Link
                      to={`/checkout/${plan.id}`}
                      className={`w-full block rounded-xl py-3 text-center font-['Cairo'] font-bold text-xs sm:text-sm transition-all shadow-xs ${
                        isPopular
                          ? 'bg-[#7B113A] hover:bg-[#680E30] text-white shadow-md'
                          : isYearly
                            ? 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white'
                            : 'bg-[#FAF7F2] hover:bg-[#F3ECE0] text-[#7B113A] border border-[#E5DAC6]'
                      }`}
                    >
                      الاشتراك في {plan.name}
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* كارت البداية المجانية الأساسية للمقارنة */}
        <div className="max-w-2xl mx-auto rounded-3xl bg-white p-5 sm:p-6 border border-[#EAE3D9] shadow-2xs text-right mb-6">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Cairo'] font-bold text-base text-slate-900">الباقة الأساسية (مجاني)</h3>
                <p className="text-xs text-slate-500">للأعضاء الجدد والراغبين في الاستكشاف الأولي</p>
              </div>
            </div>
            <span className="font-['Cairo'] font-black text-xl text-slate-700">0 ريال (مجانًا)</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 pt-3 border-t border-[#F5EFE7] text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> 5 طلبات توافق يوميًا</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> فلاتر أساسية (الدولة، المدينة)</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> المفضلة واستقبال الطلبات</span>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-[#EAE3D9] bg-[#FAF7F2] p-4 text-right">
          <h2 className="flex items-center gap-2 font-['Cairo'] font-bold text-xs sm:text-sm text-[#1C1917]">
            <MessageSquare className="h-4 w-4 text-[#7B113A]" />
            <span>رسوم التنسيق والرحلة مستقلة عن العضوية</span>
          </h2>
          <p className="mt-1 text-xs text-[#78716C] leading-relaxed">
            اشتراك الباقة المميزة يمنح مزايا إضافية في البحث والطلبات وتمييز الملف. رسوم الجدية وأتعاب رحلة التوافق مستقلة وتُراجع شروطها قبل السداد لضمان الشفافية التامة.
          </p>
        </section>

        <div className="mt-5 flex items-center justify-between text-xs font-['Cairo'] font-bold">
          <Link to="/search" className="inline-flex gap-1.5 items-center text-[#7B113A] hover:underline">
            <span>تصفّح ملفات الأعضاء</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <Link to="/contact" className="text-[#78716C] hover:text-[#1C1917]">
            استفسار عن الباقات
          </Link>
        </div>
      </main>
    </div>
  );
}
