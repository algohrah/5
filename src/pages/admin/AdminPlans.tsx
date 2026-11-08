import { Crown } from 'lucide-react';
import PageHeader from '../../components/admin/PageHeader';
import { PLANS } from '../../lib/data';
export default function AdminPlans() {
  return <div className="space-y-6" dir="rtl">
    <PageHeader title="العضويات وباقات الاشتراك" subtitle="إدارة ومراجعة باقات العضوية المميزة (شهر · ٦ أشهر · سنة) والباقة الأساسية المجانية." />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{PLANS.map(plan => <section key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <h3 className="flex items-center gap-2 font-cairo font-bold text-base"><Crown className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />{plan.name}</h3>
        <p className="my-2 font-bold text-sm text-[#7B113A]">{plan.price ? `${plan.price} ريال / ${plan.period}` : 'مجاني للأبد'}</p>
        <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
        <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">{plan.features.map(feature => <li key={feature} className="flex items-start gap-1.5"><span>•</span><span>{feature}</span></li>)}</ul>
      </div>
      <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-50 pt-2">رسوم الرحلة والتنسيق مستقلة عن باقات الاشتراك.</p>
    </section>)}</div>

  </div>;
}
