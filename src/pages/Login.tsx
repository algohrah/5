import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAvatar } from '../lib/types';
import { useApp } from '../lib/AppContext';
import { verifyLocalAdmin, isLocalAdminEmail } from '../lib/adminAuth';
import authClient from '../lib/authClient';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithSession, showToast, members, adminMembers } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // ===== مسار الإدارة =====
      if (await isLocalAdminEmail(cleanEmail)) {
        const adminOk = await verifyLocalAdmin(cleanEmail, password);
        if (!adminOk) {
          setError('كلمة المرور غير صحيحة.');
          setLoading(false);
          return;
        }
        // تسجيل دخول المدير مباشرةً دون استدعاء signInWithPassword
        let matchedModerator: any = null;
        try {
          const savedUsers = JSON.parse(localStorage.getItem('saved_admin_users') || '[]');
          if (Array.isArray(savedUsers)) {
            matchedModerator = savedUsers.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
          }
        } catch { /* ignore */ }

        localStorage.setItem('twafok_demo_admin', 'true');
        localStorage.setItem('twafok_active_admin_email', cleanEmail);
        if (matchedModerator) {
          localStorage.setItem('twafok_current_admin_user', JSON.stringify(matchedModerator));
        }
        loginWithSession({
          id: matchedModerator?.id || 'admin-1',
          nickname: matchedModerator?.name || 'المدير العام',
          email: cleanEmail,
          verified: true,
          plan: 'featured',
        } as any, cleanEmail);
        showToast('تم تسجيل الدخول بصلاحية الإدارة', 'success');
        navigate('/admin');
        return;
      }

      // ===== مسار الأعضاء: الاستعلام المباشر من خادم Hostinger MySQL أولاً =====
      try {
        const apiRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        }).catch(() => null);

        if (apiRes) {
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.success && data.user) {
              loginWithSession(data.user, cleanEmail);
              showToast('مرحباً بك! تم تسجيل الدخول بنجاح', 'success');
              navigate(data.role === 'admin' ? '/admin' : from);
              return;
            }
          } else if (apiRes.status === 401) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            setLoading(false);
            return;
          }
        }
      } catch { /* متابعة للبحث الاحتياطي */ }

      // الاحتياطي: التحقق المحلي في حال انقطاع الشبكة
      const { error: signInError } = await authClient.auth.signInWithPassword({ email: cleanEmail, password });

      if (signInError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      // 2. البحث عن العضو في قاعدة البيانات المحلية كخيار بديل
      try {
        const savedMembers = JSON.parse(localStorage.getItem('saved_members_list') || '[]');
        const savedAdminMembers = JSON.parse(localStorage.getItem('saved_admin_members_list') || '[]');
        const twafokMembers = JSON.parse(localStorage.getItem('twafok_members') || '[]');
        const allList = [
          ...(Array.isArray(savedMembers) ? savedMembers : []),
          ...(Array.isArray(savedAdminMembers) ? savedAdminMembers : []),
          ...(Array.isArray(twafokMembers) ? twafokMembers : []),
          ...members,
          ...(adminMembers as any[]),
        ];
        const localMember = allList.find((m: any) => m.email?.toLowerCase().trim() === cleanEmail);
        if (localMember) {
          loginWithSession(localMember, cleanEmail);
          navigate(from);
          return;
        }
      } catch { /* ignore */ }

      setError('لا يوجد حساب بهذا البريد الإلكتروني. يرجى التسجيل أولاً.');
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="hidden lg:flex relative bg-navy-gradient items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-30" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="relative max-w-md text-center">
          <div className="grid grid-cols-2 gap-3 mb-8">
            <img src={getAvatar('female')} alt="" className="rounded-3xl shadow-xl w-full aspect-[3/4] object-cover ring-1 ring-white/20 bg-white/10" />
            <img src={getAvatar('male')} alt="" className="rounded-3xl shadow-xl w-full aspect-[3/4] object-cover ring-1 ring-white/20 bg-white/10" />
          </div>
          <h2 className="font-['Cairo'] font-black text-2xl sm:text-3xl text-white leading-tight">مرحبًا بك في <span className="text-[#FFF0D4]">منصة تلاقي القطرية للزواج</span></h2>
          <p className="mt-3 text-white/80 font-['Tajawal'] text-sm leading-relaxed">سجّل الدخول لمتابعة طلباتك ورحلتك نحو الشريك المناسب في سرية تامة.</p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-['Cairo'] font-bold text-white bg-white/15 px-3.5 py-1.5 rounded-full border border-white/20">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> دخول آمن ومحمي 🇶🇦
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-5 sm:p-12 bg-[#FCFBF9]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-1.5 text-[#57534E] hover:text-[#7B113A] font-['Cairo'] font-bold text-xs mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
          </Link>

          <h1 className="font-['Cairo'] font-black text-2xl sm:text-3xl text-[#1C1917]">تسجيل الدخول</h1>
          <p className="mt-1 text-[#78716C] font-['Tajawal'] text-xs sm:text-sm">أدخل بياناتك للوصول إلى حسابك ومتابعة طلباتك</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-['Tajawal']">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-['Cairo'] font-bold text-[#57534E] mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pr-11 pl-4 py-3 rounded-xl bg-white border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs text-[#1C1917] transition-colors text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-['Cairo'] font-bold text-[#57534E]">كلمة المرور</label>
                <Link to="/forgot-password" className="text-xs text-[#7B113A] font-['Cairo'] font-bold hover:underline">نسيت كلمة المرور؟</Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-11 pl-11 py-3 rounded-xl bg-white border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs text-[#1C1917] transition-colors text-right"
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white py-3 rounded-xl font-['Cairo'] font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 text-center text-xs">
            <p className="text-[#78716C] font-['Tajawal']">ليس لديك حساب بعد؟</p>
            <Link to="/register" className="inline-block mt-1 font-['Cairo'] font-bold text-[#7B113A] hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
