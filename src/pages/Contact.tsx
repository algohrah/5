import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { dataService } from '../lib/data/DataService';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await dataService.db.tickets.create({
        user_id: dataService.db.getCurrentUserId() || 'visitor',
        subject: `[Contact Form] ${name} - ${subject}`,
        message: `Email: ${email}\n\nMessage:\n${message}`,
        status: 'open',
        priority: 'medium',
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }, 4000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('تعذّر إرسال الرسالة حالياً. يرجى المحاولة مرة أخرى لاحقًا.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'الهاتف المباشر وواتساب',
      value: '+974 5562 0331',
      sub: 'خط الإدارة المعتمد في قطر',
      link: 'https://wa.me/97455620331',
    },
    {
      icon: MapPin,
      title: 'المقر والترخيص',
      value: 'الدوحة، دولة قطر 🇶🇦',
      sub: 'خدمات التوفيق للقطريين والخليجيين',
    },
    {
      icon: Clock,
      title: 'ساعات التنسيق',
      value: 'يومياً من 9:00 ص - 10:00 م',
      sub: 'سرية تامة في استقبال ومتابعة الطلبات',
    },
    {
      icon: ShieldCheck,
      title: 'الخصوصية والأمان',
      value: 'بياناتك مشفرة ومصانة',
      sub: 'لا مشاركة لأي بيانات إلا بموافقة مسبقة',
    },
  ];

  return (
    <div className="bg-[#FCFBF9] min-h-screen text-[#1C1917] font-['Tajawal',sans-serif]" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-tr from-[#680E30] to-[#7B113A] relative overflow-hidden py-10 sm:py-14 text-center text-white">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#FFF0D4] text-xs font-['Cairo'] font-bold mb-3">
            تواصل باحترام وسرية 🇶🇦
          </span>
          <h1 className="font-['Cairo'] font-black text-2xl sm:text-3xl md:text-4xl text-white">اتصل بنا والتواصل</h1>
          <p className="mt-2 text-white/80 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            نحن هنا لخدمتكم ومرافقتكم في رحلة التوفيق الشرعي. تواصلوا معنا بكل طمأنينة.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Info Cards */}
          <div className="space-y-3">
            {contactInfo.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-4 shadow-2xs border border-[#EAE3D9] flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF1F4] text-[#7B113A] flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h3 className="font-['Cairo'] font-bold text-xs sm:text-sm text-[#1C1917]">{item.title}</h3>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#7B113A] hover:underline block mt-0.5">
                      <span dir="ltr" className="inline-block">{item.value}</span>
                    </a>
                  ) : (
                    <p className="text-xs text-[#57534E] font-medium mt-0.5">{item.value}</p>
                  )}
                  <p className="text-[11px] text-[#78716C] mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            {/* Quick WhatsApp Banner */}
            <a
              href="https://wa.me/97455620331?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D8%AE%D8%B7%D8%A7%D8%A8%D8%A9%20%D9%82%D8%B7%D8%B1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between hover:bg-emerald-100/70 transition-colors block text-right"
            >
              <div>
                <div className="font-['Cairo'] font-bold text-xs text-emerald-900">محادثة واتساب الفورية</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">اضغط هنا لبدء المحادثة المباشرة</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
            </a>
          </div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-3xl shadow-xs border border-[#EAE3D9] p-5 sm:p-7 text-right">
            <h2 className="font-['Cairo'] font-bold text-base sm:text-lg text-[#1C1917] mb-1">أرسل استفسارك أو طلبك</h2>
            <p className="text-xs text-[#78716C] mb-5">تصل رسالتك مباشرة لإدارة منصة تلاقي القطرية للزواج بسرية كاملة.</p>

            {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">{error}</div>}
            
            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-['Cairo'] font-bold text-base text-emerald-900">تم إرسال رسالتك بنجاح!</h3>
                <p className="text-xs text-emerald-700 mt-1">شكراً لتواصلك مع منصة تلاقي القطرية للزواج. سيقوم فريقنا بالرد عليك قريباً.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-['Cairo'] font-bold text-[#57534E] mb-1">الاسم أو اللقب</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs" placeholder="مثال: أم ناصر / فهد" />
                  </div>
                  <div>
                    <label className="block text-xs font-['Cairo'] font-bold text-[#57534E] mb-1">رقم الهاتف أو البريد الإلكتروني</label>
                    <input required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs" placeholder="+974 XXXXXXXX" dir="ltr" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-['Cairo'] font-bold text-[#57534E] mb-1">موضوع الاستفسار</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs" placeholder="مثال: استفسار عن زواج معلن / باقات التوفيق" />
                </div>

                <div>
                  <label className="block text-xs font-['Cairo'] font-bold text-[#57534E] mb-1">الرسالة أو التفاصيل</label>
                  <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] focus:border-[#7B113A] focus:outline-none text-xs resize-none" placeholder="اكتب تفاصيل استفسارك أو طلبك هنا..." />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#7B113A] hover:bg-[#680E30] text-white py-3 rounded-xl font-['Cairo'] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> إرسال الرسالة بسرية</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
