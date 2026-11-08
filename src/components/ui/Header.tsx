import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronDown, LogIn, UserPlus, Settings, Crown, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../ui/Logo';
import { useApp } from '../../lib/AppContext';
import { VerifiedBadge } from '../ui/Badge';
import { getCurrentUserId } from '../../lib/useInterestRequests';
import {
  getUnifiedUnreadCount,
  getUnifiedNotifications,
  markAllUnifiedNotificationsRead,
  markUnifiedNotificationRead,
  deleteUnifiedNotification,
  type UnifiedNotification
} from '../../lib/notifications';
import { useUnseenRequests } from '../../lib/useUnseenRequests';
import authClient from '../../lib/authClient';

const navLinks = [
  { to: '/', label: 'الرئيسية' },
  { to: '/search', label: 'البحث والتوافق' },
  { to: '/journey', label: 'رحلة التوافق' },
  { to: '/plans', label: 'الباقات' },
  { to: '/about', label: 'عن تلاقي' },
  { to: '/admin', label: 'لوحة الإدارة' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<UnifiedNotification[]>([]);
  const { user, logout } = useApp();
  const { unseenCount } = useUnseenRequests();
  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [dismissedNotifId, setDismissedNotifId] = useState<string | number | null>(null);

  const activeMemberId = user?.isLoggedIn ? (user?.memberId || getCurrentUserId()) : null;

  const loadRecentNotifs = useCallback(async () => {
    if (!user.isLoggedIn || !activeMemberId) return;
    const items = await getUnifiedNotifications(activeMemberId);
    setRecentNotifs(items);
  }, [user.isLoggedIn, activeMemberId]);

  useEffect(() => {
    if (user.isLoggedIn && activeMemberId) {
      loadRecentNotifs();
    }
  }, [user.isLoggedIn, activeMemberId, unreadNotifs, loadRecentNotifs]);

  const latestUnreadNotif = recentNotifs.find((n) => !n.read);
  const showNotifPopup = !!(
    user.isLoggedIn &&
    latestUnreadNotif &&
    latestUnreadNotif.id !== dismissedNotifId &&
    !notifDropdownOpen
  );

  useEffect(() => {
    let mounted = true;
    const loadUnread = async () => {
      if (!user.isLoggedIn || !activeMemberId) { if (mounted) setUnreadNotifs(0); return; }
      const count = await getUnifiedUnreadCount(activeMemberId);
      if (mounted) setUnreadNotifs(count);
    };
    loadUnread();
    // تحديث ذكي: عند العودة للنافذة/التبويب + فاصل طويل (60 ثانية) بدلاً من الاستعلام المفرط
    const onFocus = () => { loadUnread(); loadRecentNotifs(); };
    const onVisible = () => { if (document.visibilityState === 'visible') loadUnread(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onFocus);
    window.addEventListener('twafok_notification_update', onFocus);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadUnread();
    }, 60000);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onFocus);
      window.removeEventListener('twafok_notification_update', onFocus);
      window.clearInterval(timer);
    };
  }, [user.isLoggedIn, activeMemberId]);

  // اشتراك لحظي حقيقي عبر الاشتراك اللحظي المحلي — يُحدّث عدّاد الإشعارات فوراً عند وصول إشعار جديد
  useEffect(() => {
    if (!user.isLoggedIn || !activeMemberId || typeof authClient?.channel !== 'function') return;
    const channel = authClient
      .channel(`notifications-header-${activeMemberId}`)
      ?.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${activeMemberId}` }, async () => {
        const count = await getUnifiedUnreadCount(activeMemberId);
        setUnreadNotifs(count);
        if (notifDropdownOpen) loadRecentNotifs();
      })
      ?.subscribe();
    return () => { if (channel && typeof authClient?.removeChannel === 'function') authClient.removeChannel(channel); };
  }, [user.isLoggedIn, activeMemberId, notifDropdownOpen, loadRecentNotifs]);

  useEffect(() => {
    if (notifDropdownOpen) {
      loadRecentNotifs();
    }
  }, [notifDropdownOpen, loadRecentNotifs]);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EAE3D9] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16">

            {/* يمين: الشعار على الجوال والديسكتوب */}
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>

            {/* وسط: روابط التنقل (ديسكتوب فقط) */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#EAE3D9]">
                {[...navLinks, ...(user?.isLoggedIn ? [{ to: '/requests', label: 'طلباتي' }] : [])].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `relative px-3.5 py-1.5 rounded-xl font-['Cairo'] font-bold text-xs transition-all no-tap-highlight flex items-center gap-1.5 ${
                        isActive
                          ? 'text-white bg-[#7B113A] shadow-xs'
                          : 'text-[#57534E] hover:text-[#7B113A] hover:bg-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{link.label}</span>
                        {link.to === '/requests' && unseenCount > 0 && !isActive && (
                          <span className="min-w-[17px] h-[17px] px-1 bg-gradient-to-tr from-rose-600 to-[#7B113A] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                            {unseenCount > 99 ? '99+' : unseenCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

            {/* يسار: جرس الإشعارات + الحساب */}
            <div className="flex items-center gap-1">

              {/* جرس الإشعارات (مطابق للسكرين شوت) */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    if (latestUnreadNotif) setDismissedNotifId(latestUnreadNotif.id);
                  }}
                  className={`relative p-2 rounded-xl text-[#57534E] hover:text-[#7B113A] hover:bg-[#FAF7F2] transition-colors cursor-pointer no-tap-highlight ${
                    notifDropdownOpen ? 'bg-[#FAF7F2] text-[#7B113A]' : ''
                  }`}
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 left-1 w-4 h-4 bg-[#7B113A] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {/* قائمة منبثقة صغيرة لفي الإشعارات كأنها رسالة عند وجود إشعار جديد */}
                <AnimatePresence>
                  {showNotifPopup && latestUnreadNotif && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white/98 dark:bg-slate-900 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border-2 border-amber-300 dark:border-amber-500/40 ring-4 ring-amber-500/10 text-right dir-rtl"
                    >
                      {/* رأس التنبيه المنبثق */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                          </span>
                          <span className="font-cairo font-extrabold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                            إشعار جديد!
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (latestUnreadNotif) setDismissedNotifId(latestUnreadNotif.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="إغلاق التنبيه المنبثق"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* نص الرسالة المنبثقة */}
                      <div className="space-y-1 mb-3">
                        {latestUnreadNotif.title && (
                          <p className="font-cairo font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                            {latestUnreadNotif.title}
                          </p>
                        )}
                        <p className="font-tajawal text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-bold">
                          {latestUnreadNotif.text}
                        </p>
                      </div>

                      {/* زر الانتقال المباشر لصفحة الإشعار / الرحلة */}
                      <div className="pt-1">
                        <Link
                          to={latestUnreadNotif.href || '/notifications'}
                          onClick={() => {
                            if (latestUnreadNotif) {
                              markUnifiedNotificationRead(latestUnreadNotif.id);
                              setDismissedNotifId(latestUnreadNotif.id);
                            }
                            setUnreadNotifs((prev) => Math.max(0, prev - 1));
                          }}
                          className="w-full bg-gradient-to-r from-amber-600 via-[#7B113A] to-rose-700 hover:from-amber-700 hover:to-rose-800 text-white font-cairo font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer group"
                        >
                          <span>عرض الإشعار ومتابعة الطلب</span>
                          <span className="text-sm transition-transform group-hover:-translate-x-1">←</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                  <AnimatePresence>
                    {notifDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-3 w-80 sm:w-96 bg-white/98 dark:bg-navy-900 rounded-3xl shadow-luxe border border-cream-200 dark:border-white/10 overflow-hidden z-50 ring-luxe"
                      >
                        {/* رأس القائمة */}
                        <div className="p-4 bg-navy-gradient text-white relative overflow-hidden flex items-center justify-between border-b border-cream-200 dark:border-white/10">
                          <div className="absolute inset-0 pattern-arabesque opacity-20" />
                          <div className="relative flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gold-400" />
                            <span className="font-cairo font-extrabold text-sm text-cream-100">إشعاراتك</span>
                            {unreadNotifs > 0 && (
                              <span className="bg-rose-deep text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                {unreadNotifs} جديد
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center gap-2">
                            {unreadNotifs > 0 && (
                              <button
                                onClick={() => {
                                  markAllUnifiedNotificationsRead(getCurrentUserId());
                                  setUnreadNotifs(0);
                                  loadRecentNotifs();
                                }}
                                className="text-[10px] text-gold-300 hover:text-white font-cairo font-bold transition-colors cursor-pointer"
                              >
                                قراءة الكل
                              </button>
                            )}
                            <button
                              onClick={() => setNotifDropdownOpen(false)}
                              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                              title="إغلاق"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* قائمة الإشعارات */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-cream-100 dark:divide-white/5">
                          {recentNotifs.length === 0 ? (
                            <div className="p-8 text-center text-navy-400 dark:text-cream-300/60">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-navy-500" />
                              <p className="text-xs font-tajawal">لا توجد إشعارات حالياً</p>
                            </div>
                          ) : (
                            recentNotifs.slice(0, 5).map((n, idx) => {
                              const itemKey = (n?.id !== undefined && n?.id !== null && !Number.isNaN(Number(n.id))) ? `hdr-notif-${n.id}-${idx}` : `hdr-notif-idx-${idx}`;
                              return (
                                <div
                                  key={itemKey}
                                  className={`relative p-3.5 flex items-start gap-2.5 transition-colors hover:bg-cream-50/50 dark:hover:bg-white/5 ${
                                    !n.read ? 'bg-gold-50/10 dark:bg-gold-950/5' : ''
                                  }`}
                                >
                                  <Link
                                    to={n.href}
                                    onClick={() => {
                                      markUnifiedNotificationRead(n.id);
                                      setNotifDropdownOpen(false);
                                    }}
                                    className="flex-1 min-w-0 flex items-start gap-2.5"
                                  >
                                    {/* نقطة غير مقروء */}
                                    {!n.read && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0 text-right">
                                      <p className="text-[11px] font-cairo font-bold text-gold-600 dark:text-gold-400 mb-0.5">
                                        {n.title}
                                      </p>
                                      <p className={`text-xs font-tajawal leading-relaxed ${!n.read ? 'text-navy-950 dark:text-white font-bold' : 'text-navy-700 dark:text-cream-200/80'}`}>
                                        {n.text}
                                      </p>
                                    </div>
                                  </Link>

                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      deleteUnifiedNotification(n.id);
                                      loadRecentNotifs();
                                    }}
                                    className="p-1 rounded-full text-navy-300 hover:text-rose-600 dark:text-cream-200/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                    title="حذف"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* رابط عرض الكل */}
                        <div className="p-3 bg-cream-50/30 dark:bg-navy-950/40 border-t border-cream-200 dark:border-white/10 text-center">
                          <Link
                            to="/notifications"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="text-xs font-cairo font-bold text-navy-800 dark:text-cream-200 hover:text-gold-700 dark:hover:text-gold-400 transition-colors"
                          >
                            عرض جميع الإشعارات
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              {/* أيقونة الحساب مع القائمة المنسدلة */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl hover:bg-white/80 dark:hover:bg-white/8 transition-colors no-tap-highlight"
                  aria-label="الحساب"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center text-navy-950 font-black shadow-gold ring-1 ring-white/50">
                    {user.isLoggedIn ? (
                      (user?.profile?.name || user?.name || 'ع').charAt(0)
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-navy-500 transition-transform hidden sm:block ${accountOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* القائمة المنسدلة */}
                {accountOpen && (
                  <div className="absolute left-0 mt-3 w-64 bg-white/98 dark:bg-navy-900 rounded-3xl shadow-luxe border border-cream-200 dark:border-white/10 overflow-hidden animate-float-up ring-luxe">
                    {user.isLoggedIn ? (
                      <>
                        {/* بطاقة المستخدم */}
                        <div className="p-4 bg-navy-gradient relative overflow-hidden">
                          <div className="absolute inset-0 pattern-arabesque opacity-30" />
                          <div className="relative flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gold-gradient flex items-center justify-center text-navy-900 font-cairo font-bold text-lg flex-shrink-0">
                              {(user?.profile?.name || user?.name || 'ع').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-cairo font-bold text-white truncate">{user?.profile?.name || user?.name || 'عضو'}</span>
                                {user?.profile?.verified && <VerifiedBadge />}
                              </div>
                              <span className="text-xs text-cream-200/70 font-tajawal">
                                {user?.profile?.plan === 'featured' ? 'عضوية مميزة' : 'عضو مجاني'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* روابط الحساب */}
                        <div className="p-2">
                          <Link to="/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors">
                            <UserIcon className="w-4.5 h-4.5 text-gold-600" />
                            <span className="font-cairo font-semibold text-sm text-navy-800 dark:text-cream-100">ملفي الشخصي</span>
                          </Link>
                          <Link to="/complete-profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors">
                            <Settings className="w-4.5 h-4.5 text-gold-600" />
                            <span className="font-cairo font-semibold text-sm text-navy-800 dark:text-cream-100">أكمل ملفك</span>
                          </Link>
                          <Link to="/plans" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors">
                            <Crown className="w-4.5 h-4.5 text-gold-600" />
                            <span className="font-cairo font-semibold text-sm text-navy-800 dark:text-cream-100">ترقية الباقة</span>
                          </Link>
                          <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors">
                            <ShieldCheck className="w-4.5 h-4.5 text-amber-500" />
                            <span className="font-cairo font-semibold text-sm text-navy-800 dark:text-cream-100">لوحة الإدارة</span>
                          </Link>
                          <div className="my-1 h-px bg-cream-200 dark:bg-navy-850" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors text-rose-deep">
                            <LogOut className="w-4.5 h-4.5" />
                            <span className="font-cairo font-semibold text-sm">تسجيل الخروج</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* قائمة الضيف - تسجيل الدخول / إنشاء حساب */
                      <div className="p-4 space-y-3">
                        <div className="text-center pb-2">
                          <p className="font-cairo font-bold text-navy-900">مرحبًا بك في منصة تلاقي القطرية للزواج</p>
                          <p className="text-xs text-navy-500 font-tajawal mt-0.5">سجّل الدخول للوصول لحسابك</p>
                        </div>
                        <Link
                          to="/login"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold-gradient text-navy-900 font-cairo font-bold text-sm shadow-soft hover:shadow-gold transition-all"
                        >
                          <LogIn className="w-4.5 h-4.5" /> تسجيل الدخول
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gold-500 text-navy-900 font-cairo font-bold text-sm hover:bg-gold-300/10 transition-colors"
                        >
                          <UserPlus className="w-4.5 h-4.5" /> إنشاء حساب جديد
                        </Link>
                        <div className="pt-2 border-t border-cream-200 space-y-1">
                          <Link to="/plans" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-cream-100 transition-colors text-sm text-navy-600 font-tajawal">
                            <Crown className="w-4 h-4 text-gold-600" /> الباقات والأسعار
                          </Link>
                          <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-cream-100 transition-colors text-sm text-navy-600 font-tajawal">
                            <ShieldCheck className="w-4 h-4 text-amber-500" /> لوحة الإدارة
                          </Link>
                          <Link to="/contact" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-cream-100 transition-colors text-sm text-navy-600 font-tajawal">
                            <Settings className="w-4 h-4 text-gold-600" /> تواصل معنا
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-cream-50 shadow-2xl flex flex-col animate-float-up">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-cream-100">
                <X className="w-6 h-6 text-navy-800" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-5 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl font-cairo font-semibold transition-colors ${
                      isActive ? 'text-gold-700 bg-gold-300/15' : 'text-navy-700 hover:bg-cream-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3 mt-3 border-t border-cream-200 space-y-1">
                {[
                  { to: '/contact', label: 'اتصل بنا' },
                  { to: '/admin', label: 'لوحة الإدارة' },
                ].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl font-cairo font-medium text-sm text-navy-600 hover:bg-cream-100 transition-colors"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </nav>
            <div className="p-5 border-t border-cream-200 space-y-2">
              {user.isLoggedIn ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-navy-900 text-white font-cairo font-bold">
                    <UserIcon className="w-5 h-5" /> ملفي الشخصي
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-rose-deep/20 text-rose-deep font-cairo font-bold">
                    <LogOut className="w-5 h-5" /> تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full py-3 text-center rounded-xl border-2 border-gold-500 text-navy-900 font-cairo font-bold">
                    تسجيل الدخول
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="block w-full py-3 text-center rounded-xl bg-gold-gradient text-navy-900 font-cairo font-bold shadow-soft">
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
