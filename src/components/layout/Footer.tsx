import { Link } from 'react-router-dom';
import { ShieldCheck, Instagram, Youtube } from 'lucide-react';
import Logo from '../ui/Logo';

function TikTokIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.34 6.34 0 0 0 6.33-6.32V9.06a8.16 8.16 0 0 0 4.91 1.63V7.24a4.83 4.83 0 0 1-1-.55z" />
    </svg>
  );
}

export default function Footer() {
  const allLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/search', label: 'البحث والتوافق' },
    { to: '/journey', label: 'رحلة التوافق' },
    { to: '/about', label: 'عن تلاقي' },
    { to: '/plans', label: 'الباقات' },
    { to: '/contact', label: 'اتصل بنا' },
    { to: '/legal/privacy', label: 'سياسة الخصوصية' },
    { to: '/legal/terms', label: 'الشروط والأحكام' },
  ];

  return (
    <footer className="bg-navy-gradient text-white mt-2 sm:mt-4 pb-20 lg:pb-0 relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 pattern-arabesque opacity-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10 space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
          {/* الشعار وحقوق النشر */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-right">
            <Logo variant="light" size="sm" />
            <span className="hidden sm:inline text-white/20">|</span>
            <p className="text-cream-200/60 font-tajawal text-xs">
              © 2026 منصة تلاقي القطرية للزواج. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* الروابط */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-center">
            {allLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-cream-200/80 hover:text-gold-300 font-tajawal text-[11px] sm:text-xs transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* السوشيال ميديا وشارة الأمان */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <a
                href="https://www.instagram.com/khatta_qatar0505/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 text-white text-[11px] font-['Tajawal'] font-bold transition-all hover:scale-105 shadow-xs"
                title="إنستغرام تلاقي 1"
                aria-label="إنستغرام 1"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>إنستغرام 1</span>
              </a>

              <a
                href="https://www.instagram.com/khtabt_qtryh_am?psln=MWN4ZGRia2c5Mm4yZg=="
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 text-white text-[11px] font-['Tajawal'] font-bold transition-all hover:scale-105 shadow-xs"
                title="إنستغرام تلاقي 2"
                aria-label="إنستغرام 2"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>إنستغرام 2</span>
              </a>

              <a
                href="https://www.tiktok.com/@qtryhkhtb"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-black border border-white/15 text-white text-[11px] font-['Tajawal'] font-bold transition-all hover:scale-105 shadow-xs"
                title="تيك توك 1"
                aria-label="تيك توك 1"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
                <span>تيك توك 1</span>
              </a>

              <a
                href="https://www.tiktok.com/@khtabt_qtryh_am"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-black border border-white/15 text-white text-[11px] font-['Tajawal'] font-bold transition-all hover:scale-105 shadow-xs"
                title="تيك توك 2"
                aria-label="تيك توك 2"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
                <span>تيك توك 2</span>
              </a>

              <a
                href="https://youtube.com/@khatta_qatar"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-['Tajawal'] font-bold transition-all hover:scale-105 shadow-xs"
                title="قناة يوتيوب الرسمية"
                aria-label="يوتيوب"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>يوتيوب</span>
              </a>
            </div>

            <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> بيئة محمية وسرية
            </span>
          </div>
        </div>

        {/* SEO Keywords footer bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-cream-200/40 text-center font-tajawal">
          <span>منصة تلاقي القطرية للزواج</span>
          <span>·</span>
          <span>زواج في قطر</span>
          <span>·</span>
          <span>خطابة قطر</span>
          <span>·</span>
          <span>خطابة قطرية ثقة بالدوحة</span>
          <span>·</span>
          <span>زواج شرعي ومحتشم</span>
          <span>·</span>
          <span>رحلة التوافق الأسري والثقافي</span>
        </div>

      </div>
    </footer>
  );
}
