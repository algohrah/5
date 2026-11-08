import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Gem,
  Users,
  BadgeCheck,
  User,
  LogIn,
  Menu,
  X,
  Info,
  PhoneCall,
  Crown,
  Compass,
  FileText,
  ShieldCheck,
  MessageCircle,
  LogOut,
  ChevronLeft,
  Headphones,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../lib/AppContext';
import { useUnseenRequests } from '../../lib/useUnseenRequests';
import { useUnseenSupport } from '../../lib/useUnseenSupport';

export default function MobileNav() {
  const { user, logout, socialSettings } = useApp();
  const { unseenCount } = useUnseenRequests();
  const { unseenSupportCount } = useUnseenSupport();
  const location = useLocation();
  const isLoggedIn = !!user?.isLoggedIn;
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // تنظيف رقم الهاتف للواتساب
  const whatsappNumber = socialSettings?.whatsappNumber
    ? socialSettings.whatsappNumber.replace(/[+\s-]/g, '')
    : '97455620331';

  // القائمة السفلية للعضو المسجل:
  // 1. حسابي (/profile)
  // 2. الطلبات (/requests)
  // 3. الأعضاء (/search)
  // 4. الدعم (/admin-chat)
  // 5. المزيد (يفتح القائمة وبداخله الصفحة الرئيسية)
  const registeredNavItems = [
    {
      to: '/profile',
      label: 'حسابي',
      icon: User,
      end: false,
    },
    {
      to: '/requests',
      label: 'الطلبات',
      icon: FileText,
      end: false,
    },
    {
      to: '/search',
      label: 'الأعضاء',
      icon: Users,
      end: false,
    },
    {
      to: '/admin-chat',
      label: 'الدعم',
      icon: Headphones,
      end: false,
    },
  ];

  // القائمة السفلية للزائر غير المسجل:
  // 1. الرئيسية (/ )
  // 2. الأعضاء (/search)
  // 3. الباقات (/plans)
  // 4. دخول (/login)
  // 5. المزيد
  const guestNavItems = [
    {
      to: '/',
      label: 'الرئيسية',
      icon: Gem,
      end: true,
    },
    {
      to: '/search',
      label: 'الأعضاء',
      icon: Users,
      end: false,
    },
    {
      to: '/plans',
      label: 'الباقات',
      icon: BadgeCheck,
      end: false,
    },
    {
      to: '/login',
      label: 'دخول',
      icon: LogIn,
      end: false,
    },
  ];

  const activeNavItems = isLoggedIn ? registeredNavItems : guestNavItems;

  // صفحات قائمة "المزيد" للعضو المسجل (تحتوي على الصفحة الرئيسية أولاً كما طلب المستخدم)
  const registeredMorePages = [
    {
      to: '/',
      label: 'الصفحة الرئيسية',
      desc: 'العودة لواجهة المنصة الترحيبية وتفاصيل التوفيق',
      icon: Gem,
      color: 'bg-[#FDF1F4] text-[#7B113A]',
    },
    {
      to: '/about',
      label: 'من نحن',
      desc: 'تعرّف على منصة تلاقي القطرية للزواج ورؤيتنا للتوفيق الشرعي',
      icon: Info,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      to: '/contact',
      label: 'اتصل بنا والتواصل',
      desc: 'قنوات التواصل المباشرة وفريق الدعم والمساعدة',
      icon: PhoneCall,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      to: '/plans',
      label: 'الباقات والعضويات',
      desc: 'مزايا العضوية المميزة وخدمات التوفيق',
      icon: Crown,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      to: '/journey',
      label: 'رحلة التوافق',
      desc: 'مراحل التنسيق من الطلب وحتى إتمام القران',
      icon: Compass,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      to: '/legal/terms',
      label: 'الشروط والأحكام',
      desc: 'ضوابط وشروط استخدام منصة تلاقي القطرية للزواج',
      icon: FileText,
      color: 'bg-stone-50 text-stone-700',
    },
    {
      to: '/legal/privacy',
      label: 'سياسة الخصوصية',
      desc: 'معايير الأمان المشددة وحماية بيانات المشتركين',
      icon: ShieldCheck,
      color: 'bg-teal-50 text-teal-700',
    },
    {
      to: '/admin',
      label: 'لوحة الإدارة',
      desc: 'إدارة الطلبات والأعضاء والتحقق (خاص بالإدارة)',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  // صفحات قائمة "المزيد" للزائر
  const guestMorePages = [
    {
      to: '/about',
      label: 'من نحن',
      desc: 'تعرّف على منصة تلاقي القطرية للزواج ورؤيتنا للتوفيق الشرعي',
      icon: Info,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      to: '/contact',
      label: 'اتصل بنا والتواصل',
      desc: 'قنوات التواصل المباشرة وفريق الدعم والمساعدة',
      icon: PhoneCall,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      to: '/journey',
      label: 'رحلة التوافق',
      desc: 'مراحل التنسيق من الطلب وحتى إتمام القران',
      icon: Compass,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      to: '/legal/terms',
      label: 'الشروط والأحكام',
      desc: 'ضوابط وشروط استخدام منصة تلاقي القطرية للزواج',
      icon: FileText,
      color: 'bg-stone-50 text-stone-700',
    },
    {
      to: '/legal/privacy',
      label: 'سياسة الخصوصية',
      desc: 'معايير الأمان المشددة وحماية بيانات المشتركين',
      icon: ShieldCheck,
      color: 'bg-teal-50 text-teal-700',
    },
    {
      to: '/admin',
      label: 'لوحة الإدارة',
      desc: 'إدارة الطلبات والأعضاء والتحقق (خاص بالإدارة)',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  const morePages = isLoggedIn ? registeredMorePages : guestMorePages;

  return (
    <>
      {/* الشريط السفلي الثابت */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE3D9] py-1.5 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* التبويبات الأربعة الأولى */}
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={() => setMoreMenuOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all no-tap-highlight select-none ${
                    isActive && !moreMenuOpen
                      ? 'text-[#7B113A] font-bold'
                      : 'text-[#8C827A] hover:text-[#7B113A]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        className={`w-[21px] h-[21px] transition-transform ${
                          isActive && !moreMenuOpen ? 'scale-110 text-[#7B113A]' : 'text-[#8C827A]'
                        }`}
                        strokeWidth={isActive && !moreMenuOpen ? 2.3 : 1.8}
                      />
                      {item.to === '/requests' && unseenCount > 0 && (
                        <span
                          className={`absolute -top-2 -right-3 min-w-[19px] h-[19px] px-1 bg-[#7B113A] text-white text-[10px] font-black font-['Tajawal'] rounded-full flex items-center justify-center shadow-md border-2 border-white ring-2 ring-rose-400/50 animate-bounce pointer-events-none z-20 ${
                            isActive && !moreMenuOpen ? 'bg-rose-700' : 'bg-[#7B113A]'
                          }`}
                          title={`${unseenCount} طلبات توافق جديدة`}
                        >
                          {unseenCount > 99 ? '99+' : unseenCount}
                        </span>
                      )}
                      {item.to === '/admin-chat' && unseenSupportCount > 0 && (
                        <span
                          className={`absolute -top-2 -right-3 min-w-[19px] h-[19px] px-1 bg-[#7B113A] text-white text-[10px] font-black font-['Tajawal'] rounded-full flex items-center justify-center shadow-md border-2 border-white ring-2 ring-rose-400/50 animate-bounce pointer-events-none z-20 ${
                            isActive && !moreMenuOpen ? 'bg-rose-700' : 'bg-[#7B113A]'
                          }`}
                          title={`${unseenSupportCount} رسائل جديدة من الإدارة`}
                        >
                          {unseenSupportCount > 99 ? '99+' : unseenSupportCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-['Tajawal'] mt-0.5 ${
                        isActive && !moreMenuOpen ? 'font-bold text-[#7B113A]' : 'font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* التبويب الخامس: المزيد (زر يفتح قائمة بقية الصفحات) */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all no-tap-highlight select-none cursor-pointer ${
              moreMenuOpen
                ? 'text-[#7B113A] font-bold'
                : 'text-[#8C827A] hover:text-[#7B113A]'
            }`}
            aria-label="المزيد من الصفحات"
          >
            <div className="relative">
              <Menu
                className={`w-[21px] h-[21px] transition-transform ${
                  moreMenuOpen ? 'scale-110 text-[#7B113A]' : 'text-[#8C827A]'
                }`}
                strokeWidth={moreMenuOpen ? 2.3 : 1.8}
              />
            </div>
            <span
              className={`text-[11px] font-['Tajawal'] mt-0.5 ${
                moreMenuOpen ? 'font-bold text-[#7B113A]' : 'font-medium'
              }`}
            >
              المزيد
            </span>
          </button>
        </div>
      </nav>

      {/* نافذة "المزيد" السفلية (Bottom Sheet Drawer) */}
      <AnimatePresence>
        {moreMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreMenuOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 bg-white rounded-t-3xl border-t border-[#EAE3D9] shadow-2xl max-h-[85vh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+5rem)] text-right"
              dir="rtl"
            >
              {/* Handle bar */}
              <div className="w-12 h-1 bg-[#D8D0C5] rounded-full mx-auto mt-3 mb-2" />

              {/* Sheet Header */}
              <div className="px-5 py-3 border-b border-[#F0EAE1] flex items-center justify-between">
                <div>
                  <h3 className="font-['Cairo'] font-black text-base text-[#1C1917]">
                    بقية الصفحات والأقسام
                  </h3>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    اختر الصفحة التي ترغب في الانتقال إليها
                  </p>
                </div>
                <button
                  onClick={() => setMoreMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Links Grid / List */}
              <div className="overflow-y-auto px-4 py-3 divide-y divide-[#F5EFE7] max-h-[60vh]">
                {morePages.map((page) => {
                  const Icon = page.icon;
                  const isActive = location.pathname === page.to;
                  return (
                    <Link
                      key={page.to}
                      to={page.to}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-[#FAF7F2] ${
                        isActive ? 'bg-[#FAF7F2] text-[#7B113A]' : ''
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4 text-[#A8A29E]" />
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-['Cairo'] font-bold text-xs text-[#1C1917]">
                            {page.label}
                          </div>
                          <div className="text-[11px] text-[#78716C] mt-0.5">
                            {page.desc}
                          </div>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${page.color}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* زر محادثة واتساب المباشرة */}
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('السلام عليكم ورحمة الله، أود الاستفسار والتواصل مع إدارة منصة تلاقي القطرية للزواج')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMoreMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-emerald-50 text-emerald-800"
                >
                  <ChevronLeft className="w-4 h-4 text-emerald-600" />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-['Cairo'] font-bold text-xs text-emerald-900">
                        محادثة واتساب المباشرة
                      </div>
                      <div className="text-[11px] text-emerald-700/80 mt-0.5">
                        تواصل سريع مع خط الإدارة المعتمد
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4.5 h-4.5" />
                    </div>
                  </div>
                </a>

                {/* تسجيل الدخول / الخروج */}
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      logout();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-rose-50 text-rose-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-rose-400" />
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-['Cairo'] font-bold text-xs text-rose-800">
                          تسجيل الخروج
                        </div>
                        <div className="text-[11px] text-rose-600 mt-0.5">
                          الخروج من الحساب الحالي بأمان
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <LogOut className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-[#FAF7F2]"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#A8A29E]" />
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-['Cairo'] font-bold text-xs text-[#7B113A]">
                          تسجيل الدخول / إنشاء حساب
                        </div>
                        <div className="text-[11px] text-[#78716C] mt-0.5">
                          تابع طلباتك وملفك الشخصي
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#FDF1F4] text-[#7B113A] flex items-center justify-center shrink-0">
                        <LogIn className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
