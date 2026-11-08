import type { ReactNode } from 'react';
import { ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalPageProps {
  type: 'privacy' | 'terms';
}

const content = {
  privacy: {
    title: 'سياسة الخصوصية وحماية البيانات',
    icon: Lock,
    intro: 'في منصة تلاقي القطرية للزواج، نضع حماية خصوصيتك وحفظ بياناتك الشخصية في مقدمة أولوياتنا. تبيّن هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك وفق أعلى معايير الأمان والتشفير.',
    sections: [
      { title: '1. البيانات التي نجمعها', body: 'نجمع البيانات التوافقية الأساسية التي توفرها عند إنشاء الملف الشامل، مثل: المواصفات، العمر، المدينة بقطر، المؤهل العلمي، والالتزام الشرعي. لا نعرض رقم الهاتف أو الوثائق للعامة إطلاقاً.' },
      { title: '2. كيفية استخدام بياناتك', body: 'تُستخدم بياناتك حصراً لأغراض قياس التوافق الأسري والثقافي، وإبراز مواصفاتك للأعضاء الباحثين عن زواج شرعي جاد، والتنسيق الآمن تحت إشراف المنصة.' },
      { title: '3. التشفير والحماية المشددة', body: 'نستخدم تقنيات تشفير SSL متقدمة لحماية بيانات الحسابات والتواصل. معلوماتك الشخصية كالهوية والهاتف مصانة ولا تظهر للأعضاء الآخرين إلا بموافقة صريحة وفي مرحلة التنسيق المخصصة.' },
      { title: '4. منع مشاركة البيانات', body: 'نلتزم مطلقاً بعدم بيع أو مشاركة بياناتك مع أي أطراف ثالثة أو تسريبها لأغراض إعلانية.' },
      { title: '5. التحكم الكامل بالملف', body: 'تتمتع بالتحكم الكامل في تعديل بيانات ملفك، إيقاف تفعيل الملف مؤقتاً، أو حذف الحساب والبيانات نهائياً في أي وقت تراه مناسباً.' },
      { title: '6. حماية الجلسات وملفات الارتباط', body: 'نستخدم ملفات تعريف الارتباط التشفيرية المشفرة لحفظ آمان الجلسة ومنع اختراق الحسابات.' },
      { title: '7. التحديثات الدورية', body: 'في حال تحديث سياسات الخصوصية، يتم إشعار الأعضاء عبر الموقع والبريد الإلكتروني.' },
    ],
  },
  terms: {
    title: 'الشروط والأحكام والالتزام الأخلاقي',
    icon: FileText,
    intro: 'باستخدامك لمنصة تلاقي القطرية للزواج، فإنك تقر وتوافق على الالتزام التام بالشروط والأحكام والآداب الشرعية والأخلاقية المبينة أدناه.',
    sections: [
      { title: '1. النية الصادقة والجدية المطلقة', body: 'منصة تلاقي مخصصة حصراً للراغبين بالزواج الشرعي الجاد بقطر. يُحظر حظراً تاماً استخدام المنصة للتعارف غير الجاد أو أي غرض يخالف الضوابط الشرعية والقيم الأسرية.' },
      { title: '2. دقة وصحة البيانات', body: 'يتعهد العضو بتقديم معلومات دقيقة وصادقة في ملفه التوافقي تعبر عن واقعه الحالي دون تضليل.' },
      { title: '3. نظام رحلة التوافق والخصوصية', body: 'تُدار طلبات التوافق وفق رحلة التوافق المنظمة، ولا تتوفر مراسلة مفتوحة أو تعارف خارج أطر المنصة لمنع أي تجاوزات وحفظاً لكرامة الجميع.' },
      { title: '4. تيسير مشاركة أولياء الأمور', body: 'تُشجع المنصة وتيسّر إشراك أولياء الأمور (ولي الأمر) وتنسيق الرؤية الشرعية الرسمية في الوقت والمرحلة المناسبة.' },
      { title: '5. الحظر والإجراءات الانضباطية', body: 'تستبقي إدارة منصة تلاقي الحق الكامل في تعليق أو حظر أي حساب يثبت عدم جديته أو إساءته لأي عضو آخر دون إشعار.' },
      { title: '6. الرسوم والأتعاب', body: 'تخضع أتعاب التنسيق وباقات تمييز الملف للشروط المعلنة بالمنصة، وتعتبر أتعاب التوفيق مستحقة وفق المراحل المحددة بالرحلة.' },
      { title: '7. إخلاء المسؤولية', body: 'تقدم المنصة خدمة الوساطة والتوافق الذكي والأخلاقي، والقرار النهائي بالخطوبة وعقد القران هو مسؤولية الأطراف وأسرهم بعد الاستخارة والسؤال.' },
    ],
  },
};

export default function LegalPage({ type }: LegalPageProps) {
  const data = content[type];
  const Icon = data.icon;

  return (
    <div className="bg-[#FCFBF9] min-h-screen text-[#1C1917] font-['Tajawal',sans-serif]" dir="rtl">
      <div className="bg-gradient-to-tr from-[#680E30] to-[#7B113A] relative overflow-hidden py-10 sm:py-14 text-center text-white">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 mb-3 text-[#FFF0D4]">
            <Icon className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h1 className="font-['Cairo'] font-black text-2xl sm:text-3xl md:text-4xl text-white">{data.title}</h1>
          <p className="mt-2 text-white/80 max-w-xl mx-auto text-xs sm:text-sm">منصة تلاقي القطرية للزواج • آخر تحديث: 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-right">
        <div className="bg-white rounded-3xl shadow-2xs border border-[#EAE3D9] p-5 sm:p-8">
          <div className="bg-[#FEF8EC] rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3 border border-[#F1E0B6]">
            <ShieldCheck className="w-5 h-5 text-[#A16207] shrink-0 mt-0.5" />
            <p className="text-[#57534E] leading-relaxed text-xs sm:text-sm">{data.intro}</p>
          </div>

          <div className="space-y-6">
            {data.sections.map((section, i) => (
              <div key={i} className="border-b border-[#F5EFE7] pb-5 last:border-0 last:pb-0">
                <h2 className="font-['Cairo'] font-bold text-base sm:text-lg text-[#1C1917] mb-1.5">{section.title}</h2>
                <p className="text-[#57534E] leading-relaxed text-xs sm:text-sm">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
