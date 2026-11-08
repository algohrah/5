import { Link } from 'react-router-dom';
import { isFeatured, compareMemberPriority } from '../../shared/membership.js';
import { calculateCompatibility } from '../lib/compatibility';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../lib/AppContext';
import {
  Search as SearchIcon, SlidersHorizontal, MapPin, Calendar,
  Briefcase, GraduationCap, Users, ChevronDown, ChevronUp,
  Globe, BookOpen, Heart, ShieldCheck, Baby, Building2,
  Crown, Star, Pencil, Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  ARAB_COUNTRIES, ARAB_CITIES, EDUCATION_LEVELS, JOB_TITLES,
  SECTS, CHILDREN_COUNTS, getMaritalOptions,
} from '../lib/types';
import { CITIES_BY_COUNTRY, NATIONALITIES, WORK_TYPES } from '../lib/constants';
import MemberCard from '../components/MemberCard';
import { MemberGridSkeleton } from '../components/ui/MemberCardSkeleton';
import { dataService } from '../lib/data/DataService';
import { getMemberTimestamp } from '../lib/memberUtils';

type GenderFilter = 'male' | 'female' | 'all';

const PAGE_SIZE = 16;

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkLimit, incrementUsage, showToast, members, membersLoading, membersError, retryLoadMembers, blockedMembers, user, profileData } = useApp();
  const currentUser = members.find(member => String(member.id) === String(user.memberId));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const featuredAccess = user.isLoggedIn && isFeatured({ plan: user.profile.plan });
  const [upgradePrompt, setUpgradePrompt] = useState(false);
  // إدارة الفلاتر المجانية: تظهر تلقائياً كلمحة استكشافية عند الدخول ثم تُطوى وتظهر شارة "انقر للتعديل"
  const [showBasicFilters, setShowBasicFilters] = useState(true);
  const [peekHintActive, setPeekHintActive] = useState(true);
  const userInteractedRef = React.useRef(false);
  const peekTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFilterInteraction = React.useCallback(() => {
    userInteractedRef.current = true;
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }
    setPeekHintActive(false);
  }, []);

  const toggleBasicFilters = () => {
    onFilterInteraction();
    setShowBasicFilters(prev => !prev);
  };

  const requireFeatured = (customMsg?: string) => {
    setUpgradePrompt(true);
    showToast(customMsg || 'البحث المتقدم وفلترة نوع الزواج (مسيار / معلن) مخصصة للباقة المميزة فقط', 'info');
  };

  useEffect(() => {
    if (!featuredAccess) {
      setMarriageType('');
      setNationality('');
      setEducation('');
      setJob('');
      setMaritalStatus('');
      setSect('');
      setHasChildren('');
      setChildrenCount('');
      setAcceptForeigner('');
    }
  }, [featuredAccess]);

  const pageTopRef = React.useRef<HTMLDivElement>(null);
  const ensureTopVisible = React.useCallback(() => {
    try {
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      html.scrollTop = 0;
      document.body.scrollTop = 0;

      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        document.body.scrollTop = 0;
      });

      setTimeout(() => {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        document.body.scrollTop = 0;
        html.style.scrollBehavior = prevBehavior;
      }, 60);

      setTimeout(() => {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 320);
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  // عند الدخول إلى الصفحة: التثبيت في بداية ورأس الصفحة مباشرة
  useEffect(() => {
    ensureTopVisible();
  }, [ensureTopVisible]);

  // ===== الفلاتر الأساسية (مع دعم التهيئة من معايير الرابط) =====
  const paramGender = searchParams.get('gender') as GenderFilter | null;
  const paramCountry = searchParams.get('country') || '';
  const paramCity = searchParams.get('city') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [gender, setGender] = useState<GenderFilter>(
    paramGender === 'male' || paramGender === 'female' || paramGender === 'all' ? paramGender : 'all'
  );
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 80]);
  const [country, setCountry] = useState(paramCountry || 'قطر');
  const [city, setCity] = useState(paramCity);

  // ===== الفلاتر المتقدمة (مخصصة للباقة المميزة فقط) =====
  const paramType = searchParams.get('type') || '';
  const initialMarriageType = (paramType === 'معلن' || paramType === 'announced')
    ? 'announced'
    : (paramType === 'مسيار' || paramType === 'misyar')
      ? 'misyar'
      : '';

  const [marriageType, setMarriageType] = useState<'' | 'announced' | 'misyar'>(
    featuredAccess ? initialMarriageType : ''
  );
  const [showAdvanced, setShowAdvanced] = useState(Boolean(featuredAccess && initialMarriageType));
  const [advancedPeekHintActive, setAdvancedPeekHintActive] = useState(Boolean(featuredAccess && initialMarriageType));
  const userInteractedAdvancedRef = React.useRef(false);
  const advancedPeekTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [acceptForeigner, setAcceptForeigner] = useState<'' | 'yes' | 'no'>('');
  const [nationality, setNationality] = useState('');
  const [education, setEducation] = useState('');
  const [job, setJob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [sect, setSect] = useState('');
  const [hasChildren, setHasChildren] = useState('');
  const [childrenCount, setChildrenCount] = useState('');

  const onAdvancedFilterInteraction = React.useCallback(() => {
    userInteractedAdvancedRef.current = true;
    if (advancedPeekTimerRef.current) {
      clearTimeout(advancedPeekTimerRef.current);
      advancedPeekTimerRef.current = null;
    }
    setAdvancedPeekHintActive(false);
  }, []);

  const toggleAdvancedFilters = () => {
    onAdvancedFilterInteraction();
    if (!featuredAccess) {
      setShowAdvanced(prev => {
        const next = !prev;
        if (next) {
          setUpgradePrompt(true);
          showToast('البحث المتقدم وفلترة زواج المسيار أو المعلن مخصصة لأصحاب الباقة المميزة فقط', 'info');
        }
        return next;
      });
      return;
    }
    setShowAdvanced(prev => !prev);
  };

  // عند الدخول أو تغيّر معايير الرابط:
  // 1) إذا كان مسيار/معلن: لأصحاب الباقة المميزة فقط. إذا كان مجانياً يظهر له تنبيه الترقية فوراً
  // 2) إذا اختار قسماً عاماً أو رجال/نساء: تظهر خيارات البحث المجانية كلمحة استكشافية ثم تُطوى
  useEffect(() => {
    const urlType = searchParams.get('type');
    const isMarriageType = urlType === 'معلن' || urlType === 'announced' || urlType === 'مسيار' || urlType === 'misyar';

    if (isMarriageType) {
      if (!featuredAccess) {
        // فلتر نوع الزواج (مسيار أو معلن) مخصص للباقة المميزة فقط
        setMarriageType('');
        setShowAdvanced(true);
        setUpgradePrompt(true);
        setShowBasicFilters(false);
        showToast('فلترة زواج المسيار أو المعلن ميزة حصرية لأعضاء الباقة المميزة فقط', 'info');
        return;
      }

      // لأعضاء الباقة المميزة: إظهار خيارات البحث المتقدم (المسيار / المعلن) كلمحة استكشافية ثم طيّها
      setShowAdvanced(true);
      setAdvancedPeekHintActive(true);
      userInteractedAdvancedRef.current = false;
      setShowBasicFilters(false); // طي الفلاتر الأساسية لتركيز انتباهه على نوع الزواج المطلوب

      if (advancedPeekTimerRef.current) {
        clearTimeout(advancedPeekTimerRef.current);
      }

      advancedPeekTimerRef.current = setTimeout(() => {
        if (!userInteractedAdvancedRef.current) {
          setShowAdvanced(false);
          setAdvancedPeekHintActive(false);
        }
      }, 2800);
    } else {
      // إظهار الفلاتر المجانية كلمحة استكشافية ثم طيّها في بداية الصفحة
      setShowBasicFilters(true);
      setPeekHintActive(true);
      userInteractedRef.current = false;
      ensureTopVisible();

      if (peekTimerRef.current) {
        clearTimeout(peekTimerRef.current);
      }

      peekTimerRef.current = setTimeout(() => {
        if (!userInteractedRef.current) {
          setShowBasicFilters(false);
          setPeekHintActive(false);
          // تأكيد بقاء وظهور رأس وبداية الصفحة بالكامل عند إغلاق الفلاتر
          ensureTopVisible();
          setTimeout(ensureTopVisible, 80);
          setTimeout(ensureTopVisible, 320);
        }
      }, 2800);
    }

    return () => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      if (advancedPeekTimerRef.current) clearTimeout(advancedPeekTimerRef.current);
    };
  }, [searchParams, featuredAccess, showToast]);

  // تحديث القيم عند تغيّر معايير الرابط
  useEffect(() => {
    const urlGender = searchParams.get('gender') as GenderFilter | null;
    const urlCountry = searchParams.get('country');
    const urlCity = searchParams.get('city');
    const urlType = searchParams.get('type');

    if (urlGender && (urlGender === 'male' || urlGender === 'female' || urlGender === 'all')) {
      setGender(urlGender);
    }
    if (urlCountry !== null) {
      setCountry(urlCountry || 'قطر');
    }
    if (urlCity !== null) {
      setCity(urlCity);
    }
    if (urlType === 'معلن' || urlType === 'announced') {
      setMarriageType('announced');
    } else if (urlType === 'مسيار' || urlType === 'misyar') {
      setMarriageType('misyar');
    } else if (urlType === 'all' || urlType === 'الجميع' || urlType === '') {
      setMarriageType('');
    }
  }, [searchParams]);

  // نضمن تحميل قوائم الجغرافيا الرسمية من قاعدة البيانات (نفس مصدر التسجيل)
  React.useEffect(() => { dataService.db.ensureGeoLoaded?.().catch(() => undefined); }, []);

  // الدول والمدن والجنسيات من قاعدة البيانات الموحّدة (مع وضع دولة قطر في البداية)
  const countryOptions = React.useMemo(() => {
    const db = dataService.db.getCountryNames?.() || [];
    const base = db.length ? db : ARAB_COUNTRIES;
    const filtered = base.filter((c: string) => c !== 'قطر');
    return ['قطر', ...filtered];
  }, []);
  const OTHER_CITY_OPTION = 'أخرى (مدن أخرى)';

  const cityOptions = React.useMemo(() => {
    if (!country) return [];
    const db = dataService.db.getCities?.(country) || [];
    const mainCities = db.length ? db : (CITIES_BY_COUNTRY[country] || []);
    // نضمن إدراج خيار "أخرى (مدن أخرى)" في نهاية خيارات المدينة للدولة المحددة
    const uniqueCities = Array.from(new Set(mainCities));
    return [...uniqueCities, OTHER_CITY_OPTION];
  }, [country]);
  const nationalityOptions = React.useMemo(() => {
    const db = dataService.db.getNationalities?.() || [];
    const base = db.length ? db : NATIONALITIES;
    const filtered = base.filter((c: string) => c !== 'قطر');
    return ['قطر', ...filtered];
  }, []);

  // خيارات الحالة الاجتماعية حسب الجنس المختار
  const maritalOptions = gender === 'all' ? [] : getMaritalOptions(gender);

  // عند تغيير الجنس: نعيد ضبط الحالة الاجتماعية لأن الخيارات تختلف
  const handleGenderChange = (g: GenderFilter) => {
    onFilterInteraction();
    setGender(g);
    setMaritalStatus(''); // إعادة ضبط الحالة الاجتماعية
    setHasChildren('');
    setChildrenCount('');
  };

  // عند اختيار "مطلق/مطلقة" نظهر خيارات الأبناء
  const showChildrenOptions = ['divorced', 'widower', 'widow', 'widowed', 'مطلق', 'مطلقة', 'أرمل', 'أرملة'].includes(maritalStatus);

  // Live filtering (replaces separate results page - Red Priority #2)
  const filteredMembers = React.useMemo(() => {
    const seen = new Set<string>();
    return members.filter((m, idx) => {
      if (!m) return false;
      if (m.status && m.status !== 'active') return false;
      // إخفاء الأعضاء المحظورين شخصياً من نتائج البحث
      if (blockedMembers.has(m.id)) return false;
      // لا نخفي المستوردين بسبب نقص الجنس/العمر؛ يكفي وجود اسم أو رمز عضو.
      if (!m.nickname && !m.realName && !m.id) return false;
      const key = m.id || `idx-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);

    // البحث بالكلمة المفتاحية / الرمز / كود العضو — خاص بأصحاب الباقات
    if (featuredAccess && searchQuery.trim()) {
      const rawQ = searchQuery.trim().toLowerCase();
      const cleanQ = rawQ.replace('#', '').replace('tw-', '').replace('imp-', '').trim();
      const rawId = (m.id || '').toLowerCase();
      const cleanId = rawId.replace('#', '').replace('tw-', '').replace('imp-', '').trim();

      const matchId = rawId.includes(rawQ) || (cleanQ.length > 0 && cleanId.includes(cleanQ));
      const matchNick = (m.nickname || '').toLowerCase().includes(rawQ);
      const matchDisplay = ((m as any).displayName || '').toLowerCase().includes(rawQ);
      const matchUser = (m.username || '').toLowerCase().includes(rawQ);
      const matchJob = (m.jobTitle || '').toLowerCase().includes(rawQ);
      const matchTribe = (m.tribe || '').toLowerCase().includes(rawQ);
      const matchBio = (m.bio || '').toLowerCase().includes(rawQ);
      if (!matchId && !matchNick && !matchDisplay && !matchUser && !matchJob && !matchTribe && !matchBio) {
        return false;
      }
    }

    if (gender !== 'all' && m.gender !== gender) return false;
    if (m.age && (m.age < ageRange[0] || m.age > ageRange[1])) return false;
    if (country && m.country !== country) return false;
    if (city) {
      if (city === OTHER_CITY_OPTION || city === 'أخرى' || city.startsWith('أخرى')) {
        // عند اختيار "أخرى (مدن أخرى)"، يُطابق الأعضاء الذين مدينتهم ليست ضمن القائمة الرئيسية لتلك الدولة
        const targetCountry = m.country || country;
        const db = dataService.db.getCities?.(targetCountry) || [];
        const mainCities = db.length ? db : (CITIES_BY_COUNTRY[targetCountry] || []);
        const normMCity = (m.city || '').trim().toLowerCase();
        const isMain = mainCities.some((c) => c.trim().toLowerCase() === normMCity);
        if (isMain) return false;
      } else {
        if (m.city !== city) return false;
      }
    }

    // تصفية الجنسية (مطابقة مرنة تشمل الدولة والمسمى الوظيفي والنسبة)
    if (featuredAccess && nationality) {
      const normFilter = nationality.replace('/ة', '').replace('ة', '').replace('ال', '').trim().toLowerCase();
      const normNat = (m.nationality || '').replace('/ة', '').replace('ة', '').replace('ال', '').trim().toLowerCase();
      const normCountry = (m.country || '').replace('ال', '').trim().toLowerCase();

      const isNatMatch = m.nationality === nationality || 
                         normNat === normFilter || 
                         (normNat.length > 2 && normFilter.length > 2 && (normNat.includes(normFilter) || normFilter.includes(normNat))) ||
                         (normCountry.length > 2 && normFilter.length > 2 && (normCountry === normFilter || normCountry.includes(normFilter)));

      if (!isNatMatch) return false;
    }

    if (featuredAccess && education && m.education !== education) return false;
    
    if (featuredAccess && job) {
      const j = job.trim().toLowerCase();
      const wType = (m.workType || '').toLowerCase();
      const jTitle = (m.jobTitle || '').toLowerCase();
      const isOtherMatch = (j === 'أخرى' || j === 'اخرى') && (wType === 'أخرى' || wType === 'اخرى' || (!['حكومي', 'قطاع خاص', 'عمل حر', 'باحث عن عمل', 'طالب', 'بدون عمل'].includes(wType) && wType !== ''));
      const matchesWork = wType.includes(j) || isOtherMatch || (j === 'عمل حر' && (wType.includes('حر') || wType.includes('أعمال حرة'))) || (j === 'أعمال حرة' && (wType.includes('حر') || wType.includes('عمل')));
      const matchesTitle = jTitle.includes(j);
      if (!matchesWork && !matchesTitle) return false;
    }

    if (featuredAccess && maritalStatus) {
      const mStatus = m.maritalStatus || '';
      const mLabel = m.maritalLabel || '';
      const isWidowMatch = (maritalStatus === 'widower' || maritalStatus === 'widow') && (mStatus === 'widower' || mStatus === 'widow');
      if (mStatus !== maritalStatus && !isWidowMatch && !mLabel.includes(maritalStatus)) {
        return false;
      }
    }

    // تصفية المذهب (مطابقة مرنة مثل سني / مسلم سني / سلفي)
    if (featuredAccess && sect) {
      const normFilter = sect.replace('مسلم ', '').trim();
      const normSect = (m.sect || '').replace('مسلم ', '').trim();

      const isSectMatch = m.sect === sect || 
                         normSect === normFilter || 
                         normSect.includes(normFilter) || 
                         normFilter.includes(normSect);

      if (!isSectMatch) return false;
    }
    if (featuredAccess && hasChildren && ((hasChildren === 'true' && !m.hasChildren) || (hasChildren === 'false' && m.hasChildren))) return false;
    if (featuredAccess && childrenCount && m.childrenCount !== childrenCount) return false;

    // تصفية نوع الزواج (معلن / مسيار) — حصري لأعضاء الباقة المميزة فقط
    if (featuredAccess && marriageType) {
      const mTypeRaw = ((m as any).marriageType || (m as any).marriage_type || (m as any).marriageTypeLabel || '').toString().toLowerCase().trim();
      const isBoth = ['both', 'معلن أو مسيار', 'معلن او مسيار', 'لا مانع', 'الاثنين', 'كلاهما', 'معلن ومسيار'].some(k => mTypeRaw.includes(k));
      if (marriageType === 'announced') {
        const isAnnounced = isBoth || ['announced', 'معلن', 'عادي', 'طبيعي'].some(k => mTypeRaw.includes(k)) || !mTypeRaw;
        if (!isAnnounced) return false;
      } else if (marriageType === 'misyar') {
        const isMisyar = isBoth || ['misyar', 'مسيار'].some(k => mTypeRaw.includes(k));
        if (!isMisyar) return false;
      }
    }

    // تصفية قبول غير المواطن / الأجنبي
    if (featuredAccess && acceptForeigner) {
      const mAccRaw = ((m as any).acceptForeigner || (m as any).accept_foreigner || (m as any).pNationality || '').toString().toLowerCase().trim();
      const accepts = ['نعم', 'yes', 'true', 'لا مانع', 'اقبل اجنبي', 'أقبل أجنبي', 'أية جنسية', 'اي جنسية'].some(k => mAccRaw.includes(k));
      if (acceptForeigner === 'yes' && !accepts) return false;
      if (acceptForeigner === 'no' && accepts) return false;
    }

    return true;
  }).sort((a, b) => {
    const scoreFor = (member: any) => currentUser && profileData
      ? calculateCompatibility(currentUser, member, profileData).score : 0;
    const priority = compareMemberPriority(a, b, scoreFor(a), scoreFor(b));
    if (priority) return priority;

    // Secondary: Sort by latest creation/registration date (newest first)
    const timeA = getMemberTimestamp(a);
    const timeB = getMemberTimestamp(b);
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    // Tertiary: fallback comparison
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    if (numA !== numB) {
      return numB - numA;
    }

    return (b.id || '').localeCompare(a.id || '');
  });
  }, [featuredAccess, currentUser, profileData, members, blockedMembers, searchQuery, gender, ageRange, country, city, nationality, education, job, maritalStatus, sect, hasChildren, childrenCount, marriageType, acceptForeigner]);

  // إعادة الترقيم للصفحة الأولى عند تغيير أي فلتر لتجنّب صفحة فارغة
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, gender, ageRange[0], ageRange[1], country, city, nationality, education, job, maritalStatus, sect, hasChildren, childrenCount, marriageType, acceptForeigner]);

  const visibleMembers = filteredMembers.slice(0, visibleCount);
  const hasMore = filteredMembers.length > visibleMembers.length;

  const handleSearch = () => {
    // Live results already shown below - no navigation needed
    showToast('تم تحديث النتائج فوراً حسب الفلاتر', 'success');
    incrementUsage('search');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setGender('all');
    setAgeRange([18, 80]);
    setCountry('قطر');
    setCity('');
    setMarriageType('');
    setAcceptForeigner('');
    setNationality('');
    setEducation('');
    setJob('');
    setMaritalStatus('');
    setSect('');
    setHasChildren('');
    setChildrenCount('');
    setShowAdvanced(false);
    setUpgradePrompt(false);
  };

  const basicFilterCount = [
    gender !== 'all' ? gender : '',
    ageRange[0] !== 18 || ageRange[1] !== 80 ? 'age' : '',
    country,
    city,
  ].filter(Boolean).length;

  const advancedFilterCount = featuredAccess ? [
    searchQuery.trim() ? searchQuery : '',
    marriageType,
    acceptForeigner,
    nationality,
    education,
    job,
    maritalStatus,
    sect,
    hasChildren,
    childrenCount,
  ].filter(Boolean).length : 0;

  const activeFilterCount = basicFilterCount + advancedFilterCount;

  return (
    <div className="bg-[#FCFBF9] min-h-screen pb-8 sm:pb-12" style={{ overflowAnchor: 'none' }}>
      <div ref={pageTopRef} id="search-page-top" className="absolute top-0 left-0 w-full h-px pointer-events-none" />
      {/* Header banner مدمج وأنيق مع أيقونة الفلتر في بداية العنوان */}
      <div className="bg-gradient-to-l from-[#680E30] via-[#7B113A] to-[#8B1D41] relative overflow-hidden border-b border-[#D4AF37]/20 shadow-md">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center">
          <div>
            <h1 className="inline-flex items-center justify-center gap-2 font-cairo font-extrabold text-lg sm:text-2xl text-white">
              <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-[#F3DB83] flex-shrink-0" />
              <span>البحث المتقدم والتوافق</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/80 font-tajawal">خصّص بحثك بدقة وشفافية للعثور على شريك الحياة المناسب</p>
          </div>
        </div>
      </div>

      {/* المربع العلوي تحت الهيدر - مصغر ومصمم بشكل مدمج وسهل للزوار */}
      <div className="max-w-3xl mx-auto px-2.5 min-[390px]:px-3 sm:px-6 -mt-2.5 sm:-mt-5 relative z-10" style={{ overflowAnchor: 'none' }}>
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#EAE3D9] p-3 sm:p-5 space-y-2.5 sm:space-y-3.5">
          {/* ===== 1) زر مزيد من الخيارات: يشمل (الجنس، الدولة، المدينة، العمر) مع ميزة لمحة البداية وانقر للتعديل ===== */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={toggleBasicFilters}
              aria-expanded={showBasicFilters}
              className={`w-full min-h-11 sm:min-h-12 flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-2xs border ${
                !showBasicFilters
                  ? 'bg-gradient-to-r from-[#F7EFE6] via-[#FAF3EC] to-[#F7EFE6] hover:bg-[#EFE6DA] border-[#D4AF37]/60 ring-2 ring-[#7B113A]/10 shadow-xs'
                  : 'bg-[#F7EFE6] hover:bg-[#EFE6DA] border-[#EAE3D9]'
              } text-neutral-900 font-cairo font-bold`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm min-w-0 flex-wrap">
                <SlidersHorizontal className="w-4 h-4 text-[#7B113A] flex-shrink-0" />
                <span className="font-bold text-neutral-900">خيارات البحث المجانية</span>
                <span className="text-neutral-500 text-[11px] sm:text-xs font-normal hidden min-[420px]:inline">
                  (الجنس، الدولة، المدينة، العمر)
                </span>

                {/* شارة توضيحية ذكية: "انقر للتعديل" تظهر عند طي الفلاتر ليعرف المستخدم أين يضغط */}
                {!showBasicFilters && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-2.5 py-0.5 rounded-full bg-[#7B113A] text-white shadow-xs animate-pulse">
                    <Pencil className="w-3 h-3" />
                    <span>انقر للتعديل</span>
                  </span>
                )}

                {basicFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#7B113A]/15 text-[#7B113A] text-[10px] font-bold border border-[#7B113A]/30">
                    {basicFilterCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-neutral-600 flex-shrink-0">
                <span className="text-[11px] font-tajawal text-neutral-500 hidden sm:inline">
                  {showBasicFilters ? 'طي الخيارات' : 'تعديل الفلاتر'}
                </span>
                {showBasicFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* ملخص الفلاتر المطبقة عند الطي مع خيار سريع "انقر للتعديل" */}
            {!showBasicFilters && (gender !== 'all' || country || city || ageRange[0] !== 18 || ageRange[1] !== 80) && (
              <div className="flex items-center gap-1.5 flex-wrap px-1 pt-0.5 text-xs font-tajawal text-neutral-600">
                <span className="text-[11px] text-neutral-500 font-bold">الفلاتر المطبقة:</span>
                {gender !== 'all' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {gender === 'male' ? 'رجال' : 'نساء'}
                  </span>
                )}
                {country && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <MapPin className="w-3 h-3" /> {country}
                  </span>
                )}
                {city && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {city}
                  </span>
                )}
                {(ageRange[0] !== 18 || ageRange[1] !== 80) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    العمر: {ageRange[0]} - {ageRange[1]} سنة
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onFilterInteraction();
                    setShowBasicFilters(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#7B113A] font-bold underline hover:text-[#500A25] cursor-pointer mr-auto"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  انقر للتعديل
                </button>
              </div>
            )}
          </div>

          {/* محتوى خيارات البحث الأساسية عند الفتح */}
          <AnimatePresence>
            {showBasicFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                onAnimationComplete={() => {
                  if (!showBasicFilters && !userInteractedRef.current) {
                    ensureTopVisible();
                  }
                }}
                className="overflow-hidden"
                onPointerDown={onFilterInteraction}
                onClick={onFilterInteraction}
              >
                {/* شريط لمحة استكشافية يوضح للمستخدم وجود الفلاتر مع زر لتثبيتها */}
                {peekHintActive && (
                  <div className="flex items-center justify-between gap-2 p-2.5 px-3 mb-2 rounded-xl bg-gradient-to-l from-amber-50 to-orange-50/60 border border-amber-200 text-amber-900 text-xs font-tajawal shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <span>
                        <strong>فلاتر البحث المجانية:</strong> يمكنك تحديد خياراتك، وسيتم طيها تلقائياً لتصفح النتائج ويمكنك النقر على <strong>«انقر للتعديل»</strong> في أي وقت.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onFilterInteraction}
                      className="text-[11px] font-bold text-[#7B113A] hover:underline whitespace-nowrap cursor-pointer px-2 py-1 bg-white/90 rounded-lg border border-amber-200/80 shadow-2xs"
                    >
                      إبقاء الفلاتر مفتوحة
                    </button>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4 pt-1 pb-1">
                  {/* الخطوة 1: الجنس */}
                  <FilterSection icon={Users} title="أبحث عن" step={1}>
                    <div className="grid grid-cols-3 gap-2">
                      <GenderButton
                        active={gender === 'female'} onClick={() => handleGenderChange('female')}
                        label="زوجة" color="rose"
                      />
                      <GenderButton
                        active={gender === 'male'} onClick={() => handleGenderChange('male')}
                        label="زوج" color="blue"
                      />
                      <GenderButton
                        active={gender === 'all'} onClick={() => handleGenderChange('all')}
                        label="الجميع" color="gold"
                      />
                    </div>
                  </FilterSection>

                  {/* الخطوة 2: الدولة والمدينة */}
                  <FilterSection icon={MapPin} title="الدولة والمدينة" step={2}>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-navy-800">
                            <Globe className="w-3.5 h-3.5 text-gold-600" /> الدولة
                          </label>
                          <span className="text-[11px] text-[#A16207] bg-[#FEF8EC] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#F5EFE7]">
                            <Lock className="w-2.5 h-2.5 text-[#A16207]" /> مقفلة
                          </span>
                        </div>
                        <div
                          className="w-full h-11 px-3 rounded-xl bg-neutral-100 border border-neutral-300 text-xs sm:text-sm font-cairo font-bold text-navy-900 flex items-center justify-between shadow-2xs select-none cursor-default"
                          title="الدولة مقفلة على قطر — الاختيار للمدن فقط"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-base">🇶🇦</span>
                            <span>دولة قطر</span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-normal">الرئيسية</span>
                        </div>
                      </div>
                      <SelectField
                        icon={MapPin}
                        label="المدينة (اختر المدينة)"
                        value={city}
                        onChange={(v) => {
                          onFilterInteraction();
                          setCity(v);
                        }}
                        options={cityOptions}
                        placeholder="اختر المدينة (أو جميع المدن)"
                      />
                    </div>
                  </FilterSection>

                  {/* الخطوة 3: العمر */}
                  <FilterSection icon={Calendar} title="الفئة العمرية" step={3}>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-[#FCFBF9] rounded-xl p-2.5 sm:p-3.5 border border-[#EAE3D9]">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] sm:text-xs text-neutral-500 font-tajawal">من</span>
                          <span className="font-cairo font-bold text-xs sm:text-sm text-[#7B113A] bg-[#7B113A]/10 px-2 py-0.5 rounded-lg whitespace-nowrap">{ageRange[0]} سنة</span>
                        </div>
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={ageRange[0]}
                          onChange={(e) => {
                            onFilterInteraction();
                            setAgeRange([Math.min(Number(e.target.value), ageRange[1]), ageRange[1]]);
                          }}
                          className="w-full h-5 accent-[#7B113A] cursor-pointer"
                        />
                      </div>
                      <div className="bg-[#FCFBF9] rounded-xl p-2.5 sm:p-3.5 border border-[#EAE3D9]">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] sm:text-xs text-neutral-500 font-tajawal">إلى</span>
                          <span className="font-cairo font-bold text-xs sm:text-sm text-[#7B113A] bg-[#7B113A]/10 px-2 py-0.5 rounded-lg whitespace-nowrap">{ageRange[1]} سنة</span>
                        </div>
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={ageRange[1]}
                          onChange={(e) => {
                            onFilterInteraction();
                            setAgeRange([ageRange[0], Math.max(Number(e.target.value), ageRange[0])]);
                          }}
                          className="w-full h-5 accent-[#7B113A] cursor-pointer"
                        />
                      </div>
                    </div>
                  </FilterSection>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== 2) زر خيارات مزيد من فلاتر البحث المتقدمة والإضافية مع دعم لمحة المسيار والمعلن وانقر للتعديل ===== */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={toggleAdvancedFilters}
              aria-expanded={showAdvanced}
              aria-controls="advanced-search-filters"
              className={`w-full min-h-11 sm:min-h-12 flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white font-cairo font-bold transition-all hover:brightness-110 cursor-pointer border ${
                featuredAccess && marriageType
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/25'
                  : 'border-[#D4AF37]/35'
              } shadow-xs`}
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 flex-wrap">
                <Star className="w-4 h-4 text-[#F3DB83] fill-[#F3DB83] flex-shrink-0" />
                <span className="truncate">فلاتر البحث المتقدمة ونوع الزواج</span>

                {!featuredAccess && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-cairo font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-[#F3DB83] border border-[#F3DB83]/40">
                    <Crown className="w-3 h-3 text-[#F3DB83] fill-[#F3DB83]" />
                    <span>باقة مميزة فقط</span>
                  </span>
                )}

                {/* شارة توضيحية ذكية: "انقر للتعديل" تظهر عند طي الفلاتر المتقدمة لأصحاب الباقة */}
                {!showAdvanced && featuredAccess && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-neutral-950 shadow-xs animate-pulse">
                    <Pencil className="w-3 h-3" />
                    <span>انقر للتعديل</span>
                  </span>
                )}

                {featuredAccess && marriageType && !showAdvanced && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3DB83]/20 text-[#F3DB83] text-[11px] font-bold border border-[#F3DB83]/40">
                    <Heart className="w-3 h-3 fill-current" />
                    {marriageType === 'misyar' ? 'مسيار' : 'معلن'}
                  </span>
                )}

                {advancedFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#D4AF37] text-neutral-950 text-[10px] font-extrabold">
                    {advancedFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[#F3DB83] flex-shrink-0">
                <span className="text-[11px] font-tajawal text-slate-300 hidden sm:inline">
                  {showAdvanced ? 'طي الخيارات' : 'تعديل الفلاتر'}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* ملخص الفلتر المتقدم المطبق عند الطي (نوع الزواج) مع زر انقر للتعديل */}
            {!showAdvanced && featuredAccess && marriageType && (
              <div className="flex items-center gap-2 flex-wrap px-1 pt-0.5 text-xs font-tajawal text-neutral-600">
                <span className="text-[11px] text-neutral-500 font-bold">نوع الزواج المطبق:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                  marriageType === 'misyar'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  <Heart className="w-3 h-3" />
                  {marriageType === 'misyar' ? 'الزواج المسيار (بضوابطه الشرعية)' : 'الزواج المعلن (الكامل)'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onAdvancedFilterInteraction();
                    setShowAdvanced(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#7B113A] font-bold underline hover:text-[#500A25] cursor-pointer mr-auto"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  انقر للتعديل
                </button>
              </div>
            )}
          </div>

          {/* محتوى الفلاتر المتقدمة لأصحاب الباقات */}
          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                key="advanced-search-filters-wrapper"
                id="advanced-search-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="overflow-hidden"
                onPointerDown={onAdvancedFilterInteraction}
                onClick={onAdvancedFilterInteraction}
              >
                {/* تنبيه الترقية للأعضاء غير المشتركين في الباقة المميزة */}
                {!featuredAccess && (
                  <div role="alert" className="rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-[#FEF8EC] p-3.5 sm:p-4 font-cairo mb-3.5 shadow-xs">
                    <div className="flex items-center gap-2 text-[#7B113A] font-bold text-xs sm:text-sm mb-1.5">
                      <Crown className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>البحث المتقدم وفلترة نوع الزواج مخصصة للباقة المميزة</span>
                    </div>
                    <p className="text-[11.5px] sm:text-xs text-neutral-700 mb-3 leading-relaxed font-tajawal">
                      تصفية زواج المسيار أو الزواج المعلن، بالإضافة إلى فلاتر الحالة الاجتماعية، المذهب، الجنسية، المؤهل التعليمي، ونوع العمل هي مزايا حصرية لأصحاب الباقات المميزة ولا تتوفر للحسابات المجانية.
                    </p>
                    <div className="flex items-center gap-2">
                      <Link to="/plans" className="rounded-xl bg-[#7B113A] hover:bg-[#680E30] px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs inline-flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        الترقية للباقة المميزة
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdvanced(false);
                          setUpgradePrompt(false);
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-800 px-2.5 py-1.5 cursor-pointer font-tajawal"
                      >
                        إغلاق الفلاتر
                      </button>
                    </div>
                  </div>
                )}

                {/* شريط لمحة استكشافية يوضح للمستخدم نوع الزواج المختار مع زر لتثبيت القائمة (للباقة المميزة فقط) */}
                {featuredAccess && advancedPeekHintActive && (
                  <div className="flex items-center justify-between gap-2 p-2.5 px-3 mb-2.5 rounded-xl bg-gradient-to-l from-amber-50 to-orange-50/60 border border-amber-200 text-amber-900 text-xs font-tajawal shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <span>
                        <strong>تصفية نوع الزواج:</strong> تم تفعيل فلتر <strong>{marriageType === 'misyar' ? 'الزواج المسيار (بضوابطه الشرعية)' : 'الزواج المعلن'}</strong>. سيتم طي الفلاتر لتصفح النتائج ويمكنك النقر على <strong>«انقر للتعديل»</strong> في أي وقت.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onAdvancedFilterInteraction}
                      className="text-[11px] font-bold text-[#7B113A] hover:underline whitespace-nowrap cursor-pointer px-2 py-1 bg-white/90 rounded-lg border border-amber-200/80 shadow-2xs"
                    >
                      إبقاء الفلاتر مفتوحة
                    </button>
                  </div>
                )}

                {/* البحث بالاسم أو كود العضو / الرمز — داخل فلتر البحث المتقدم */}
                <div className={`mb-3.5 p-3 rounded-2xl bg-[#FBF9F5] border border-[#EAE3D9] ${!featuredAccess ? 'opacity-90' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-neutral-800">
                      <SearchIcon className="w-3.5 h-3.5 text-[#7B113A]" />
                      <span>البحث بالاسم، الرمز أو كود العضو</span>
                    </label>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-cairo font-bold px-2 py-0.5 rounded-full ${
                      featuredAccess
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      <Crown className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>{featuredAccess ? 'مفعّل للباقة المميزة' : 'باقة مميزة فقط'}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      readOnly={!featuredAccess}
                      onClick={() => {
                        if (!featuredAccess) {
                          setUpgradePrompt(true);
                          showToast('البحث بالاسم أو كود العضو متاح لأصحاب الباقات المميزة فقط', 'info');
                        }
                      }}
                      onFocus={() => {
                        if (!featuredAccess) {
                          setUpgradePrompt(true);
                          showToast('البحث بالاسم أو كود العضو متاح لأصحاب الباقات المميزة فقط', 'info');
                        }
                      }}
                      onChange={(e) => {
                        if (featuredAccess) {
                          setSearchQuery(e.target.value);
                        } else {
                          setUpgradePrompt(true);
                          showToast('البحث بالاسم أو كود العضو متاح لأصحاب الباقات المميزة فقط', 'info');
                        }
                      }}
                      placeholder={
                        featuredAccess
                          ? "ابحث بالاسم، كود العضو (مثل m1)، أو الكلمة المفتاحية..."
                          : "البحث بالاسم أو الرمز متاح لأصحاب الباقات المميزة فقط ⭐ (انقر للترقية)"
                      }
                      className={`w-full h-10 sm:h-11 pr-9 pl-9 rounded-xl border font-tajawal text-xs sm:text-sm shadow-2xs transition-colors ${
                        featuredAccess
                          ? 'bg-white border-[#EAE3D9] text-neutral-900 focus:border-[#7B113A] focus:outline-none'
                          : 'bg-neutral-100/90 border-neutral-200 text-neutral-600 cursor-pointer placeholder:text-neutral-500'
                      }`}
                    />
                    <SearchIcon className="w-4 h-4 text-[#7B113A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && featuredAccess && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-xs font-bold text-neutral-400 hover:text-neutral-700 bg-neutral-200 rounded-full cursor-pointer"
                        title="مسح البحث"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* نوع الزواج (معلن / مسيار / الجميع) — مخصص للباقة المميزة */}
                <div className={`mb-3.5 ${!featuredAccess ? 'opacity-90' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-navy-800 dark:text-cream-100">
                      <Heart className="w-3.5 h-3.5 text-gold-600" /> نوع الزواج المطلوب (معلن / مسيار)
                    </label>
                    {!featuredAccess && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Crown className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" /> باقة مميزة فقط
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <GenderButton
                      active={marriageType === ''}
                      onClick={() => {
                        if (!featuredAccess) {
                          requireFeatured('فلترة نوع الزواج (مسيار أو معلن) ميزة حصرية لأصحاب الباقة المميزة');
                          return;
                        }
                        onAdvancedFilterInteraction();
                        setMarriageType('');
                      }}
                      label="الجميع"
                      color="gold"
                    />
                    <GenderButton
                      active={featuredAccess && marriageType === 'announced'}
                      onClick={() => {
                        if (!featuredAccess) {
                          requireFeatured('فلترة الزواج المعلن ميزة حصرية لأصحاب الباقة المميزة');
                          return;
                        }
                        onAdvancedFilterInteraction();
                        setMarriageType('announced');
                      }}
                      label="معلن (كامل)"
                      color="rose"
                    />
                    <GenderButton
                      active={featuredAccess && marriageType === 'misyar'}
                      onClick={() => {
                        if (!featuredAccess) {
                          requireFeatured('فلترة الزواج المسيار ميزة حصرية لأصحاب الباقة المميزة');
                          return;
                        }
                        onAdvancedFilterInteraction();
                        setMarriageType('misyar');
                      }}
                      label="مسيار"
                      color="amber"
                    />
                  </div>
                  {featuredAccess && marriageType && (
                    <div className="mt-2 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900">
                      <span>تصفية نشطة: <strong>{marriageType === 'announced' ? 'الزواج المعلن (التقليدي الكامل)' : 'الزواج المسيار (بضوابطه الشرعية)'}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          onAdvancedFilterInteraction();
                          setMarriageType('');
                        }}
                        className="text-amber-800 underline font-bold cursor-pointer hover:text-amber-950"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  )}
                </div>

                <div className={`space-y-3.5 sm:space-y-4 pt-2 border-t border-[#EAE3D9] ${!featuredAccess ? 'opacity-55 pointer-events-none select-none' : ''}`}>

                  {/* الحالة الاجتماعية — تظهر عند اختيار الجنس */}
                  {gender !== 'all' && (
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-navy-800 mb-2">
                        <Heart className="w-3.5 h-3.5 text-gold-600" /> الحالة الاجتماعية
                        <span className="text-[11px] font-normal text-navy-400">
                          ({gender === 'male' ? 'خيارات الرجال' : 'خيارات النساء'})
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {maritalOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setMaritalStatus(maritalStatus === opt.value ? '' : opt.value)}
                            className={`min-h-11 py-2 px-2 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all no-tap-highlight ${
                              maritalStatus === opt.value
                                ? 'bg-gold-gradient text-navy-900 shadow-soft'
                                : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* عدد الأبناء — يظهر فقط للمطلق/الأرمل */}
                  {showChildrenOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-navy-800 mb-2">
                        <Baby className="w-3.5 h-3.5 text-gold-600" /> الأبناء
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => { setHasChildren('false'); setChildrenCount(''); }}
                          className={`py-2.5 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all ${
                            hasChildren === 'false' ? 'bg-gold-gradient text-navy-900 shadow-soft' : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                          }`}
                        >
                          بدون أبناء
                        </button>
                        <button
                          onClick={() => setHasChildren('true')}
                          className={`py-2.5 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all ${
                            hasChildren === 'true' ? 'bg-gold-gradient text-navy-900 shadow-soft' : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                          }`}
                        >
                          لديه أبناء
                        </button>
                      </div>
                      {hasChildren === 'true' && (
                        <div className="mt-2">
                          <SelectField icon={Baby} label="عدد الأبناء" value={childrenCount} onChange={setChildrenCount}
                            options={CHILDREN_COUNTS.filter(c => c !== 'لا يوجد')} placeholder="اختر العدد" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* قبول غير مواطن / أجنبي */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-cairo font-bold text-navy-800 mb-2">
                      <Globe className="w-3.5 h-3.5 text-gold-600" /> قبول غير مواطن / أجنبي
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setAcceptForeigner('')}
                        className={`min-h-11 py-2 px-1.5 sm:px-2 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all ${
                          acceptForeigner === ''
                            ? 'bg-gold-gradient text-navy-900 shadow-soft'
                            : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => setAcceptForeigner('yes')}
                        className={`min-h-11 py-2 px-1.5 sm:px-2 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all ${
                          acceptForeigner === 'yes'
                            ? 'bg-gold-gradient text-navy-900 shadow-soft'
                            : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                        }`}
                      >
                        يقبل أجنبي
                      </button>
                      <button
                        onClick={() => setAcceptForeigner('no')}
                        className={`min-h-11 py-2 px-1.5 sm:px-2 rounded-xl font-cairo font-semibold text-xs sm:text-sm transition-all ${
                          acceptForeigner === 'no'
                            ? 'bg-gold-gradient text-navy-900 shadow-soft'
                            : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                        }`}
                      >
                        مواطن فقط
                      </button>
                    </div>
                  </div>

                  {/* المذهب */}
                  <SelectField icon={BookOpen} label="المذهب" value={sect} onChange={setSect}
                    options={SECTS} placeholder="كل المذاهب" />

                  {/* الجنسية */}
                  <SelectField icon={Globe} label="الجنسية" value={nationality} onChange={setNationality}
                    options={nationalityOptions} placeholder="كل الجنسيات" />

                  {/* التعليم والوظيفة */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <SelectField icon={GraduationCap} label="التعليم" value={education} onChange={setEducation}
                      options={EDUCATION_LEVELS} placeholder="الكل" />
                    <SelectField icon={Briefcase} label="نوع العمل" value={job} onChange={setJob}
                      options={WORK_TYPES} placeholder="الكل" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* البنر السفلي لإجراءات وتسهيل البحث لتقليل المساحة */}
          <div className="sticky bottom-0 z-30 bg-[#FAF7F2]/95 sm:bg-white/95 backdrop-blur-md p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-md border border-[#EAE3D9] flex items-center justify-between gap-2.5 flex-wrap mt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#7B113A]/10 border border-[#7B113A]/20 flex items-center justify-center flex-shrink-0 text-[#7B113A]">
                <SearchIcon className="w-4 h-4 text-[#7B113A]" />
              </div>
              <div className="min-w-0 text-right">
                <p className="font-cairo font-bold text-xs text-neutral-900 truncate">
                  نتائج البحث والفلترة
                </p>
                <p className="font-tajawal text-[11px] text-neutral-600 truncate">
                  <span className="font-bold text-[#7B113A]">{filteredMembers.length}</span> عضو مطابق للفلاتر الحالية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mr-auto flex-shrink-0">
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-cairo font-bold transition-all border border-[#EAE3D9] hover:border-neutral-300 shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                title="تصفير الفلاتر"
              >
                <span>مسح</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <Button
                onClick={handleSearch}
                size="sm"
                className="bg-gradient-to-r from-[#7B113A] via-[#8B1D41] to-[#680E30] hover:from-[#680E30] hover:to-[#500A25] text-white font-cairo font-extrabold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer border border-[#7B113A]/40 active:scale-[0.98] transition-all"
              >
                <SearchIcon className="w-4 h-4 text-white" />
                <span>ابحث الآن ({filteredMembers.length})</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* عرض النتائج */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 sm:pb-12 mt-2 sm:mt-3 border-t border-[#EAE3D9]/70">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-cairo font-extrabold text-base sm:text-xl text-navy-900 whitespace-nowrap">
              نتائج البحث ({filteredMembers.length})
            </h2>
          </div>
          <div className="flex items-center gap-2 mr-auto flex-wrap">
            <p className="text-xs sm:text-sm text-navy-500 font-tajawal">
              {filteredMembers.length > 0
                ? 'مرتبة حسب الجدية والتميز — الأحدث أولاً'
                : 'لا توجد نتائج مطابقة. جرّب تعديل الفلاتر.'}
            </p>
            {filteredMembers.length > 0 && (
              <span className="hidden min-[520px]:inline-flex items-center gap-1 text-[11px] font-tajawal text-navy-600 bg-[#F7EFE6] px-2.5 py-1 rounded-lg border border-[#EAE3D9]">
                <ShieldCheck className="w-3 h-3 text-gold-600" />
                نتائج مفلترة
              </span>
            )}
          </div>
        </div>

        {membersError && members.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-rose-200/70">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-rose-soft flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-rose-deep" />
            </div>
            <p className="font-cairo font-bold text-navy-800 text-lg mb-1">تعذر تحميل الأعضاء</p>
            <p className="text-sm text-navy-500 font-tajawal mb-6">{membersError}</p>
            <Button onClick={retryLoadMembers}>إعادة المحاولة</Button>
          </div>
        ) : membersLoading && members.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            <MemberGridSkeleton count={8} />
          </div>
        ) : filteredMembers.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
              {visibleMembers.map((m, idx) => (
                <MemberCard key={m?.id ? `search-member-${m.id}-${idx}` : `search-member-idx-${idx}`} member={m} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} variant="outline" size="md">
                  عرض المزيد ({filteredMembers.length - visibleMembers.length} متبقٍ)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <SearchIcon className="w-12 h-12 sm:w-16 sm:h-16 text-navy-200 mx-auto mb-4" />
            <p className="font-cairo font-bold text-navy-700 text-lg mb-1">لا توجد نتائج مطابقة</p>
            <p className="text-sm text-navy-400 font-tajawal mb-6">جرّب توسيع نطاق البحث أو تعديل الفلاتر</p>
            <Button
              onClick={() => {
                resetFilters();
              }}
              variant="outline"
              size="md"
            >
              إعادة ضبط الفلاتر
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== مكوّنات مساعدة ===== */

function FilterSection({ icon: Icon, title, step, children }: { icon: typeof Users; title: string; step: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl sm:rounded-none border border-cream-200/70 dark:border-navy-800 sm:border-0 p-2.5 sm:p-0 bg-cream-50/45 dark:bg-navy-950/25 sm:bg-transparent">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-md bg-gold-300/20 text-gold-700 dark:text-gold-300 font-cairo font-bold text-[10px] sm:text-xs flex-shrink-0">
          {step}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] sm:text-sm font-cairo font-bold text-navy-800 dark:text-cream-100">
          <Icon className="w-3.5 h-3.5 text-gold-600" /> {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function GenderButton({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: 'gold' | 'blue' | 'rose' | 'amber' }) {
  const colors = {
    gold: active ? 'bg-[#7B113A] text-white shadow-md' : '',
    blue: active ? 'bg-[#405878] text-white shadow-md' : '',
    rose: active ? 'bg-[#7B113A] text-white shadow-md' : '',
    amber: active ? 'bg-[#A16207] text-white shadow-md' : '',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 px-1.5 py-2 sm:py-3.5 rounded-xl font-cairo font-bold text-[11px] sm:text-sm transition-all no-tap-highlight cursor-pointer ${
        active ? colors[color] : 'bg-[#F7EFE6] text-neutral-700 hover:bg-[#EFE6DA]'
      }`}
    >
      {label}
    </button>
  );
}

function SelectField({ icon: Icon, label, value, onChange, options, placeholder, disabled }: {
  icon: typeof Globe; label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-cairo font-semibold text-neutral-700 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[#7B113A]" /> {label}
      </label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 px-2.5 pl-8 rounded-xl border font-tajawal appearance-none transition-colors text-xs sm:text-sm truncate ${
            disabled
              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-80'
              : 'bg-[#FCFBF9] border-[#EAE3D9] text-neutral-900 focus:border-[#7B113A] focus:outline-none cursor-pointer'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((o, idx) => <option key={`opt-${o}-${idx}`} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
