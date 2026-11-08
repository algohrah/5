import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authClient from '../lib/authClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await authClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ متوقع، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#FCFBF9] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#EAE3D9] p-6 sm:p-8"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#7B113A] font-cairo font-semibold text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> العودة لتسجيل الدخول
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600" />
            </div>
            <h1 className="font-cairo font-extrabold text-xl sm:text-2xl text-neutral-900">تم تجهيز رابط التعيين!</h1>
            <p className="mt-2 text-neutral-600 font-tajawal leading-relaxed text-sm sm:text-base">
              يمكنك الآن المتابعة لتعيين كلمة مرور جديدة لحسابك المرتبط بالبريد <span className="font-bold text-[#7B113A]">{email}</span>.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full py-3.5 px-4 bg-[#7B113A] text-white font-cairo font-bold rounded-2xl hover:bg-[#500A25] transition text-center text-sm shadow-sm"
              >
                تعيين كلمة المرور الآن
              </Link>
              <Link
                to="/login"
                className="w-full py-3 px-4 bg-white border border-[#EAE3D9] text-neutral-700 font-cairo font-semibold rounded-2xl hover:bg-[#FAF7F2] transition text-center text-sm"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FDF2F4] border border-[#7B113A]/20 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#7B113A]" />
            </div>
            <h1 className="font-cairo font-extrabold text-xl sm:text-2xl text-neutral-900">نسيت كلمة المرور؟</h1>
            <p className="mt-2 text-neutral-600 font-tajawal text-sm sm:text-base">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm font-tajawal">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-cairo font-semibold text-neutral-800 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none font-tajawal text-neutral-900 transition-colors text-right"
                    dir="ltr"
                  />
                </div>
              </div>
              <Button type="submit" fullWidth size="lg" disabled={loading}>{loading ? 'جارِ الإرسال...' : 'إرسال رابط إعادة التعيين'}</Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
