import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Headphones, Plus, Send, Clock, CheckCircle2, AlertCircle,
  MessageSquare, ChevronLeft, Headphones as Support, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../lib/AppContext';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { getCurrentUserId } from '../lib/useInterestRequests';
import { markAllSupportSeen } from '../lib/useUnseenSupport';

const statusConfig = {
  open: { label: 'مفتوحة', color: 'text-sky-600 bg-sky-50', icon: Clock },
  in_progress: { label: 'قيد المعالجة', color: 'text-gold-600 bg-gold-300/15', icon: AlertCircle },
  resolved: { label: 'تم الحل', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  closed: { label: 'مغلقة', color: 'text-navy-400 bg-cream-100', icon: CheckCircle2 },
};

const categories = ['استفسار عام', 'طلب ترقية', 'مشكلة تقنية', 'شكوى', 'اقتراح'] as const;

export default function AdminChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    showToast,
    supportTickets,
    sendSupportMessage,
    createSupportTicket,
    members,
    user,
  } = useApp();

  const activeUserId = user?.memberId || getCurrentUserId();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<typeof categories[number]>('استفسار عام');
  const [newMessage, setNewMessage] = useState('');

  // عند فتح صفحة الدعم يتم تعليم كافة تذاكر ورسائل الإدارة كمشاهدة
  useEffect(() => {
    if (activeUserId) {
      markAllSupportSeen(activeUserId);
    }
  }, [activeUserId]);

  // Active ticket calculated reactively from shared state
  const activeTicket = supportTickets.find(t => t.id === activeTicketId) || null;

  // Sync / intercept partner coordination redirect parameters
  useEffect(() => {
    const partnerId = searchParams.get('partnerId');
    if (partnerId) {
      const partner = members.find(m => m.id === partnerId);
      if (partner) {
        const expectedSubject = `تنسيق اللقاء الشرعي - ${partner.nickname}`;
        // Try to find existing conversation
        const existing = supportTickets.find(
          t => (t.userId === activeUserId || t.userId === 'm2') && t.subject === expectedSubject
        );
        if (existing) {
          setActiveTicketId(existing.id);
        } else {
          const initialText = `السلام عليكم ورحمة الله وبركاته،
يسعدنا في إدارة «منصة تلاقي القطرية للزواج» البدء في تنسيق اللقاء الشرعي والتقريب المبارك بينكما.

بطاقة العضو المطلوب التنسيق معه:
• الاسم المستعار: ${partner.nickname}
• العمر: ${partner.age} سنة
• المدينة: ${partner.city}
• المؤهل الدراسي: ${partner.education}
• جهة العمل: ${partner.workType}

يرجى تأكيد رغبتكم بالبدء وسيقوم وسيط العلاقات بالتواصل مع عائلة العضو والبدء في الرؤية الشرعية الرسمية للطرفين.`;

          const created = createSupportTicket(expectedSubject, 'استفسار عام', initialText, activeUserId);
          setActiveTicketId(created.id);
          showToast('تم فتح محادثة تنسيق اللقاء الشرعي مع الإدارة 🌸', 'success');
        }
      }
      searchParams.delete('partnerId');
      setSearchParams(searchParams);
    }
  }, [searchParams, members, supportTickets, createSupportTicket, setSearchParams, showToast, activeUserId]);

  const sendMessage = () => {
    if (!draft.trim() || !activeTicketId) return;
    sendSupportMessage(activeTicketId, draft, 'user');
    setDraft('');

    // Simulated helper reply after 2.5 seconds
    setTimeout(() => {
      sendSupportMessage(
        activeTicketId,
        'شكرًا لتواصلك معنا في منصة تلاقي القطرية للزواج. تم استلام رسالتك، وسلَّم فريق التنسيق الطلب للمتابعة وسيتم إفادتك والتواصل المباشر في أقرب وقت. 🌸',
        'admin'
      );
    }, 2500);
  };

  const createTicket = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    const created = createSupportTicket(newSubject, newCategory, newMessage, activeUserId);
    setNewTicketOpen(false);
    setNewSubject('');
    setNewMessage('');
    showToast('تم إرسال تذكرتك بنجاح للإدارة! 💌', 'success');
    setActiveTicketId(created.id);
  };

  // تصفية التذاكر الخاصة بالعضو النشط، مع تنظيف التذاكر التوضيحية الافتراضية
  const userTickets = supportTickets.filter(
    t => (t.userId === activeUserId || t.userId === 'm2') && t.id !== 't1' && t.id !== 't2'
  );

  if (activeTicket) {
    const sc = statusConfig[activeTicket.status] || statusConfig.open;
    return (
      <div className="bg-[#FCFBF9] dark:bg-navy-950 min-h-[calc(100vh-5rem)] lg:min-h-screen" dir="rtl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => setActiveTicketId(null)}
            className="flex items-center gap-2 text-[#7B113A] dark:text-cream-200 hover:underline font-cairo font-bold text-sm mb-4 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" /> العودة لمحادثات وتذاكر الإدارة
          </button>

          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-soft border border-[#EAE3D9] dark:border-navy-800 overflow-hidden flex flex-col h-[75vh]">
            {/* Header */}
            <div className="flex items-center gap-3 p-3.5 sm:p-4 border-b border-[#F0EAE1] dark:border-navy-800 bg-[#FAF7F2]/60 dark:bg-navy-950/40">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-l from-[#680E30] to-[#7B113A] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-[#F3DB83]" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <h3 className="font-cairo font-bold text-neutral-900 dark:text-cream-50 truncate text-sm sm:text-base">{activeTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color} flex items-center gap-1`}>
                    <sc.icon className="w-3 h-3" /> {sc.label}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-slate-400 font-tajawal">{activeTicket.category}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-[#FCFBF9]/50 dark:bg-navy-950/20">
              {activeTicket.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="flex gap-2.5 max-w-[90%] sm:max-w-[85%]">
                    {msg.sender === 'admin' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7B113A] to-[#680E30] flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                        <Headphones className="w-4 h-4 text-[#F3DB83]" />
                      </div>
                    )}
                    <div>
                      <div className={`px-4 py-3 rounded-2xl whitespace-pre-line text-right ${
                        msg.sender === 'user'
                          ? 'bg-[#7B113A] text-white rounded-bl-md shadow-xs'
                          : 'bg-white dark:bg-navy-800 text-neutral-900 dark:text-cream-50 rounded-br-md shadow-sm border border-[#EAE3D9] dark:border-navy-700 font-semibold'
                      }`}>
                        <p className="font-cairo text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] mt-1 block text-neutral-400 dark:text-slate-400 px-1 text-right">
                        {msg.sender === 'admin' ? 'مستشار العلاقات والتنسيق الشرعي' : 'أنت'} · {msg.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-[#F0EAE1] dark:border-navy-800 flex items-center gap-2 bg-white dark:bg-navy-900">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك المباشرة للإدارة والوسيط الشرعي..."
                className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#FAF7F2] dark:bg-navy-950 border border-[#EAE3D9] dark:border-navy-800 focus:border-[#7B113A] focus:outline-none font-cairo text-neutral-900 dark:text-cream-50 text-xs sm:text-sm text-right"
              />
              <button
                onClick={sendMessage}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#7B113A] text-white flex items-center justify-center flex-shrink-0 shadow-md hover:bg-[#680E30] transition-colors cursor-pointer active:scale-95"
              >
                <Send className="w-5 h-5 -scale-x-100 text-[#F3DB83]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFBF9] min-h-screen pb-28 lg:pb-8" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 font-cairo">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-l from-[#680E30] via-[#7B113A] to-[#8B1D41] flex items-center justify-center shadow-md flex-shrink-0 border border-white/20">
              <Headphones className="w-6 h-6 text-[#F3DB83]" />
            </div>
            <div>
              <h1 className="font-cairo font-extrabold text-xl sm:text-2xl text-neutral-900">الدعم والتواصل المباشر مع الإدارة</h1>
              <p className="text-neutral-600 font-tajawal text-xs sm:text-sm text-right mt-0.5">تواصل خاص بين العضو وإدارة منصة تلاقي القطرية للزواج للاستفسارات والتنسيق بسرية تامة</p>
            </div>
          </div>
          <button
            onClick={() => setNewTicketOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7B113A] text-white font-cairo font-bold text-xs sm:text-sm shadow-md hover:bg-[#680E30] transition-all cursor-pointer self-start sm:self-auto w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 text-[#F3DB83]" /> فتح محادثة جديدة
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-gradient-to-l from-[#680E30] via-[#7B113A] to-[#8B1D41] rounded-2xl p-4 mb-6 relative overflow-hidden shadow-sm border border-[#D4AF37]/20">
          <div className="relative flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#F3DB83] flex-shrink-0" />
            <p className="text-white/95 font-cairo text-xs sm:text-sm text-right leading-relaxed">
              جميع المحادثات والاستفسارات هنا <span className="text-[#F3DB83] font-bold">مباشرة وخاصة كلياً بينك وبين فريق إدارة المنصة والوسيط الشرعي</span> بسرية وأمان.
            </p>
          </div>
        </div>

        {/* Support Conversations List */}
        <div className="space-y-3">
          {userTickets.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-navy-900 rounded-3xl border border-[#EAE3D9] dark:border-navy-800 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] dark:bg-navy-800 text-[#7B113A] dark:text-gold-400 flex items-center justify-center mx-auto mb-4 border border-[#EAE3D9] dark:border-navy-700">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-cairo font-extrabold text-base text-neutral-900 dark:text-cream-50 mb-1.5">
                لا توجد رسائل أو محادثات مع الإدارة حالياً
              </h3>
              <p className="font-cairo text-xs text-neutral-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                يمكنك التواصل المباشر مع فريق الدعم والوساطة الشرعية لطرح أي استفسار أو طلب مساعدة وسيقوم الفريق بالرد عليك فوراً بسرية تامة.
              </p>
              <button
                onClick={() => setNewTicketOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7B113A] text-white font-cairo font-bold text-xs sm:text-sm shadow-md hover:bg-[#680E30] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F3DB83]" /> بدء محادثة جديدة مع الإدارة
              </button>
            </div>
          ) : (
            userTickets.map((ticket) => {
              const sc = statusConfig[ticket.status] || statusConfig.open;
              const lastMsg = ticket.messages[ticket.messages.length - 1];
              return (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicketId(ticket.id)}
                  className="w-full flex items-start gap-3.5 p-4 bg-white dark:bg-navy-900 rounded-2xl shadow-xs border border-[#EAE3D9] dark:border-navy-800 text-right hover:shadow-md hover:border-[#7B113A]/40 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] dark:bg-navy-800 text-[#7B113A] dark:text-gold-300 flex items-center justify-center flex-shrink-0 border border-[#EAE3D9] dark:border-navy-700 group-hover:bg-[#7B113A] group-hover:text-white transition-colors">
                    <Support className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="font-cairo font-bold text-neutral-900 dark:text-cream-50 truncate text-sm sm:text-base">{ticket.subject}</h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${sc.color} flex items-center gap-1 flex-shrink-0`}>
                        <sc.icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-slate-400 font-cairo truncate text-right">
                      {lastMsg ? lastMsg.text : 'لا توجد رسائل بعد'}
                    </p>
                    <p className="text-[11px] text-neutral-400 dark:text-slate-500 font-cairo mt-1.5 text-right">
                      {ticket.category} · {ticket.updatedAt}
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-neutral-400 dark:text-slate-600 flex-shrink-0 mt-2 group-hover:-translate-x-1 transition-transform" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* New ticket modal */}
      <Modal open={newTicketOpen} onClose={() => setNewTicketOpen(false)} title="إرسال رسالة / تذكرة جديدة للإدارة">
        <div className="space-y-4 font-cairo text-right" dir="rtl">
          <div>
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-cream-100 mb-1.5">موضوع الرسالة</label>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="مثال: استفسار عن خطوة التوافق، طلب مساعدة..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] dark:bg-navy-950 border border-[#EAE3D9] dark:border-navy-800 focus:border-[#7B113A] focus:outline-none font-cairo text-neutral-900 dark:text-cream-50 text-xs sm:text-sm text-right"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-cream-100 mb-1.5">التصنيف</label>
            <div className="flex flex-wrap gap-1.5 justify-start">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newCategory === cat
                      ? 'bg-[#7B113A] text-white shadow-xs'
                      : 'bg-[#FAF7F2] dark:bg-navy-800 text-neutral-700 dark:text-cream-200 border border-[#EAE3D9] dark:border-navy-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-cream-100 mb-1.5">نص الرسالة</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              placeholder="اكتب استفسارك أو طلبك هنا بوضوح..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] dark:bg-navy-950 border border-[#EAE3D9] dark:border-navy-800 focus:border-[#7B113A] focus:outline-none font-cairo text-neutral-900 dark:text-cream-50 text-xs sm:text-sm text-right resize-none"
            />
          </div>
          <Button fullWidth size="lg" onClick={createTicket}>
            <Send className="w-4 h-4 -scale-x-100 text-[#F3DB83]" /> إرسال الرسالة للإدارة
          </Button>
        </div>
      </Modal>
    </div>
  );
}
