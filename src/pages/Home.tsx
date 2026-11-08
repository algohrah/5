import { useEffect, useMemo, useState, useRef } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, CalendarClock, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Crown,
  FileCheck, HeartHandshake, Search, Send, ShieldCheck, Users,
  Award, Scale, Heart, Lock, Sparkles, MessageCircle, ExternalLink,
  PlusCircle, Radio, FileText, User, Share2, Instagram, Youtube
} from 'lucide-react';

function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.34 6.34 0 0 0 6.33-6.32V9.06a8.16 8.16 0 0 0 4.91 1.63V7.24a4.83 4.83 0 0 1-1-.55z" />
    </svg>
  );
}
import MemberCard from '../components/MemberCard';
import { MemberGridSkeleton } from '../components/ui/MemberCardSkeleton';
import { useApp } from '../lib/AppContext';
import { getMemberTimestamp } from '../lib/memberUtils';
import { dataService } from '../lib/data/DataService';
import { COUNTRIES, CITIES_BY_COUNTRY } from '../lib/constants';
import { isFeatured } from '../../shared/membership.js';
import heroCourtyard from '../assets/images/qatar_heritage_courtyard_1793817562228.jpg';

const overviewSteps = [
  { icon: Search, title: 'ابحث واختر', description: 'تصفّح المعلومات ومواصفات الشريك قبل إرسال الطلب.' },
  { icon: Send, title: 'أرسل طلب توافق', description: 'ينتظر الطلب الموافقة المبدئية قبل متابعة الخطوات.' },
  { icon: HeartHandshake, title: 'تابع من حسابك', description: 'اعرف الإجراء التالي وتابع التنسيق وحالة طلبك.' },
];

const journeySteps = [
  { icon: Send, title: 'طلب التوافق', description: 'اختر الملف المناسب وأرسل طلبك.' },
  { icon: HeartHandshake, title: 'الموافقة المبدئية', description: 'يمكن للطرف الآخر قبول الطلب أو الاعتذار عنه.' },
  { icon: ShieldCheck, title: 'تأكيد الجدية', description: 'بعد الموافقة المبدئية، يسدّد كل طرف رسوم الجدية المطلوبة لمتابعة التنسيق.' },
  { icon: CalendarClock, title: 'تنسيق التواصل', description: 'تُحدّد الخطوات بحسب نوع الملف، وتُشارك وسائل التواصل بموافقة الأطراف.' },
  { icon: Users, title: 'النظرة وقرار الطرفين', description: 'يحدّد كل طرف رغبته في الاستمرار أو الاعتذار بعد النظرة الشرعية.' },
  { icon: CheckCircle2, title: 'استكمال الرحلة', description: 'عند اتفاق الطرفين، تُتابع الإجراءات والأتعاب المستحقة وفق الشروط.' },
];

const serviceOptions = [
  { number: '01', title: 'الحساب والبحث الأساسي', label: 'مجاني', description: 'أنشئ ملفك، وابحث بحسب الجنس والدولة والمدينة والعمر، وأرسل طلبات ضمن حدود الحساب.' },
  { number: '02', title: 'الباقة المميزة', label: 'عضوية اختيارية', description: 'فلاتر بحث إضافية، وحد أعلى للطلبات، وتمييز لملفك. لا تشمل العضوية رسوم رحلة التوافق.' },
  { number: '03', title: 'رسوم رحلة التوافق', label: 'بحسب المرحلة', description: 'رسوم جدية وأتعاب لاحقة وفق شروط الرحلة. راجع المبلغ والضريبة وشروط الاسترداد قبل السداد.' },
];

const faqs = [
  { question: 'ما هي منصة تلاقي القطرية للزواج؟ وكيف تختلف عن مكاتب خطابة قطر التقليدية؟', answer: 'منصة تلاقي القطرية للزواج هي منصة رقمية عصرية مخصصة للتوافق والزواج الشرعي في قطر. تجمع المنصة بين التوافق المعياري الذكي والسرية التامة، لتقدم بديلاً خافضاً للتكاليف ومحفوظ الكرامة عن خدمات الخطابة التقليدية في الدوحة والريان والوكرة وكافة مدن قطر.' },
  { question: 'كيف يضمن موقع تلاقي السرية والستر للباحثين عن زواج في قطر؟', answer: 'تضمن منصة تلاقي حماية 100% لبياناتك وصورك الشخصية. لا تظهر أرقام الهواتف أو الأسماء الكاملة أو الصور للعموم. يتم التواصل وتنسيق الخطوات عبر مسار رحلة التوافق وبإشراف مباشر ومحتشم.' },
  { question: 'ما هي خطوات رحلة التوافق في منصة تلاقي؟', answer: 'تبدأ رحلة التوافق بإنشاء بطاقة التوافق المحمية، ثم تحديد معايير الشريك، تليها مرحلة القبول المبدئي، ثم التنسيق والتواصل المحتشم بإشراف المنصة، وصولاً إلى الرؤية الشرعية الرسمية وتواصل أولياء الأمور (ولي الأمر) لإتمام القران المبارك.' },
  { question: 'هل يمكن للباحثين عن خطابة قطرية ثقة التواصل وإشراك ولي الأمر في منصة تلاقي؟', answer: 'نعم بالتأكيد، تتيح منصة تلاقي خيار إدخال رقم وتفاصيل ولي الأمر مسبقاً، وتوجيه الخطوات الرسمية للتواصل مع الأهل مباشرة فور التوافق المبدئي.' },
  { question: 'ما هي شروط التسجيل والقبول في منصة تلاقي القطرية للزواج؟', answer: 'تشترط المنصة النية الصادقة والجدية الكاملة للزواج الشرعي فقط، وبلوغ سن السن القانوني (18 سنة فأكثر)، والالتزام التام بالآداب الشرعية والافتراضية واحترام القيم الأسرية القطرية والخليجية.' },
  { question: 'هل المنصة توفر خدمة البحث عن شريك حياة لكافة المقيمين والمواطنين بقطر؟', answer: 'نعم، منصة تلاقي ترحب بكافة المواطنين والمقيمين في دولة قطر الباحثين عن زواج شرعي جاد وتوافق قيمي وثقافي مناسب.' },
];

function FeaturedRow({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  badgeText,
  badgeClass,
  link,
  linkText,
  members,
  loading,
}: {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  badgeText: string;
  badgeClass: string;
  link: string;
  linkText: string;
  members: any[];
  loading: boolean;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const bottomTriggerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const userInteracted = useRef(false);
  const hasNudged = useRef(false);

  // إزاحة أفقية توضيحية فقط عندما يصل المستخدم لأسفل البطاقة ويظهر زر "عرض الملف" أمامه
  useEffect(() => {
    if (loading || !members.length || hasNudged.current) return;

    let nudgeTimer: ReturnType<typeof setTimeout> | undefined;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;
    let endTimer: ReturnType<typeof setTimeout> | undefined;

    // استهداف زر "عرض الملف" مباشرة في البطاقة الأولى، أو نقطة الاستشعار السفلية
    const targetElement =
      (sliderRef.current?.querySelector('.member-card-view') as HTMLElement | null) ||
      bottomTriggerRef.current;

    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // يتم التفعيل حصراً عند ظهور زر "عرض الملف" في الشاشة وليس عند بداية البطاقة
        if (entry.isIntersecting && !hasNudged.current && !userInteracted.current) {
          hasNudged.current = true;
          observer.disconnect();

          // مهلة بسيطة (300ms) بعد ظهور الزر لاستقرار نظر المستخدم عليه
          nudgeTimer = setTimeout(() => {
            if (userInteracted.current || !sliderRef.current) return;
            const el = sliderRef.current;
            isAutoScrolling.current = true;

            // سحب أفقي لليسار لمعاينة البطاقات التالية دون أي تحريك للشاشة لأسفل
            el.scrollBy({ left: -125, behavior: 'smooth' });

            // العودة لليمين للبداية بعد 800ms ليبقى العضو الأول وزره ظاهراً بالكامل
            returnTimer = setTimeout(() => {
              if (!userInteracted.current && sliderRef.current) {
                sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                endTimer = setTimeout(() => {
                  isAutoScrolling.current = false;
                }, 600);
              } else {
                isAutoScrolling.current = false;
              }
            }, 800);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
      if (nudgeTimer) clearTimeout(nudgeTimer);
      if (returnTimer) clearTimeout(returnTimer);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [loading, members.length]);

  const handleManualScroll = (direction: 'next' | 'prev') => {
    userInteracted.current = true;
    isAutoScrolling.current = false;
    if (!sliderRef.current) return;
    const el = sliderRef.current;
    const cardWidth = el.firstElementChild?.clientWidth || 160;
    // In RTL: 'next' (revealing cards to the left) uses negative delta, 'prev' uses positive delta
    const delta = direction === 'next' ? -(cardWidth * 1.5) : (cardWidth * 1.5);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const onScrollHandler = () => {
    if (!isAutoScrolling.current) {
      userInteracted.current = true;
    }
  };

  const onUserTouch = () => {
    userInteracted.current = true;
    isAutoScrolling.current = false;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAE3D9] p-3 sm:p-4 shadow-2xs">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3 text-right">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-xs`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base font-['Cairo'] text-[#1C1917] truncate">{title}</h3>
              <span className={`text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeClass} whitespace-nowrap`}>
                {badgeText}
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        {/* Action and Navigation Arrows */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Scroll Arrows */}
          <div className="hidden sm:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#EAE3D9]">
            <button
              type="button"
              onClick={() => handleManualScroll('prev')}
              className="w-7 h-7 rounded-lg bg-white hover:bg-[#F5ECE0] text-[#57534E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs border border-[#EAE3D9]/60"
              title="السابق (يمين)"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleManualScroll('next')}
              className="w-7 h-7 rounded-lg bg-white hover:bg-[#F5ECE0] text-[#57534E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs border border-[#EAE3D9]/60"
              title="التالي (يسار)"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={link}
            className="text-[11px] sm:text-xs font-bold text-[#7B113A] hover:underline flex items-center gap-1 font-['Cairo'] whitespace-nowrap bg-[#FAF7F2] hover:bg-[#F5ECE0] px-2.5 py-1.5 rounded-xl border border-[#EAE3D9] transition-colors"
          >
            <span>{linkText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Swipe hint on mobile screens */}
      <div className="sm:hidden flex items-center justify-between text-[10px] text-[#A16207] bg-[#FEF8EC] px-2.5 py-1 rounded-lg mb-2.5 border border-[#F1E0B6]/60">
        <span className="font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
          <span>اسحب لليسار لمعاينة المزيد من الملفات</span>
        </span>
        <span className="font-bold text-[#7B113A]">⟵ مرّر</span>
      </div>

      {/* Horizontal Carousel Track: Exactly 2 cards and 0.5 card peek (2.35 cards visible) */}
      <div
        ref={sliderRef}
        onScroll={onScrollHandler}
        onTouchStart={onUserTouch}
        onMouseDown={onUserTouch}
        onWheel={onUserTouch}
        className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 pt-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading && !members.length ? (
          <>
            {[1, 2, 3].map((n) => (
              <div
                key={`skeleton-${n}`}
                className="flex-none w-[calc((100%-0.625rem)/2.35)] sm:w-[calc((100%-1.75rem)/3.35)] md:w-[calc((100%-2.5rem)/4.35)] snap-start"
              >
                <div className="rounded-2xl overflow-hidden border border-cream-200/60 bg-white animate-pulse">
                  <div className="aspect-[3/4] bg-cream-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-cream-200/80 rounded-full w-2/3" />
                    <div className="h-2.5 bg-cream-100 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : members.length > 0 ? (
          members.map((member) => (
            <div
              key={`row-member-${member.id}`}
              className="flex-none w-[calc((100%-0.625rem)/2.35)] sm:w-[calc((100%-1.75rem)/3.35)] md:w-[calc((100%-2.5rem)/4.35)] snap-start flex flex-col"
            >
              <MemberCard member={member} />
            </div>
          ))
        ) : (
          <div className="w-full py-6 text-center text-xs text-[#78716C] bg-[#FAF7F2] rounded-xl border border-dashed border-[#EAE3D9]">
            لا توجد ملفات متوفرة حالياً في هذا القسم.
          </div>
        )}
      </div>
      {/* نقطة استشعار موازية لزر عرض الملف في أسفل البطاقة */}
      <div ref={bottomTriggerRef} className="h-0.5 w-full pointer-events-none opacity-0" aria-hidden="true" />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { members, membersLoading, user, socialSettings } = useApp();
  const isLoggedIn = !!user?.isLoggedIn;
  const [quickGender, setQuickGender] = useState<'female' | 'male' | 'all'>('female');
  const [quickCountry, setQuickCountry] = useState('قطر');
  const [quickCity, setQuickCity] = useState('');
  const [geoReady, setGeoReady] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve(dataService.db.ensureGeoLoaded?.())
      .catch(() => undefined)
      .finally(() => { if (active) setGeoReady(true); });
    return () => { active = false; };
  }, []);

  const countryOptions = useMemo(() => {
    const names = dataService.db.getCountryNames?.() || [];
    return names.length ? names : COUNTRIES;
  }, [geoReady]);

  const cityOptions = useMemo(() => {
    if (!quickCountry) return [];
    const cities = dataService.db.getCities?.(quickCountry) || [];
    return cities.length ? cities : (CITIES_BY_COUNTRY[quickCountry] || []);
  }, [quickCountry, geoReady]);


  const featuredFemales = useMemo(() => {
    const seen = new Set<string>();
    const list = members.filter((member) => {
      if (!member || (member.status && member.status !== 'active')) return false;
      if (!(member.nickname || member.realName || member.id) || seen.has(member.id)) return false;
      if (member.gender !== 'female') return false;
      seen.add(member.id);
      return true;
    }).sort((a, b) => {
      const featA = isFeatured(a) ? 1 : 0;
      const featB = isFeatured(b) ? 1 : 0;
      if (featA !== featB) return featB - featA;
      return getMemberTimestamp(b) - getMemberTimestamp(a);
    });
    return list.slice(0, 10);
  }, [members]);

  const featuredMales = useMemo(() => {
    const seen = new Set<string>();
    const list = members.filter((member) => {
      if (!member || (member.status && member.status !== 'active')) return false;
      if (!(member.nickname || member.realName || member.id) || seen.has(member.id)) return false;
      if (member.gender !== 'male') return false;
      seen.add(member.id);
      return true;
    }).sort((a, b) => {
      const featA = isFeatured(a) ? 1 : 0;
      const featB = isFeatured(b) ? 1 : 0;
      if (featA !== featB) return featB - featA;
      return getMemberTimestamp(b) - getMemberTimestamp(a);
    });
    return list.slice(0, 10);
  }, [members]);

  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (quickGender !== 'all') params.set('gender', quickGender);
    if (quickCountry) params.set('country', quickCountry);
    if (quickCity) params.set('city', quickCity);
    navigate(`/search?${params.toString()}`);
  };

  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const whatsappNumber = socialSettings?.whatsappNumber?.replace(/[+\s-]/g, '') || '97455620331';
  const showWhatsapp = true;

  const openWhatsApp = (msg: string = 'السلام عليكم ورحمة الله، أود الاستفسار والتسجيل في منصة تلاقي القطرية للزواج') => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-[#FCFBF9] text-[#1C1917] pb-0 font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Container aligned with the mobile & desktop layout */}
      <div className="max-w-[520px] sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 pt-3 sm:pt-6">

        {/* 1. TOP BADGE */}
        <div className="flex items-center justify-center mb-3.5">
          <div className="inline-flex items-center gap-2 bg-[#FFFDF7] border-2 border-[#D4AF37] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-['Cairo'] font-extrabold text-[#680E30] shadow-sm antialiased shrink-0">
            <Award className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>منصة تلاقي للزواج القطري - من هنا تبدأ حكاية العمر 🇶🇦</span>
          </div>
        </div>

        {/* 2. MAIN HEADLINE */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] font-['Cairo'] tracking-tight leading-tight">
            أهلاً بكم في منصة تلاقي القطرية للزواج
          </h1>
          <p className="text-sm sm:text-base font-bold text-[#57534E] mt-1.5 flex items-center justify-center gap-1.5">
            <span>زواج شرعي في قطر.. وتوافق أسري بستر وكرامة</span>
            <span>🇶🇦</span>
          </p>
        </div>

        {/* 3. HERO IMAGE CARD (COURTYARD & MAROON OVERLAY BANNER - HIGH SHARPNESS) */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#EAE3D9] mb-3.5 group bg-[#680E30]">
          <img
            src={heroCourtyard}
            alt="منصة تلاقي للزواج القطري - من هنا تبدأ حكاية العمر"
            className="w-full h-48 sm:h-64 object-cover object-center brightness-100 group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#500A25] via-[#680E30]/90 to-transparent pt-8 pb-4 px-4 text-center sm:text-right">
            <p className="text-white text-xs sm:text-[13px] font-bold leading-relaxed antialiased">
              منصة تلاقي القطرية للزواج هي البوابة العصرية والآمنة للباحثين عن زواج شرعي وتوافق أسري بقطر، والبديل الذكي والخصوصي لخدمات خطابة قطر والدوحة بستر وخصوصية تامة.
            </p>
          </div>
        </div>

        {/* 4. STATS CARD (3 Columns) */}
        <div className="bg-white rounded-2xl border border-[#EAE3D9] shadow-2xs p-3.5 mb-3.5 grid grid-cols-3 divide-x divide-x-reverse divide-[#F0EAE1] text-center items-center">
          <div>
            <div className="text-lg sm:text-xl font-black text-[#1C1917] font-['Cairo'] leading-none">
              +1,200
            </div>
            <div className="text-[11px] text-[#78716C] mt-1 font-medium">توفيق ناجح</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-[#1C1917] font-['Cairo'] leading-none">
              100%
            </div>
            <div className="text-[11px] text-[#78716C] mt-1 font-medium">خصوصية مصونة</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Scale className="w-4 h-4 text-[#7B113A] mb-1" />
            <div className="text-[11px] text-[#78716C] font-medium leading-none">ضوابط شرعية</div>
          </div>
        </div>

        {/* 5. PRIMARY ACTION BUTTONS */}
        <div className="space-y-2 mb-6">
          <Link
            to="/search"
            className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white py-3 px-5 rounded-xl font-bold font-['Cairo'] text-sm flex items-center justify-center gap-2 shadow-sm shadow-[#7B113A]/20 transition-all active:scale-[0.99]"
          >
            <Search className="w-4 h-4" />
            <span>استعراض طلبات الزواج</span>
          </Link>

          <Link
            to={isLoggedIn ? '/profile' : '/register'}
            className="w-full bg-[#FAF7F2] hover:bg-[#F5EFE4] text-[#7B113A] border border-[#E5DAC6] py-3 px-5 rounded-xl font-bold font-['Cairo'] text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-[#A16207]" />
            <span>{isLoggedIn ? 'ملفي الشخصي' : 'تقديم طلب جديد وسري'}</span>
          </Link>
        </div>

        {/* 6. QUICK SEARCH FORM (PRESERVED LOGIC & REFINED DESIGN) */}
        <form onSubmit={handleQuickSearch} className="bg-white rounded-2xl border border-[#EAE3D9] p-4 sm:p-5 shadow-xs mb-8">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#F5EFE7]">
            <div className="w-8 h-8 rounded-xl bg-[#FEF8EC] text-[#A16207] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 className="font-black text-sm font-['Cairo'] text-[#1C1917]">ابدأ بحثك السريع</h2>
              <p className="text-[11px] text-[#78716C]">اختر الأساسيات، ثم استكشف تفاصيل الملفات والمواصفات.</p>
            </div>
          </div>

          {/* Gender Selector */}
          <div className="mb-3">
            <label className="block text-xs font-bold text-[#57534E] mb-1.5 text-right font-['Cairo']">
              أبحث عن:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['female', 'زوجة'],
                ['male', 'زوج'],
                ['all', 'الجميع'],
              ] as const).map(([val, label]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setQuickGender(val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    quickGender === val
                      ? 'bg-[#7B113A] text-white border-[#7B113A] shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#57534E] border-[#EAE3D9] hover:bg-[#F5ECE0]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-2 mb-1.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#57534E] text-right">
                  الدولة:
                </label>
                <span className="text-[11px] text-[#A16207] bg-[#FEF8EC] px-1.5 py-0.5 rounded font-bold border border-[#F5EFE7] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#A16207]" /> مقفلة
                </span>
              </div>
              <div
                className="w-full bg-[#FAF7F2] border border-[#EAE3D9] rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-800 flex items-center justify-between shadow-2xs select-none cursor-default"
                title="الدولة مقفلة على قطر — الاختيار للمدن فقط"
              >
                <span className="flex items-center gap-1.5">
                  <span>🇶🇦</span>
                  <span>دولة قطر</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">الرئيسية</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="home-city" className="block text-xs font-bold text-[#57534E] text-right">
                  المدينة:
                </label>
                <span className="text-[11px] text-[#7B113A] font-bold">
                  (اختر المدينة)
                </span>
              </div>
              <select
                id="home-city"
                value={quickCity}
                disabled={!quickCountry}
                onChange={(e) => setQuickCity(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE3D9] rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-800 focus:outline-[#7B113A] focus:border-[#7B113A]"
              >
                <option value="">اختر المدينة (أو كل المدن)</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-[#78716C] mb-3 text-right">
            💡 الدولة مقفلة على قطر — الاختيار للمدن والبلديات القطرية فقط.
          </p>

          <button
            type="submit"
            className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white py-2.5 px-4 rounded-xl text-xs font-bold font-['Cairo'] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>عرض نتائج البحث</span>
          </button>
        </form>

        {/* 7. SECTION: أقسام التوفيق الرئيسية (2x2 GRID) */}
        <section className="mb-8">
          <div className="text-right mb-3.5">
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FDF1F4] text-[#7B113A] mb-1">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-[#1C1917] font-['Cairo']">
              أقسام التوفيق الرئيسية
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              تصفح وفق الرغبة الشرعية والاجتماعية
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-3">
            {/* قسم الرجال */}
            <div
              onClick={() => navigate('/search?gender=male')}
              className="bg-white rounded-2xl border border-[#EAE3D9] p-3.5 sm:p-4 flex flex-col justify-between hover:border-[#7B113A]/50 hover:shadow-xs transition-all cursor-pointer shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-[#F5F2EC] text-[#78716C] px-2 py-0.5 rounded-full font-medium">
                    نشط الآن
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FDF1F4] text-[#7B113A] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[#1C1917] font-['Cairo'] mb-1 group-hover:text-[#7B113A] transition-colors">
                  قسم الرجال
                </h3>
                <p className="text-[11px] sm:text-xs text-[#78716C] leading-snug line-clamp-2">
                  طلبات الشباب والرجال الباحثين عن الحلال والتأسيس الأسري
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F5F0E8] text-[11px] sm:text-xs text-[#78716C] group-hover:text-[#7B113A]">
                <span className="font-semibold">ملفات الرجال</span>
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>

            {/* قسم النساء */}
            <div
              onClick={() => navigate('/search?gender=female')}
              className="bg-white rounded-2xl border border-[#EAE3D9] p-3.5 sm:p-4 flex flex-col justify-between hover:border-[#7B113A]/50 hover:shadow-xs transition-all cursor-pointer shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-[#F5F2EC] text-[#78716C] px-2 py-0.5 rounded-full font-medium">
                    محمي وسري
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEF8EC] text-[#A16207] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[#1C1917] font-['Cairo'] mb-1 group-hover:text-[#7B113A] transition-colors">
                  قسم النساء
                </h3>
                <p className="text-[11px] sm:text-xs text-[#78716C] leading-snug line-clamp-2">
                  ملفات واستشارات التوفيق الموثوقة لفتيات وسيدات المجتمع
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F5F0E8] text-[11px] sm:text-xs text-[#78716C] group-hover:text-[#7B113A]">
                <span className="font-semibold">ملفات النساء</span>
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="w-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E5DAC6] rounded-xl p-3 flex items-center justify-between text-xs font-bold font-['Cairo'] text-[#1C1917] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7B113A]" />
              <span>عرض جميع الأقسام والطلبات المتاحة</span>
            </div>
            <span className="bg-[#7B113A] text-white text-[10px] px-2 py-0.5 rounded-full">
              +148 طلب تجريبي
            </span>
          </button>
        </section>

        {/* 8. 3-STEP OVERVIEW SECTION */}
        <section className="mb-8 bg-white rounded-2xl border border-[#EAE3D9] p-4 sm:p-5 shadow-2xs">
          <div className="text-right mb-4">
            <h2 className="text-base font-black text-[#1C1917] font-['Cairo']">الخدمة في ثلاث خطوات</h2>
            <p className="text-xs text-[#78716C]">طريقة ميسرة وموثوقة للبحث والتوفيق</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {overviewSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] flex items-start gap-2.5 text-right">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF8EC] text-[#A16207] flex items-center justify-center shrink-0 font-bold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917] mb-0.5">{step.title}</h3>
                    <p className="text-[11px] text-[#78716C] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. FEATURED MEMBERS (الأعضاء المميزون) — الصف الأول نساء والصف الثاني رجال مع سحب أفقي */}
        <section id="featured-members" className="mb-8">
          <div className="flex items-center justify-between mb-3.5 text-right">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF8EC] text-[#A16207] border border-[#F1E0B6] text-[10px] sm:text-xs font-bold mb-1.5 font-['Cairo']">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>عضويات مميزة وموثقة</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1C1917] font-['Cairo']">الأعضاء المميزون</h2>
              <p className="text-xs text-[#78716C]">ملفات موثقة بعناية؛ اسحب أفقياً لمعاينة المزيد من الملفات</p>
            </div>
            <Link to="/search" className="text-xs font-bold text-[#7B113A] hover:underline flex items-center gap-1 font-['Cairo'] bg-[#FDF1F4] hover:bg-[#FBE3E8] px-3 py-2 rounded-xl border border-[#F9D7DF] transition-colors">
              <span>عرض جميع الأعضاء</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {/* الصف الأول: نساء */}
            <FeaturedRow
              title="قسم النساء"
              subtitle="ملفات فتيات وسيدات موثقة وسرية"
              icon={Heart}
              iconColor="text-[#7B113A]"
              iconBg="bg-[#FDF1F4]"
              badgeText="عرائس موثقات"
              badgeClass="bg-[#FDF1F4] text-[#7B113A] border-[#F9D7DF]"
              link="/search?gender=female"
              linkText="تصفح كل النساء"
              members={featuredFemales}
              loading={membersLoading}
            />

            {/* الصف الثاني: رجال */}
            <FeaturedRow
              title="قسم الرجال"
              subtitle="طلبات شباب ورجال جادة ومكتملة البيانات"
              icon={User}
              iconColor="text-[#1E3A8A]"
              iconBg="bg-[#EFF6FF]"
              badgeText="عرسان جادون"
              badgeClass="bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]"
              link="/search?gender=male"
              linkText="تصفح كل الرجال"
              members={featuredMales}
              loading={membersLoading}
            />
          </div>
        </section>

        {/* 11. JOURNEY STEPS (مراحل التوافق) */}
        <section id="home-journey" className="mb-8 scroll-mt-20">
          <div className="text-right mb-3.5">
            <h2 className="text-lg font-black text-[#1C1917] font-['Cairo']">كيف تسير رحلة التوافق؟</h2>
            <p className="text-xs text-[#78716C]">هذه مراحل رحلة الأعضاء المسجّلين، أما ملفات الوساطة فيتولى الفريق التنسيق بشأنها.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-white rounded-2xl border border-[#EAE3D9] p-3.5 text-right shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-[#A16207]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#FEF8EC] text-[#A16207] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917] mb-1">{step.title}</h3>
                  <p className="text-[11px] text-[#78716C] leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#78716C] text-center bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE3D9]">
            قبول الطلب أو سداد الرسوم لا يضمن إتمام الزواج؛ قرار الاستمرار للطرفين.
          </p>
        </section>

        {/* 12. SERVICES & FEES (اعرف ما هو مجاني وما هو مدفوع) */}
        <section id="home-fees" className="mb-8 scroll-mt-20">
          <div className="text-right mb-3.5">
            <h2 className="text-lg font-black text-[#1C1917] font-['Cairo']">اعرف ما هو مجاني وما هو مدفوع</h2>
            <p className="text-xs text-[#78716C]">خدمات واضحة. الاشتراك في إحداها لا يعني شمول الخدمات الأخرى.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            {serviceOptions.map((opt) => (
              <div key={opt.title} className="bg-white rounded-2xl border border-[#EAE3D9] p-4 text-right shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-[#FEF8EC] text-[#A16207] border border-[#F1E0B6] px-2 py-0.5 rounded-full font-bold">
                    {opt.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#7B113A]">{opt.number}</span>
                </div>
                <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917] mb-1">{opt.title}</h3>
                <p className="text-[11px] text-[#78716C] leading-relaxed">{opt.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#78716C] pt-1">
            <Link to="/plans" className="text-[#7B113A] font-bold hover:underline font-['Cairo']">
              تفاصيل العضوية والباقات ←
            </Link>
            <Link to="/legal/terms" className="hover:underline font-['Cairo']">
              الشروط والأحكام ←
            </Link>
          </div>
        </section>

        {/* 13. QURANIC VERSE MAROON BANNER */}
        <div className="rounded-2xl bg-gradient-to-r from-[#590C28] via-[#7B113A] to-[#600C2B] p-5 text-center text-white mb-8 shadow-sm border border-[#7B113A]/40 relative overflow-hidden">
          <div className="relative z-10">
            <p className="font-['Cairo'] text-sm sm:text-base font-bold tracking-wide text-[#FFF0D4] drop-shadow-sm leading-relaxed">
              «وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا»
            </p>
          </div>
        </div>

        {/* 14. PRIVACY PRINCIPLES (اعرف ما تشاركه) */}
        <section className="mb-8 bg-white rounded-2xl border border-[#EAE3D9] p-4 sm:p-5 shadow-2xs">
          <div className="text-right mb-4">
            <h2 className="text-lg font-black text-[#1C1917] font-['Cairo']">معلومات واضحة، وقرار التواصل لك</h2>
            <p className="text-xs text-[#78716C]">اطّلع على تفاصيل الملف، وافهم معنى الشارات، وشارك ما تختاره من وسائل التواصل في المرحلة المناسبة.</p>
          </div>

          <div className="space-y-3 text-right">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-lg bg-[#FDF1F4] text-[#7B113A] flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917]">النبذة العامة ليست مكاناً للبيانات الحساسة</h3>
                <p className="text-[11px] text-[#78716C] mt-0.5">لا تكتب رقم هاتفك أو بيانات هويتك أو معلوماتك المالية في وصف الملف.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-lg bg-[#FEF8EC] text-[#A16207] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917]">لكل شارة معنى مختلف</h3>
                <p className="text-[11px] text-[#78716C] mt-0.5">العضوية المميزة ليست توثيق هوية، والتوثيق ليس ضماناً لنجاح العلاقة.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-lg bg-[#FDF1F4] text-[#7B113A] flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs font-['Cairo'] text-[#1C1917]">مسار مختلف لملفات الوساطة</h3>
                <p className="text-[11px] text-[#78716C] mt-0.5">تتولى الإدارة التنسيق مع الجهة المعنية؛ لا تفترض أن صاحب الملف يتابع الطلب بنفسه.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 15. FAQS ACCORDION */}
        <section id="home-faq" className="mb-8">
          <div className="text-right mb-3.5">
            <h2 className="text-lg font-black text-[#1C1917] font-['Cairo']">الأسئلة الأكثر شيوعاً</h2>
            <p className="text-xs text-[#78716C]">إجابات مختصرة تساعدك على فهم نظام وسرية المنصة.</p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className="bg-white rounded-2xl border border-[#EAE3D9] overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-right font-bold text-xs sm:text-sm text-[#1C1917] font-['Cairo'] hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#78716C] transition-transform duration-300 shrink-0 mr-2 ${
                        isOpen ? 'rotate-180 text-[#7B113A]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#57534E] leading-relaxed border-t border-[#F5EFE7] bg-[#FAF8F5]/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 16. OFFICIAL CHANNELS & CONTACT SECTION */}
        <section className="bg-white rounded-2xl border border-[#EAE3D9] p-4 mb-6 shadow-xs text-right">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-[#1C1917] font-['Cairo']">
                  قنوات التواصل والمنصات الرسمية
                </h2>
                <span>🇶🇦</span>
              </div>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                احرص على التواصل عبر القنوات المعتمدة فقط
              </p>
            </div>
          </div>

          {/* Main Maroon WhatsApp Button */}
          <a
            href="https://wa.me/97455620331?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%A7%D9%84%D8%B2%D9%88%D8%A7%D8%AC%20%D8%A7%D9%84%D9%82%D8%B7%D8%B1%D9%8A%D8%A9%20%D9%84%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white py-3.5 px-4 rounded-xl flex items-center justify-between shadow-sm transition-all mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="text-center">
              <div className="font-bold font-['Cairo'] text-sm">محادثة واتساب المباشرة</div>
              <div className="text-[11px] text-white/80 font-mono mt-0.5">
                <span dir="ltr" className="inline-block">+974 5562 0331</span> (خط الإدارة المعتمد)
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </a>

          {/* قنوات الواتساب الرسمية */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <a
              href="https://whatsapp.com/channel/0029Vb9aTfYJpe8ZTJci423D"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FEF9ED] border border-[#F3E2B8] rounded-xl p-3 flex items-center justify-between hover:bg-[#FDF4DF] transition-colors cursor-pointer group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#A16207] transition-transform group-hover:scale-110" />
              <div className="text-right">
                <div className="text-xs font-bold text-[#1C1917] font-['Cairo'] flex items-center justify-end gap-1">
                  <span>قناة واتساب الأولى</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-[10px] text-[#78716C] mt-0.5">تحديثات وطلبات جديدة</div>
              </div>
            </a>

            <a
              href="https://whatsapp.com/channel/0029VbCUagQ6hENpQFwsIZ3Z"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF7F2] border border-[#EAE3D9] rounded-xl p-3 flex items-center justify-between hover:bg-[#F3ECE0] transition-colors cursor-pointer group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#78716C] transition-transform group-hover:scale-110" />
              <div className="text-right">
                <div className="text-xs font-bold text-[#1C1917] font-['Cairo'] flex items-center justify-end gap-1">
                  <span>قناة واتساب الثانية</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-[10px] text-[#78716C] mt-0.5">الأرشيف والطلبات الخاصة</div>
              </div>
            </a>
          </div>

          {/* الحسابات والمنصات الرسمية الأخرى */}
          <div className="pt-3 border-t border-[#F5EFE7]">
            <div className="text-[11px] font-bold text-[#78716C] mb-2 font-['Cairo']">
              حساباتنا الرسمية على المنصات:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* إنستغرام 1 */}
              <a
                href="https://www.instagram.com/khatta_qatar0505/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] hover:border-[#7B113A]/30 flex items-center gap-2 transition-all hover:bg-white text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1C1917] font-['Cairo'] truncate">إنستغرام الأول</div>
                  <div className="text-[9px] text-[#78716C] truncate font-mono" dir="ltr">@khatta_qatar0505</div>
                </div>
              </a>

              {/* إنستغرام 2 */}
              <a
                href="https://www.instagram.com/khtabt_qtryh_am?psln=MWN4ZGRia2c5Mm4yZg=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] hover:border-[#7B113A]/30 flex items-center gap-2 transition-all hover:bg-white text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1C1917] font-['Cairo'] truncate">إنستغرام الثاني</div>
                  <div className="text-[9px] text-[#78716C] truncate font-mono" dir="ltr">@khtabt_qtryh_am</div>
                </div>
              </a>

              {/* تيك توك 1 */}
              <a
                href="https://www.tiktok.com/@qtryhkhtb"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] hover:border-[#7B113A]/30 flex items-center gap-2 transition-all hover:bg-white text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
                  <TikTokIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1C1917] font-['Cairo'] truncate">تيك توك الأول</div>
                  <div className="text-[9px] text-[#78716C] truncate font-mono" dir="ltr">@qtryhkhtb</div>
                </div>
              </a>

              {/* تيك توك 2 */}
              <a
                href="https://www.tiktok.com/@khtabt_qtryh_am"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] hover:border-[#7B113A]/30 flex items-center gap-2 transition-all hover:bg-white text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white shrink-0">
                  <TikTokIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1C1917] font-['Cairo'] truncate">تيك توك الثاني</div>
                  <div className="text-[9px] text-[#78716C] truncate font-mono" dir="ltr">@khtabt_qtryh_am</div>
                </div>
              </a>

              {/* يوتيوب */}
              <a
                href="https://youtube.com/@khatta_qatar"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] hover:border-[#7B113A]/30 flex items-center gap-2 transition-all hover:bg-white text-right col-span-2 sm:col-span-1"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FF0000] flex items-center justify-center text-white shrink-0">
                  <Youtube className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1C1917] font-['Cairo'] truncate">يوتيوب الرسمي</div>
                  <div className="text-[9px] text-[#78716C] truncate font-mono" dir="ltr">@khatta_qatar</div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* 17. FINAL CALL TO ACTION (خطوتك التالية) */}
        <section className="bg-gradient-to-tr from-[#680E30] to-[#7B113A] rounded-2xl p-5 sm:p-6 text-white text-right shadow-sm mb-8">
          <p className="text-xs font-semibold text-[#FEF8EC] mb-1 font-['Cairo']">خطوتك التالية</p>
          <h2 className="text-lg sm:text-xl font-black font-['Cairo'] mb-2">
            {isLoggedIn ? 'واصل البحث بخطوة واضحة' : 'ابدأ بملف يعبّر عنك بوضوح'}
          </h2>
          <p className="text-xs text-white/80 leading-relaxed mb-4 max-w-lg">
            {isLoggedIn
              ? 'راجع ملفك ومواصفاتك، أو استكشف الملفات وأرسل طلب توافق.'
              : 'أنشئ حسابك، وأضف معلوماتك ومواصفات الشريك الذي تبحث عنه.'}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to={isLoggedIn ? '/search' : '/register'}
              className="bg-white text-[#7B113A] font-bold text-xs font-['Cairo'] py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-[#FAF7F2] transition-colors"
            >
              <span>{isLoggedIn ? 'تصفّح الملفات' : 'إنشاء حساب مجاني'}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={isLoggedIn ? '/profile' : '/login'}
              className="border border-white/40 text-white font-bold text-xs font-['Cairo'] py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              {isLoggedIn ? 'مراجعة ملفي' : 'لدي حساب بالفعل'}
            </Link>
          </div>
        </section>

        {/* 18. PRIVACY DISCLAIMER */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#EAE3D9] p-3.5 mb-2 text-right">
          <div className="flex items-center gap-1.5 mb-1 justify-end text-[#A16207] font-bold text-xs font-['Cairo']">
            <span>تنويه الخصوصية والأمان</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-[#78716C] leading-relaxed">
            هذه النسخة تخضع لمعايير الأمان المشددة، لا تظهر هوية أو معلومات أي مشترك للعامة، وحقوق التواصل محصورة بإشراف إدارة المنصة حفاظاً على حرمة البيوت.
          </p>
        </div>



      </div>
    </div>
  );
}
