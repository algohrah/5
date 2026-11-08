import { FeaturedBadge } from './ui/Badge';
import { isFeatured } from '../../shared/membership.js';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, ShieldCheck, Crown, Bookmark, Eye,
  Briefcase, Calendar, Users, Heart, UserRound,
} from 'lucide-react';
import type { Member } from '../lib/members';
import { getAvatar, getGenderColors } from '../lib/types';
import { useApp } from '../lib/AppContext';
import { formatMaritalStatus } from '../lib/memberUtils';
import MemberProfileModal from './MemberProfileModal';
import './MemberCard.css';

export default function MemberCard({ member }: { member: Member; key?: any }) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { user, likedMembers, toggleLike, showToast } = useApp();
  const liked = user?.isLoggedIn ? likedMembers.has(member.id) : false;
  const safeGender = (member.gender === 'male' || member.gender === 'female' ? member.gender : 'female') as any;
  const avatar = getAvatar(safeGender);
  const c = getGenderColors(safeGender);
  const isMale = member.gender === 'male';
  // عند غياب الاسم المستعار (شائع في الأعضاء المستوردين) نعرض وصفاً لائقاً بدل معرّف العضو
  const genderWord = member.gender === 'male' ? 'عضو' : member.gender === 'female' ? 'عضوة' : 'عضو';
  const composedName = [genderWord, (member as any).city ? `من ${(member as any).city}` : '', member.age ? `(${member.age})` : '']
    .filter(Boolean).join(' ');
  const displayName = member.nickname || member.realName || composedName || genderWord;

  const maritalFormatted = formatMaritalStatus(member.maritalStatus, member.maritalLabel, member.gender);

  // ملاحظات ومواصفات الشريك الكتابية (كما كانت)
  const partnerNotes = useMemo(() => {
    const details = (member as any)?.details && typeof (member as any).details === 'object' ? (member as any).details : {};
    const text = member.aboutPartner || member.partnerRequirements || member.idealPartner || details.aboutPartner || (member as any).pNotes || (member as any).p_notes || details.pNotes || '';
    return typeof text === 'string' ? text.trim() : '';
  }, [member]);

  const isImported = member.sourceType === 'imported' || Boolean((member as any).importBatchId) || Boolean((member as any).importOfficeName) || Boolean((member as any).khataabaName) || Boolean((member as any).khataabaPhone) || Boolean((member as any).khataaba_phone);

  const marriageTypeRaw = ((member as any).marriageType || (member as any).marriage_type || member.marriageTypeLabel || '').toString().toLowerCase();
  const isBothMarriage = ['both', 'معلن أو مسيار', 'معلن او مسيار', 'لا مانع', 'الاثنين', 'كلاهما', 'معلن ومسيار'].some(k => marriageTypeRaw.includes(k));
  const isMisyarCard = !isBothMarriage && (marriageTypeRaw.includes('misyar') || marriageTypeRaw.includes('مسيار'));
  const isAnnouncedCard = !isBothMarriage && (marriageTypeRaw.includes('announced') || marriageTypeRaw.includes('معلن'));

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className={`member-card group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-luxe transition-shadow duration-500 border border-cream-200/70 flex flex-col h-full cursor-pointer`}
        onClick={handleOpenModal}
      >
        <div className="block flex flex-col flex-1 no-tap-highlight select-none">
          {/* ===== الرأس المرتّب والمدمج: الصورة + الاسم + الشارات ===== */}
          <div className={`relative ${c.bg} px-2.5 py-2 sm:px-3 sm:py-2.5 border-b border-cream-200/40`}>
            <div className="flex items-center gap-2">
              {/* الصورة الرمزية بشكل مدمج وأنيق */}
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden ring-2 ${c.ring} ring-opacity-40 shadow-xs`}>
                  {avatarFailed ? (
                    <UserRound aria-hidden="true" className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
                  ) : (
                    <img src={avatar} alt="" onError={() => setAvatarFailed(true)} className="w-full h-full object-contain p-1" />
                  )}
                </div>
              </div>

              {/* الاسم والشارات في تخطيط مدمج لا يشغل مساحة */}
              <div className="flex-1 min-w-0 pr-0.5 flex flex-col justify-center">
                <h3 className="member-card-title text-navy-900" title={displayName}>
                  {displayName}
                </h3>

                {/* صف الشارات المرتّب بحجم صغير وواضح */}
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {/* شارة الجنس */}
                  <span className={`member-card-gender ${isMale ? 'member-card-gender-male' : 'member-card-gender-female'} inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white text-[8.5px] sm:text-[9px] font-cairo font-bold leading-none`}>
                    <GenderIcon isMale={isMale} white />
                    <span>{isMale ? 'رجل' : 'امرأة'}</span>
                  </span>

                  {/* شارة التميز بنجمة واسم "مميز" */}
                  {isFeatured(member) && <FeaturedBadge size="sm" />}

                  {/* شارة التوثيق */}
                  {member.verified && (
                    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-cairo font-bold leading-none" title="موثّق">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      <span>موثّق</span>
                    </span>
                  )}


                  {/* نوع الزواج إذا كان مسيار أو معلن */}
                  {isMisyarCard && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-cairo font-bold bg-amber-50 text-amber-800 border border-amber-200/80 leading-none" title="نوع الزواج: مسيار">
                      مسيار
                    </span>
                  )}
                  {isAnnouncedCard && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-cairo font-bold bg-rose-50 text-rose-800 border border-rose-200/80 leading-none" title="نوع الزواج: معلن">
                      معلن
                    </span>
                  )}
                  {isBothMarriage && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-cairo font-bold bg-purple-50 text-purple-800 border border-purple-200/80 leading-none" title="نوع الزواج: معلن أو مسيار">
                      معلن/مسيار
                    </span>
                  )}

                  {/* ملف مرفوع من الإدارة */}
                  {isImported && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.5 rounded text-[8px] sm:text-[8.5px] font-cairo font-bold leading-none" title="ملف مرفوع من قبل الإدارة">
                      إدارة
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* ===== جسم البطاقة ===== */}
          <div className="p-2.5 sm:p-4 flex flex-col flex-1">
            {/* الموقع */}
            <div className="flex items-center gap-1.5 bg-cream-50 rounded-lg px-2 py-1.5 sm:px-2.5 sm:py-2 border border-cream-200/60 mb-2 sm:mb-2.5">
              <MapPin className={`w-3.5 h-3.5 ${c.text} flex-shrink-0`} />
              <span className="font-tajawal text-xs sm:text-sm text-navy-700 truncate">
                {[member.city, member.country].filter(Boolean).join('، ') || 'الموقع غير محدد'}
              </span>
            </div>

            {/* شبكة المعلومات: العمر + الحالة + الوظيفة */}
            <div className={`grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-2.5`}>
              {[
                { icon: Calendar, label: 'العمر', value: member.age ? `${member.age} سنة` : '—', sub: '' },
                { icon: Users, label: 'الحالة', value: maritalFormatted, sub: '' },
                { icon: Briefcase, label: 'العمل', value: member.jobTitle || member.workType || '—', sub: '' },
              ].map((item) => (
                <div key={`mc-info-${member?.id || 'm'}-${item.label}`} className="bg-cream-50 rounded-lg p-1 sm:p-2 text-center border border-cream-200/60 h-full flex flex-col justify-between">
                  <div>
                    <item.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${c.text} mx-auto mb-0.5 sm:mb-1 flex-shrink-0`} />
                    <div className="text-[9px] sm:text-[11px] font-cairo font-extrabold text-navy-900 leading-[1.1] break-words whitespace-normal line-clamp-2 px-0.5" title={item.value}>
                      {item.value}
                    </div>
                  </div>
                  <div className={`text-[8px] sm:text-[9px] text-navy-400 font-tajawal break-words whitespace-normal line-clamp-1 mt-1`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* قسم "أبحث عن" (الملاحظات الكتابية كما كانت) */}
            <div className={`rounded-lg sm:rounded-xl ${c.bg} p-2 mb-2 sm:p-2.5 sm:mb-2.5`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className={`w-3.5 h-3.5 ${c.text}`} />
                <span className={`text-[11px] font-cairo font-bold ${c.textStrong} whitespace-nowrap`}>أبحث عن</span>
              </div>

              {/* الملاحظات الكتابية لمواصفات الشريك كما كانت */}
              {partnerNotes ? (
                <p className="text-[11px] sm:text-[12px] text-navy-600 font-tajawal leading-snug line-clamp-2">
                  {partnerNotes}
                </p>
              ) : (
                <p className="text-[11px] text-navy-400 font-tajawal italic">لم تُضف مواصفات الشريك بعد</p>
              )}
            </div>

            {/* الأزرار — زر الحفظ أيقونة فقط + زر العرض موسّع */}
            <div className={`mt-auto flex items-center gap-2`}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user?.isLoggedIn) {
                    showToast('يرجى تسجيل الدخول لإضافة الأعضاء إلى المفضلة', 'info');
                    navigate('/login');
                    return;
                  }
                  toggleLike(member.id);
                }}
                aria-label="حفظ الملف"
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-300 no-tap-highlight flex-shrink-0 ${
                  liked ? 'bg-gold-500 text-white shadow-soft' : 'bg-cream-100 text-navy-500 hover:bg-cream-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${liked ? 'fill-white' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleOpenModal}
                className={`member-card-view flex-1 h-10 sm:h-12 flex items-center justify-center gap-2 rounded-xl ${c.bgStrong} text-white font-cairo font-bold text-xs sm:text-sm transition-all hover:brightness-110 shadow-sm cursor-pointer`}
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                عرض الملف
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* القائمة المنبثقة الشاملة للملف الشخصي */}
      <MemberProfileModal
        member={member}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

/* أيقونة جنس مخصصة */
function GenderIcon({ isMale, white }: { isMale: boolean; white?: boolean }) {
  const color = white ? 'white' : 'currentColor';
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      {isMale ? (
        <>
          <circle cx="10" cy="14" r="5" stroke={color} strokeWidth="2.4" />
          <path d="M19 5l-5.4 5.4M14 5h5v5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="12" cy="9" r="5" stroke={color} strokeWidth="2.4" />
          <path d="M12 14v6M9.5 17.5h5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
