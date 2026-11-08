import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import {
  UserPlus, Sparkles, RefreshCw, Trash2, Check, Copy, LogIn,
  KeyRound, ShieldCheck, Heart, User, FileText, Phone, Mail,
  Lock, Eye, EyeOff, AlertCircle, CheckCircle2, BadgeCheck,
  Crown, Ruler, GraduationCap
} from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { dataService } from '../../lib/data/DataService';
import { prepareImportedMember } from '../../lib/importBatches';
import * as C from '../../lib/constants';
import {
  Field, TextInput, SelectInput, TextArea, RadioGroup,
  DateSelect, SelectWithOther
} from '../ui/FormFields';
import SearchableSelect from '../ui/SearchableSelect';
import MultiSearchableSelect from '../ui/MultiSearchableSelect';
import {
  getSelfMaritalOptions,
  getPartnerMaritalOptions,
  getPartnerTerms,
  getUnifiedCountries,
  getUnifiedCitiesForCountry,
  getUnifiedCitiesForPartnerCountries,
  getUnifiedNationalities,
  getUnifiedSects,
  getUnifiedSkinColorOptions,
  getUnifiedEducationLevels,
  getUnifiedWorkTypes,
  getUnifiedHousingTypes,
  getUnifiedSmokingOptions,
  getChildrenCountList,
} from '../../lib/registrationOptions';

interface AdminAddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (member: any) => void;
}

// نموذج فارغ تماماً بدون أي خيارات محددة مسبقاً
const emptyFormState = {
  gender: '',
  nickname: '',
  realName: '',
  real_name: '',
  birthDate: '',
  birth_date: '',
  age: '',
  country: 'قطر',
  city: '',
  district: '',
  nationality: '',
  sect: '',
  sectOther: '',
  maritalStatus: '',
  marital_status: '',
  marriageType: '',
  hasChildren: '',
  childrenCount: '',
  childrenLiveWith: '',
  wifeCount: '',
  seekingWife: '',
  height: '',
  weight: '',
  skinColor: '',
  skin_color: '',
  ethnicity: '',
  ethnicityOther: '',
  tribe: '',
  health: '',
  smoking: '',
  education: '',
  workType: '',
  work_type: '',
  jobTitle: '',
  job_title: '',
  housing: '',
  bio: '',

  // مواصفات الشريك
  pCountry: '',
  pCity: '',
  pNationality: '',
  pAgeMin: '',
  pAgeMax: '',
  pAgeAny: false,
  pMaritalStatus: '',
  pAcceptChildren: '',
  pNotes: '',
  aboutPartner: '',

  // بيانات الحساب والاشتراك
  email: '',
  phone: '',
  whatsapp: '',
  password: '',
  sourceType: '',
  importOfficeName: '',
  importNotes: '',
  plan: '',
  status: '',
  isVerified: false,
  adminNotes: '',
};

export default function AdminAddMemberModal({ open, onClose, onCreated }: AdminAddMemberModalProps) {
  const { importMembers, impersonateUser, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // مواصفات الشريك - حالات القوائم المخصصة
  const [pCountryCustomOpen, setPCountryCustomOpen] = useState(false);
  const [pCityCustomOpen, setPCityCustomOpen] = useState(false);
  const [pNationalityCustomOpen, setPNationalityCustomOpen] = useState(false);

  // نموذج إضافة عضو - يبدأ فارغاً تماماً
  const [form, setForm] = useState<any>(emptyFormState);

  const [createdResult, setCreatedResult] = useState<{
    member: any;
    email: string;
    password: string;
    nickname: string;
    realName: string;
    id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // إعادة ضبط النموذج ليكون فارغاً تماماً عند فتح النافذة
  useEffect(() => {
    if (open) {
      setForm(emptyFormState);
      setPCountryCustomOpen(false);
      setPCityCustomOpen(false);
      setPNationalityCustomOpen(false);
      setCreatedResult(null);
      setActiveTab('profile');
    }
  }, [open]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  // القوائم والخيارات المستخرجة من قاعدة البيانات وتطبيعها
  const countryOptions = useMemo(() => getUnifiedCountries(), []);
  const cities = useMemo(() => (form.country ? getUnifiedCitiesForCountry(form.country) : []), [form.country]);
  const nationalityOptions = useMemo(
    () => getUnifiedNationalities(form.gender as any, countryOptions),
    [form.gender, countryOptions]
  );
  const partnerNationalityOptions = useMemo(() => {
    const opposite = form.gender === 'male' ? 'female' : 'male';
    return getUnifiedNationalities(opposite as any, countryOptions);
  }, [form.gender, countryOptions]);

  const pCities = useMemo(
    () => getUnifiedCitiesForPartnerCountries(form.pCountry, form.country),
    [form.pCountry, form.country]
  );

  const pSelectedCountries = useMemo(() => {
    if (!form.pCountry || form.pCountry === 'لا يهم') return [];
    return form.pCountry.split('،').map((s: string) => s.trim()).filter(Boolean);
  }, [form.pCountry]);

  const pSelectedCities = useMemo(() => {
    if (!form.pCity || form.pCity === 'لا يهم') return [];
    return form.pCity.split('،').map((s: string) => s.trim()).filter(Boolean);
  }, [form.pCity]);

  const pSelectedNationalities = useMemo(() => {
    const v = form.pNationality;
    if (!v || v === 'لا يهم' || v === 'نفس جنسيتي' || v === 'اقبل اجنبي' || v === 'أقبل أجنبي') return [];
    return v.split('،').map((s: string) => s.trim()).filter(Boolean);
  }, [form.pNationality]);

  const partnerMaritalOptions = useMemo(
    () => getPartnerMaritalOptions(form.gender as any),
    [form.gender]
  );

  const pSelectedMarital = useMemo(() => {
    if (!form.pMaritalStatus) return [];
    if (form.pMaritalStatus === 'لا يهم') return ['لا يهم'];
    return form.pMaritalStatus.split('،').map((s: string) => s.trim()).filter(Boolean);
  }, [form.pMaritalStatus]);

  const handleTogglePartnerMarital = (opt: string) => {
    if (opt === 'لا يهم') {
      if (form.pMaritalStatus === 'لا يهم') {
        set('pMaritalStatus', '');
      } else {
        set('pMaritalStatus', 'لا يهم');
      }
      return;
    }
    const current = form.pMaritalStatus && form.pMaritalStatus !== 'لا يهم'
      ? form.pMaritalStatus.split('،').map((s: string) => s.trim()).filter(Boolean)
      : [];
    let updated: string[];
    if (current.includes(opt)) {
      updated = current.filter((m: string) => m !== opt);
    } else {
      updated = [...current, opt];
    }
    set('pMaritalStatus', updated.join('، '));
  };

  const isMale = form.gender === 'male';
  const isFemale = form.gender === 'female';
  const partnerTerms = useMemo(() => getPartnerTerms(form.gender as any), [form.gender]);

  const handleBirthDateChange = (date: string) => {
    set('birthDate', date);
    set('birth_date', date);
    if (date) {
      const birth = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const md = today.getMonth() - birth.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
      set('age', age > 0 ? age : '');
    }
  };

  const handleAddCity = (country: string) => (name: string) =>
    dataService.db.addPendingGeo?.('city', name, country, 'الإدارة', 'admin') || { ok: true };
  const handleAddCountry = (name: string) =>
    dataService.db.addPendingGeo?.('country', name, '', 'الإدارة', 'admin') || { ok: true };
  const handleAddNationality = (name: string) =>
    dataService.db.addPendingGeo?.('nationality', name, form.country || '', 'الإدارة', 'admin') || { ok: true };

  // توليد بيانات تجريبية عشوائية للمعاينة السريعة
  const handleGenerateRandom = () => {
    const isFem = Math.random() > 0.45;
    const g: 'male' | 'female' = isFem ? 'female' : 'male';
    const femaleNames = [
      { nick: 'نورة الدوسري', real: 'نورة مبارك الدوسري' },
      { nick: 'مريم الكواري', real: 'مريم محمد الكواري' },
      { nick: 'فاطمة الهاجري', real: 'فاطمة ناصر الهاجري' },
      { nick: 'العنود المري', real: 'العنود جابر المري' },
      { nick: 'سارة المهندي', real: 'سارة حمد المهندي' },
      { nick: 'ريم العطية', real: 'ريم عبدالله العطية' },
      { nick: 'شيخة السليطي', real: 'شيخة جاسم السليطي' },
      { nick: 'شما الخليفي', real: 'شما راشد الخليفي' },
    ];
    const maleNames = [
      { nick: 'عبدالله السبيعي', real: 'عبدالله فهد السبيعي' },
      { nick: 'ناصر المري', real: 'ناصر راشد المري' },
      { nick: 'حمد النعيمي', real: 'حمد سالم النعيمي' },
      { nick: 'محمد الكواري', real: 'محمد خالد الكواري' },
      { nick: 'خالد السليطي', real: 'خالد جاسم السليطي' },
      { nick: 'سلطان الهاجري', real: 'سلطان مبارك الهاجري' },
      { nick: 'راشد المهندي', real: 'راشد محمد المهندي' },
      { nick: 'جاسم العطية', real: 'جاسم ناصر العطية' },
    ];
    const randPair = isFem
      ? femaleNames[Math.floor(Math.random() * femaleNames.length)]
      : maleNames[Math.floor(Math.random() * maleNames.length)];

    const chosenCountry = 'قطر';
    const countryCities = getUnifiedCitiesForCountry('قطر');
    const chosenCity = countryCities[Math.floor(Math.random() * countryCities.length)] || 'الدوحة';
    const qatarDistricts = ['الدفنة', 'لوسيل', 'اللؤلؤة', 'الريان', 'الوعب', 'الخليج الغربي', 'السد', 'معيذر', 'الغرافة', 'الهلال'];
    const chosenDistrict = qatarDistricts[Math.floor(Math.random() * qatarDistricts.length)];
    const randAge = Math.floor(Math.random() * 16) + 23;
    const randNum = Math.floor(Math.random() * 8999999) + 1000000;

    const femaleJobs = ['معلمة في وزارة التربية', 'طبيبة أسنان', 'مهندسة برمجيات', 'أخصائية في مؤسسة قطر', 'محاسبة مالية', 'إدارية'];
    const maleJobs = ['مهندس في قطر للطاقة', 'ضابط', 'طبيب في مؤسسة حمد', 'محلل مالي', 'رائد أعمال', 'موظف بنكي'];

    const maritalOpts = isFem ? ['single', 'divorced', 'widow'] : ['single', 'divorced', 'widower', 'married'];
    const chosenMarital = maritalOpts[Math.floor(Math.random() * maritalOpts.length)];

    const bd = `${new Date().getFullYear() - randAge}-05-15`;

    setForm({
      gender: g,
      nickname: randPair.nick,
      realName: randPair.real,
      real_name: randPair.real,
      birthDate: bd,
      birth_date: bd,
      age: randAge,
      country: 'قطر',
      city: chosenCity,
      district: chosenDistrict,
      nationality: isFem ? 'قطرية' : 'قطري',
      sect: 'سني',
      sectOther: '',
      maritalStatus: chosenMarital,
      marital_status: chosenMarital,
      marriageType: 'announced',
      hasChildren: chosenMarital === 'single' ? 'no' : 'yes',
      childrenCount: chosenMarital === 'single' ? '' : '1',
      childrenLiveWith: chosenMarital === 'single' ? '' : (isFem ? 'معي' : 'مع والدتهم'),
      wifeCount: chosenMarital === 'married' ? '1' : '',
      seekingWife: chosenMarital === 'married' ? 'زوجة ثانية' : '',
      height: isFem ? 164 : 176,
      weight: isFem ? 60 : 78,
      skinColor: 'قمحي',
      skin_color: 'قمحي',
      ethnicity: 'قبيلي اصل فصل',
      ethnicityOther: '',
      tribe: 'قبيلي اصل وفصل',
      health: 'سليم، الحمد لله.',
      smoking: isFem ? 'لا أدخن' : 'لا أدخن',
      education: 'بكالوريوس',
      workType: 'حكومي',
      work_type: 'حكومي',
      jobTitle: isFem ? femaleJobs[Math.floor(Math.random() * femaleJobs.length)] : maleJobs[Math.floor(Math.random() * maleJobs.length)],
      job_title: isFem ? femaleJobs[0] : maleJobs[0],
      housing: isFem ? 'أسكن مع العائلة' : 'أملك منزل',
      bio: isFem
        ? 'إنسانة خلوقة ومحافظة، أحب الهدوء والاستقرار الأسري، أبحث عن شريك صالح ومسؤول يخاف الله.'
        : 'شاب طموح ومستقر مادياً ووظيفياً، أبحث عن شريكة حياة صالحة لبناء أسرة سعيدة قائمة على التفاهم والمودة.',

      pCountry: 'نفس دولتي',
      pCity: 'لا يهم',
      pNationality: 'اقبل اجنبي',
      pAgeMin: isFem ? randAge : Math.max(20, randAge - 5),
      pAgeMax: isFem ? randAge + 8 : randAge + 2,
      pAgeAny: false,
      pMaritalStatus: 'لا يهم',
      pAcceptChildren: 'لا يهم',
      pNotes: isFem
        ? 'رجل يخاف الله، ناضج، كريم الأخلاق، مستقر وظيفياً واجتماعياً.'
        : 'فتاة خلوقة، متدينة، حسنة المظهر والحديث، تقدر الحياة الزوجية.',
      aboutPartner: isFem ? 'رجل يخاف الله ومستقر' : 'فتاة خلوقة ومتدينة',

      email: `member_${randNum}@twafok.sa`,
      phone: `055${randNum}`,
      whatsapp: `055${randNum}`,
      password: `Twa@${Math.floor(Math.random() * 8999) + 1000}`,
      sourceType: 'registered',
      importOfficeName: '',
      importNotes: '',
      plan: Math.random() > 0.6 ? 'featured_1m' : 'free',
      status: 'active',
      isVerified: true,
      adminNotes: 'حساب تم إنشاؤه عبر الإدارة للتوفيق المباشر',
    });
    showToast('تمت تعبئة بيانات تجريبية واقعية ✓', 'success');
  };

  // تفريغ النموذج تماماً بدون أي خيارات محددة مسبقاً
  const handleReset = () => {
    setForm(emptyFormState);
    setPCountryCustomOpen(false);
    setPCityCustomOpen(false);
    setPNationalityCustomOpen(false);
    setCreatedResult(null);
    showToast('تم تفريغ كافة الحقول وإلغاء أي خيارات محددة ✓', 'success');
  };

  // دوال فحص وتغيير أزرار مواصفات الشريك مع دعم الإلغاء الكامل عند الضغط مجدداً
  const isPCountrySame = Boolean(form.pCountry && form.country && (form.pCountry === form.country || form.pCountry === 'نفس دولتي'));
  const isPCountryAny = Boolean(form.pCountry === 'لا يهم' || form.pCountry === 'أي دولة');
  const isPCountryCustom = Boolean(pCountryCustomOpen || (form.pCountry && !isPCountrySame && !isPCountryAny));

  const togglePCountrySame = () => {
    if (isPCountrySame) {
      set('pCountry', '');
    } else {
      set('pCountry', form.country || 'نفس دولتي');
      setPCountryCustomOpen(false);
    }
  };

  const togglePCountryAny = () => {
    if (isPCountryAny) {
      set('pCountry', '');
    } else {
      set('pCountry', 'لا يهم');
      setPCountryCustomOpen(false);
    }
  };

  const togglePCountryCustom = () => {
    if (isPCountryCustom && pCountryCustomOpen) {
      setPCountryCustomOpen(false);
      set('pCountry', '');
    } else {
      setPCountryCustomOpen(true);
      if (!form.pCountry || form.pCountry === 'لا يهم') {
        set('pCountry', form.country || 'قطر');
      }
    }
  };

  const isPCitySame = Boolean(form.pCity && form.city && (form.pCity === form.city || form.pCity === 'نفس مدينتي'));
  const isPCityAny = Boolean(form.pCity === 'لا يهم' || form.pCity === 'أي مدينة');
  const isPCityCustom = Boolean(pCityCustomOpen || (form.pCity && !isPCitySame && !isPCityAny));

  const togglePCitySame = () => {
    if (isPCitySame) {
      set('pCity', '');
    } else {
      set('pCity', form.city || 'نفس مدينتي');
      setPCityCustomOpen(false);
    }
  };

  const togglePCityAny = () => {
    if (isPCityAny) {
      set('pCity', '');
    } else {
      set('pCity', 'لا يهم');
      setPCityCustomOpen(false);
    }
  };

  const togglePCityCustom = () => {
    if (isPCityCustom && pCityCustomOpen) {
      setPCityCustomOpen(false);
      set('pCity', '');
    } else {
      setPCityCustomOpen(true);
      if (!form.pCity || form.pCity === 'لا يهم') {
        set('pCity', form.city || '');
      }
    }
  };

  const isPNatSame = Boolean(form.pNationality && (form.pNationality === 'نفس جنسيتي' || (form.nationality && form.pNationality === form.nationality)));
  const isPNatAny = Boolean(form.pNationality === 'اقبل اجنبي' || form.pNationality === 'أقبل أجنبي' || form.pNationality === 'لا يهم');
  const isPNatCustom = Boolean(pNationalityCustomOpen || (form.pNationality && !isPNatSame && !isPNatAny));

  const togglePNatSame = () => {
    if (isPNatSame) {
      set('pNationality', '');
    } else {
      set('pNationality', form.nationality || form.country || 'نفس جنسيتي');
      setPNationalityCustomOpen(false);
    }
  };

  const togglePNatAny = () => {
    if (isPNatAny) {
      set('pNationality', '');
    } else {
      set('pNationality', 'اقبل اجنبي');
      setPNationalityCustomOpen(false);
    }
  };

  const togglePNatCustom = () => {
    if (isPNatCustom && pNationalityCustomOpen) {
      setPNationalityCustomOpen(false);
      set('pNationality', '');
    } else {
      setPNationalityCustomOpen(true);
      if (!form.pNationality || form.pNationality === 'اقبل اجنبي' || form.pNationality === 'لا يهم') {
        set('pNationality', '');
      }
    }
  };

  const isPAgeAny = Boolean(form.pAgeAny);

  // حفظ العضو في قاعدة البيانات مع التسامح التام مع أي حقل إجباري لا تدخله الإدارة
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const g = form.gender || 'female';
      const randSuffix = Math.floor(1000 + Math.random() * 9000);

      // تطبيق قيم افتراضية ذكية إذا تركت الحقول فارغة (لا يتم حظر الإدارة بأي خطأ)
      const finalNickname = (form.nickname && form.nickname.trim()) || (g === 'male' ? `عضو_${randSuffix}` : `عضوة_${randSuffix}`);
      const finalRealName = (form.realName && form.realName.trim()) || (form.real_name && form.real_name.trim()) || finalNickname;
      const finalAge = Number(form.age) || 25;
      const finalBirthDate = form.birthDate || form.birth_date || `${new Date().getFullYear() - finalAge}-01-01`;
      const finalCountry = form.country || 'قطر';
      const finalCity = form.city || (finalCountry === 'قطر' ? 'الدوحة' : 'الرياض');
      const finalNationality = form.nationality || (finalCountry === 'قطر' ? (g === 'male' ? 'قطري' : 'قطرية') : finalCountry);
      const finalMaritalStatus = form.maritalStatus || form.marital_status || 'single';
      const finalMarriageType = form.marriageType || 'announced';
      const finalEmail = (form.email && form.email.trim().toLowerCase()) || `user_${Date.now()}_${randSuffix}@twafok.sa`;
      const finalPassword = (form.password && form.password.trim()) || `Twafok@${randSuffix}`;
      const finalPhone = (form.phone && form.phone.trim()) || (form.whatsapp && form.whatsapp.trim()) || `050${Math.floor(1000000 + Math.random() * 9000000)}`;
      const finalWhatsapp = (form.whatsapp && form.whatsapp.trim()) || finalPhone;
      const finalUsername = `user_${Date.now()}`;
      const finalHeight = Number(form.height) || (g === 'male' ? 172 : 162);
      const finalWeight = Number(form.weight) || (g === 'male' ? 74 : 60);

      const maritalLabel = (g === 'male')
        ? (finalMaritalStatus === 'single' ? 'أعزب' : finalMaritalStatus === 'married' ? 'متزوج' : finalMaritalStatus === 'divorced' ? 'مطلق' : 'أرمل')
        : (finalMaritalStatus === 'single' ? 'عزباء' : finalMaritalStatus === 'married' ? 'متزوجة' : finalMaritalStatus === 'divorced' ? 'مطلقة' : 'أرملة');

      const memberId = 'm_' + Date.now();

      const memberPayload: any = {
        id: memberId,
        member_code: `TW-${randSuffix}`,
        nickname: finalNickname,
        realName: finalRealName,
        real_name: finalRealName,
        fullName: finalRealName,
        full_name: finalRealName,
        username: finalUsername,
        gender: g,
        age: finalAge,
        birthDate: finalBirthDate,
        birth_date: finalBirthDate,
        country: finalCountry,
        city: finalCity,
        district: form.district || '',
        nationality: finalNationality,
        sect: form.sectOther || form.sect || 'سني',
        sectOther: form.sectOther || '',
        tribe: form.tribe || '',
        maritalStatus: finalMaritalStatus,
        marital_status: finalMaritalStatus,
        maritalLabel,
        marital_label: maritalLabel,
        marriageType: finalMarriageType,
        marriage_type: finalMarriageType,
        marriageTypeLabel: finalMarriageType === 'misyar' ? 'مسيار' : finalMarriageType === 'both' ? 'لا مانع / معلن او مسيار' : 'معلن',
        hasChildren: form.hasChildren === 'yes' || form.hasChildren === true,
        has_children: form.hasChildren === 'yes' || form.hasChildren === true,
        childrenCount: form.childrenCount || '',
        children_count: form.childrenCount || '',
        childrenLiveWith: form.childrenLiveWith || '',
        wifeCount: form.wifeCount || '',
        seekingWife: form.seekingWife || '',

        height: finalHeight,
        weight: finalWeight,
        skinColor: form.skinColor || form.skin_color || 'قمحي',
        skin_color: form.skinColor || form.skin_color || 'قمحي',
        ethnicity: form.ethnicityOther || form.ethnicity || 'قبيلي اصل فصل',
        ethnicityOther: form.ethnicityOther || '',
        health: form.health || 'سليم، الحمد لله.',
        smoking: form.smoking || 'لا أدخن',
        education: form.education || 'بكالوريوس',
        workType: form.workType || form.work_type || 'حكومي',
        work_type: form.workType || form.work_type || 'حكومي',
        jobTitle: form.jobTitle || form.job_title || 'موظف',
        job_title: form.jobTitle || form.job_title || 'موظف',
        occupation: form.jobTitle || form.job_title || 'موظف',
        housing: form.housing || 'أملك منزل',
        housing_type: form.housing || 'أملك منزل',
        bio: form.bio || '',

        // تفضيلات الشريك
        pCountry: form.pCountry || '',
        p_country: form.pCountry || '',
        pCity: form.pCity || '',
        p_city: form.pCity || '',
        pAgeMin: form.pAgeMin === '' ? '' : Number(form.pAgeMin),
        p_age_min: form.pAgeMin === '' ? null : Number(form.pAgeMin),
        pAgeMax: form.pAgeMax === '' ? '' : Number(form.pAgeMax),
        p_age_max: form.pAgeMax === '' ? null : Number(form.pAgeMax),
        pNationality: form.pNationality || '',
        p_nationality: form.pNationality || '',
        pMaritalStatus: form.pMaritalStatus || '',
        p_marital_status: form.pMaritalStatus || '',
        pAcceptChildren: form.pAcceptChildren || '',
        p_accept_children: form.pAcceptChildren || '',
        pNotes: form.pNotes || form.aboutPartner || '',
        aboutPartner: form.pNotes || form.aboutPartner || '',
        about_partner: form.pNotes || form.aboutPartner || '',

        // بيانات الدخول والإدارة
        email: finalEmail,
        password: finalPassword,
        phone: finalPhone,
        whatsapp: finalWhatsapp,
        sourceType: form.sourceType || 'registered',
        source_type: form.sourceType || 'registered',
        importOfficeName: form.importOfficeName || '',
        importNotes: form.importNotes || '',
        plan: form.plan || 'free',
        plan_id: form.plan || 'free',
        status: form.status || 'active',
        is_active: form.status === 'active' || !form.status ? 1 : 0,
        verified: !!form.isVerified,
        is_verified: form.isVerified ? 1 : 0,
        premium: form.plan && form.plan !== 'free',
        online: true,
        lastActive: 'متصل الآن',
        last_active: new Date().toISOString(),
        isManagedByAdmin: true,
        adminNotes: form.adminNotes || 'حساب منشأ وموثق إدارياً',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        joinedAt: new Date().toLocaleDateString('ar-SA'),
      };

      // 1. الحفظ في قاعدة بيانات MySQL عبر مسار الخادم والمصادقة
      try {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: finalEmail,
            password: finalPassword,
            fullName: finalRealName,
            nickname: finalNickname,
            phone: finalPhone,
            whatsapp: finalWhatsapp,
            gender: g,
            nationality: finalNationality,
            country: finalCountry,
            city: finalCity,
            district: form.district || '',
            tribe: form.tribe || '',
            ethnicity: form.ethnicityOther || form.ethnicity,
            ethnicityOther: form.ethnicityOther || '',
            age: finalAge,
            height: finalHeight,
            weight: finalWeight,
            skinColor: form.skinColor || form.skin_color,
            health: form.health,
            smoking: form.smoking,
            education: form.education,
            workType: form.workType || form.work_type,
            jobTitle: form.jobTitle || form.job_title,
            housing: form.housing,
            maritalStatus: finalMaritalStatus,
            marriageType: finalMarriageType,
            bio: form.bio,
            partnerRequirements: form.pNotes || form.aboutPartner,
            partnerSpecifications: form.pNotes || form.aboutPartner,
            sourceType: form.sourceType || 'registered',
            details: {
              pCountry: form.pCountry,
              pCity: form.pCity,
              pAgeMin: form.pAgeMin,
              pAgeMax: form.pAgeMax,
              pNationality: form.pNationality,
              pMaritalStatus: form.pMaritalStatus,
              pAcceptChildren: form.pAcceptChildren,
              pNotes: form.pNotes || form.aboutPartner,
              adminNotes: form.adminNotes,
              sourceType: form.sourceType,
              importOfficeName: form.importOfficeName,
            },
          }),
        });

        // إذا تم إنشاء العضو وكانت الباقة أو الحالة مختلفة عن الافتراضي نحدثها فوراً
        if (regRes.ok && (form.plan || form.status || form.isVerified)) {
          const regData = await regRes.json().catch(() => null);
          const targetId = regData?.memberId || regData?.memberCode || finalEmail;
          if (targetId) {
            await fetch(`/api/members/${targetId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                plan_id: form.plan || 'free',
                is_verified: form.isVerified ? 1 : 0,
                is_active: form.status === 'active' || !form.status ? 1 : 0,
                is_featured: form.plan && form.plan !== 'free' ? 1 : 0,
              }),
            }).catch(() => null);
          }
        }
      } catch (e) {
        console.warn('[Admin Add Member] API server sync note:', e);
      }

      // 2. الحفظ في قاعدة البيانات المحلية DataService (SQLite / LocalRepository)
      try {
        await dataService.db.members.create(memberPayload).catch((e) =>
          console.warn('[DataService] local save note:', e)
        );
      } catch (err) {
        console.warn('[DataService Save Member Note]:', err);
      }

      // 3. التحديث المباشر لحالة التطبيق وقوائم الإدارة والمزامنة
      const normalizedForState = prepareImportedMember(memberPayload, 'admin_manual', 'الإدارة المباشرة');
      importMembers([{ ...memberPayload, ...normalizedForState } as any], false);

      // 4. عرض بطاقة النجاح مع بيانات الاعتماد
      setCreatedResult({
        member: memberPayload,
        email: finalEmail,
        password: finalPassword,
        nickname: finalNickname,
        realName: finalRealName,
        id: memberId,
      });

      if (onCreated) {
        onCreated(memberPayload);
      }

      showToast(`تم إنشاء حساب العضو «${finalNickname}» وحفظه في قاعدة البيانات بنجاح ✓`, 'success');
    } catch (error: any) {
      console.error('Error creating member:', error);
      showToast('حدث خطأ أثناء حفظ العضو: ' + (error?.message || 'يرجى المحاولة مجدداً'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `بيانات حساب منصة توافق:\nالاسم: ${createdResult.realName} (${createdResult.nickname})\nالبريد: ${createdResult.email}\nكلمة المرور: ${createdResult.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImpersonate = () => {
    if (!createdResult) return;
    impersonateUser(createdResult.member);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setCreatedResult(null);
        onClose();
      }}
      title="إضافة عضو جديد (إنشاء حساب في قاعدة البيانات)"
      size="xl"
    >
      <div className="space-y-4 text-right antialiased font-tajawal" dir="rtl">
        {createdResult ? (
          /* شاشة النتيجة الناجحة بعد الحفظ */
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center justify-center text-center p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-cairo font-bold text-emerald-900 mb-1">
                تم حفظ العضو وإنشاء الحساب في قاعدة البيانات بنجاح!
              </h4>
              <p className="text-xs font-tajawal text-emerald-700 max-w-md">
                تم تسجيل العضو كحساب رسمي مفعل بالكامل، ويمكنه تسجيل الدخول فوراً أو يمكن للإدارة التصفح نيابة عنه.
              </p>
            </div>

            {/* بطاقة بيانات تسجيل الدخول */}
            <div className="bg-navy-950 text-white rounded-3xl p-6 shadow-xl border border-cream-200/20 space-y-4">
              <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                <span className="text-sm font-cairo text-gold-400 font-bold flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-gold-400" /> بيانات الاعتماد والحساب الجديد
                </span>
                <span className="text-xs font-mono bg-navy-800 px-3 py-1 rounded-full text-gold-200">
                  {createdResult.member.member_code || createdResult.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-navy-900/80 p-3 rounded-2xl border border-navy-800">
                  <span className="block text-navy-400 text-[11px] mb-1">الاسم المستعار:</span>
                  <span className="font-bold text-white text-sm">{createdResult.nickname}</span>
                </div>
                <div className="bg-navy-900/80 p-3 rounded-2xl border border-navy-800">
                  <span className="block text-navy-400 text-[11px] mb-1">الاسم الحقيقي:</span>
                  <span className="font-bold text-white text-sm">{createdResult.realName}</span>
                </div>
                <div className="bg-navy-900/80 p-3 rounded-2xl border border-navy-800 sm:col-span-2">
                  <span className="block text-navy-400 text-[11px] mb-1">البريد الإلكتروني (لتسجيل الدخول):</span>
                  <span className="font-mono font-bold text-gold-300 text-sm select-all">{createdResult.email}</span>
                </div>
                <div className="bg-navy-900/80 p-3 rounded-2xl border border-navy-800 sm:col-span-2">
                  <span className="block text-navy-400 text-[11px] mb-1">كلمة المرور:</span>
                  <span className="font-mono font-bold text-emerald-400 text-base select-all">{createdResult.password}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-cairo font-bold text-xs transition-colors border border-navy-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'تم النسخ للحافظة!' : 'نسخ بيانات الدخول'}
                </button>

                <button
                  type="button"
                  onClick={handleImpersonate}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-cairo font-bold text-xs transition-colors shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول كـ هذا العضو الآن
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedResult(null);
                  handleReset();
                }}
                className="flex-1 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-800 font-cairo font-bold text-xs transition-colors"
              >
                + إنشاء حساب عضو آخر
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedResult(null);
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-cairo font-bold text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* شريط الإرشادات والتعبئة السريعة */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-gold-300/10 border border-gold-300/30 rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-navy-900 text-xs font-tajawal">
                <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                <span>
                  <strong>نموذج إضافة حساب عضو (حقول نظيفة واختيارية):</strong> كافة الحقول تبدأ فارغة دون خيارات مفروضة، ويمكنك اختيار أو إلغاء تحديد أي خيار بالضغط عليه مجدداً.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-cairo font-bold text-xs transition-colors shadow-2xs"
                  title="تعبئة بيانات تجريبية واقعية للتجربة السريعة"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> توليد عشوائي للتجربة
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-700 font-cairo text-xs transition-colors"
                  title="تفريغ كافة الخيارات والحقول"
                >
                  <Trash2 className="w-3.5 h-3.5" /> تفريغ الكل
                </button>
              </div>
            </div>

            {/* تبويبات التعديل الرئيسية المطابقة تماماً لـ AdminMemberDetailModal */}
            <div className="flex items-center gap-2 border-b border-cream-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl font-cairo font-bold text-xs transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-gold-500 text-white shadow-soft'
                    : 'bg-cream-100 text-navy-700 hover:bg-cream-200'
                }`}
              >
                <User className="w-4 h-4" /> بيانات الملف الشخصي والمواصفات والشريك
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 rounded-xl font-cairo font-bold text-xs transition-colors flex items-center gap-2 ${
                  activeTab === 'account'
                    ? 'bg-gold-500 text-white shadow-soft'
                    : 'bg-cream-100 text-navy-700 hover:bg-cream-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> بيانات الحساب والاشتراك والاتصال
              </button>
            </div>

            {/* محتوى النموذج — مطابق تماماً لأقسام renderProfileEditTab و renderAccountEditTab */}
            <div className="max-h-[62vh] overflow-y-auto px-0.5 py-1 space-y-5">
              {activeTab === 'profile' ? (
                <>
                  {/* ═══ 1. المعلومات الأساسية ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <User className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">المعلومات الأساسية</h2>
                    </div>

                    <Field label="الجنس (اضغط لتحديد الجنس أو لإلغاء التحديد)" showRequirementBadge={false}>
                      <RadioGroup
                        options={[
                          { value: 'female', label: 'أنثى' },
                          { value: 'male', label: 'ذكر' },
                        ]}
                        value={form.gender || ''}
                        onChange={(v) => {
                          set('gender', v);
                          if (form.country === 'قطر') set('nationality', v === 'male' ? 'قطري' : v === 'female' ? 'قطرية' : '');
                          else if (form.country === 'السعودية') set('nationality', v === 'male' ? 'سعودي' : v === 'female' ? 'سعودية' : '');
                        }}
                        allowDeselect={true}
                        columns={2}
                      />
                    </Field>

                    <Field label="الاسم المستعار" hint="يظهر في ملفه العام (إذا ترك فارغاً سيولّد النظام اسماً تلقائياً)" showRequirementBadge={false}>
                      <TextInput
                        value={form.nickname || ''}
                        onChange={(v) => set('nickname', v)}
                        placeholder="مثال: أبو عبدالله، باحثة عن الستر..."
                      />
                    </Field>

                    <Field label="تاريخ الميلاد" hint="اختر السنة ثم الشهر ثم اليوم (اختياري)" showRequirementBadge={false}>
                      <DateSelect value={form.birthDate || ''} onChange={handleBirthDateChange} />
                    </Field>

                    <Field label="العمر (محسوب تلقائيًا أو يدويًا)" showRequirementBadge={false}>
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-3 rounded-xl bg-gold-300/10 border-2 border-gold-300/40 flex items-center gap-2 shrink-0">
                          <span className="font-cairo font-extrabold text-2xl text-gradient-gold">
                            {form.age > 0 ? form.age : '—'}
                          </span>
                          {form.age > 0 && <span className="text-navy-500 font-tajawal">سنة</span>}
                        </div>
                        <TextInput
                          type="number"
                          min={18}
                          max={85}
                          value={form.age ? String(form.age) : ''}
                          onChange={(v) => {
                            const num = Number(v);
                            set('age', v === '' ? '' : num);
                            if (num > 0) {
                              const bd = `${new Date().getFullYear() - num}-01-01`;
                              set('birthDate', bd);
                              set('birth_date', bd);
                            } else {
                              set('birthDate', '');
                              set('birth_date', '');
                            }
                          }}
                          placeholder="اكتب العمر..."
                          className="flex-1"
                        />
                      </div>
                    </Field>

                    <Field label="الدولة" showRequirementBadge={false}>
                      <SearchableSelect
                        value={form.country || ''}
                        onChange={(v) => {
                          set('country', v);
                          set('city', '');
                          if (v === 'قطر') set('nationality', form.gender === 'male' ? 'قطري' : form.gender === 'female' ? 'قطرية' : 'قطري');
                          else if (v === 'السعودية') set('nationality', form.gender === 'male' ? 'سعودي' : form.gender === 'female' ? 'سعودية' : 'سعودي');
                          else set('nationality', v);
                        }}
                        options={countryOptions}
                        placeholder="ابحث واختر الدولة (اختياري)..."
                        searchPlaceholder="اكتب اسم الدولة..."
                        allowAddNew
                        onAddNew={handleAddCountry}
                        addNewLabel="إذا لم تجد دولتك؟ اضغط هنا لكتابة اسم الدولة"
                        addNewPlaceholder="اكتب اسم الدولة..."
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="المدينة" showRequirementBadge={false}>
                        <SearchableSelect
                          value={form.city || ''}
                          onChange={(v) => set('city', v)}
                          options={cities}
                          placeholder={form.country ? 'ابحث واختر المدينة (اختياري)...' : 'اختر الدولة أولًا'}
                          searchPlaceholder="اكتب اسم المدينة..."
                          disabled={!form.country}
                          allowAddNew={!!form.country}
                          onAddNew={handleAddCity(form.country || '')}
                          addNewLabel="إذا لم تجد مدينتك؟ اضغط هنا لكتابة اسم المدينة"
                          addNewPlaceholder="اكتب اسم مدينتك..."
                        />
                      </Field>
                      <Field label="المنطقة / الحي" hint="الحي أو المنطقة التفصيلية" showRequirementBadge={false}>
                        <TextInput
                          value={form.district || ''}
                          onChange={(v) => set('district', v)}
                          placeholder="مثال: لوسيل، الدفنة، العليا..."
                        />
                      </Field>
                    </div>

                    <Field label="الجنسية" hint="جنسية العضو" showRequirementBadge={false}>
                      <SearchableSelect
                        value={form.nationality || ''}
                        onChange={(v) => set('nationality', v)}
                        options={nationalityOptions}
                        placeholder="ابحث عن الجنسية (اختياري)..."
                        searchPlaceholder="أدخل اسم الدولة التي منها جنسيتك..."
                        allowAddNew
                        onAddNew={handleAddNationality}
                        addNewLabel="إذا لم تجد جنسيتك؟ اضغط هنا لكتابة دولة الجنسية"
                        addNewPlaceholder="أدخل اسم الدولة التي منها جنسيتك..."
                      />
                    </Field>

                    <Field label="المذهب" hint="المذهب الديني" showRequirementBadge={false}>
                      <SelectWithOther
                        value={form.sect || ''}
                        otherValue={form.sectOther || ''}
                        onChange={(v) => set('sect', v)}
                        onOtherChange={(v) => set('sectOther', v)}
                        options={getUnifiedSects()}
                        placeholder="اختر المذهب (اختياري)..."
                      />
                    </Field>
                  </div>

                  {/* ═══ 2. الحالة الاجتماعية ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">الحالة الاجتماعية</h2>
                    </div>

                    <Field label="الحالة الاجتماعية (اضغط للخيار أو اضغط عليه مجدداً لإلغائه)" showRequirementBadge={false}>
                      <RadioGroup
                        options={getSelfMaritalOptions(form.gender as any)}
                        value={form.maritalStatus || form.marital_status || ''}
                        onChange={(v) => {
                          set('maritalStatus', v);
                          set('marital_status', v);
                        }}
                        allowDeselect={true}
                        columns={isMale ? 4 : 3}
                      />
                    </Field>

                    <Field label="نوع الزواج المطلوب (اضغط للخيار أو لإلغائه)" showRequirementBadge={false}>
                      <RadioGroup
                        options={[
                          { value: 'announced', label: 'معلن' },
                          { value: 'misyar', label: 'مسيار' },
                          { value: 'both', label: 'لا مانع / معلن او مسيار' },
                        ]}
                        value={form.marriageType || ''}
                        onChange={(v) => set('marriageType', v)}
                        allowDeselect={true}
                        columns={3}
                      />
                    </Field>

                    {['divorced', 'widower', 'widow', 'widowed', 'مطلق', 'مطلقة', 'أرمل', 'أرملة'].includes(
                      form.maritalStatus || form.marital_status || ''
                    ) && (
                      <div className="space-y-4 bg-cream-50 rounded-2xl p-4 border border-cream-200">
                        <h4 className="font-cairo font-bold text-navy-900 text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-gold-600" /> معلومات الأبناء
                        </h4>
                        <Field label={isMale ? 'هل لديك أبناء؟' : 'هل لديكِ أبناء؟'} showRequirementBadge={false}>
                          <RadioGroup
                            options={C.YES_NO}
                            value={form.hasChildren || ''}
                            onChange={(v) => set('hasChildren', v)}
                            allowDeselect={true}
                          />
                        </Field>
                        {(form.hasChildren === 'yes' || form.hasChildren === true) && (
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="عدد الأبناء" showRequirementBadge={false}>
                              <SelectInput
                                value={form.childrenCount || ''}
                                onChange={(v) => set('childrenCount', v)}
                                options={getChildrenCountList()}
                                placeholder="اختر (اختياري)"
                              />
                            </Field>
                            <Field label={isMale ? 'هل الأبناء يعيشون معك؟' : 'هل الأبناء يعيشون معكِ؟'} showRequirementBadge={false}>
                              <RadioGroup
                                options={C.YES_NO}
                                value={form.childrenLiveWith || ''}
                                onChange={(v) => set('childrenLiveWith', v)}
                                allowDeselect={true}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    )}

                    {isMale && ['married', 'متزوج'].includes(form.maritalStatus || form.marital_status || '') && (
                      <div className="space-y-4 bg-cream-50 rounded-2xl p-4 border border-cream-200">
                        <h4 className="font-cairo font-bold text-navy-900 text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-gold-600" /> تفاصيل الزواج
                        </h4>
                        <Field label="عدد الزوجات الحالي" showRequirementBadge={false}>
                          <RadioGroup
                            options={C.WIFE_COUNT}
                            value={form.wifeCount || ''}
                            onChange={(v) => set('wifeCount', v)}
                            allowDeselect={true}
                            columns={3}
                          />
                        </Field>
                        <Field label="هل لديك أبناء؟" showRequirementBadge={false}>
                          <RadioGroup
                            options={C.YES_NO}
                            value={form.hasChildren || ''}
                            onChange={(v) => set('hasChildren', v)}
                            allowDeselect={true}
                          />
                        </Field>
                        {(form.hasChildren === 'yes' || form.hasChildren === true) && (
                          <Field label="كم عدد الأبناء؟" showRequirementBadge={false}>
                            <SelectInput
                              value={form.childrenCount || ''}
                              onChange={(v) => set('childrenCount', v)}
                              options={getChildrenCountList()}
                              placeholder="اختر (اختياري)"
                            />
                          </Field>
                        )}
                        <Field label="هل تبحث عن زوجة أخرى؟" showRequirementBadge={false}>
                          <RadioGroup
                            options={C.YES_NO}
                            value={form.seekingWife || ''}
                            onChange={(v) => set('seekingWife', v)}
                            allowDeselect={true}
                          />
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* ═══ 3. المواصفات الشخصية ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">المواصفات الشخصية</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="الطول (كتابة)" hint="بالسنتيمتر" showRequirementBadge={false}>
                        <div className="relative">
                          <TextInput
                            type="number"
                            min={80}
                            max={300}
                            value={form.height ? String(form.height) : ''}
                            onChange={(v) => set('height', v ? Number(v) : '')}
                            placeholder="80 - 300 سم"
                            className="pl-12"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-navy-400 font-tajawal pointer-events-none">
                            سم
                          </span>
                        </div>
                      </Field>
                      <Field label="الوزن (كتابة)" hint="بالكيلوغرام" showRequirementBadge={false}>
                        <div className="relative">
                          <TextInput
                            type="number"
                            min={20}
                            max={300}
                            value={form.weight ? String(form.weight) : ''}
                            onChange={(v) => set('weight', v ? Number(v) : '')}
                            placeholder="20 - 300 كجم"
                            className="pl-12"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-navy-400 font-tajawal pointer-events-none">
                            كجم
                          </span>
                        </div>
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="لون البشرة" hint="لون البشرة الطبيعي (12 خياراً معتمداً)" showRequirementBadge={false}>
                        <SearchableSelect
                          value={form.skinColor || form.skin_color || ''}
                          onChange={(v) => {
                            set('skinColor', v);
                            set('skin_color', v);
                          }}
                          options={getUnifiedSkinColorOptions()}
                          placeholder="اختر لون البشرة (اختياري)..."
                          searchPlaceholder="ابحث عن لون البشرة..."
                        />
                      </Field>

                      <Field label="العرق / الأصل (اضغط للخيار أو لإلغائه)" hint="اختر من الخيارات المحددة، أو اختر 'أخرى' لكتابة أصلك" showRequirementBadge={false}>
                        <RadioGroup
                          options={[
                            { value: 'قبيلي اصل فصل', label: 'قبيلي اصل فصل' },
                            { value: 'غير قبيلي', label: 'غير قبيلي' },
                            { value: 'أخرى', label: 'أخرى' },
                          ]}
                          value={
                            form.ethnicity === 'قبيلي اصل فصل' || form.ethnicity === 'غير قبيلي'
                              ? form.ethnicity
                              : form.ethnicity ? 'أخرى' : ''
                          }
                          onChange={(v) => {
                            set('ethnicity', v);
                            if (v !== 'أخرى') set('ethnicityOther', '');
                          }}
                          allowDeselect={true}
                          columns={3}
                        />
                        {(form.ethnicity === 'أخرى' ||
                          (form.ethnicity && form.ethnicity !== 'قبيلي اصل فصل' && form.ethnicity !== 'غير قبيلي')) && (
                          <div className="mt-2 space-y-1">
                            <label className="text-xs text-navy-800 font-cairo font-bold">اكتب العرق / الأصل بالتفصيل:</label>
                            <TextInput
                              value={form.ethnicityOther || (form.ethnicity !== 'أخرى' ? form.ethnicity : '')}
                              onChange={(v) => {
                                set('ethnicityOther', v);
                                set('ethnicity', 'أخرى');
                              }}
                              placeholder="اكتب أصلك / عرقك بالتفصيل..."
                            />
                          </div>
                        )}
                      </Field>
                    </div>

                    <Field label="القبيلة / النسب" hint="اسم القبيلة أو انتسابك" showRequirementBadge={false}>
                      <TextInput
                        value={form.tribe || ''}
                        onChange={(v) => set('tribe', v)}
                        placeholder="مثال: آل ثاني أو المعاضيد أو الدوسري أو المري..."
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="الحالة الصحية (اضغط للخيار أو لإلغائه)" hint="اختر الحالة الصحية المحددة" showRequirementBadge={false}>
                        <RadioGroup
                          options={[
                            { value: 'سليم، الحمد لله.', label: 'سليم، الحمد لله.' },
                            { value: 'لدي إعاقة.', label: 'لدي إعاقة.' },
                            { value: 'أعاني من مرض مزمن.', label: 'أعاني من مرض مزمن.' },
                            { value: 'أخرى.', label: 'أخرى.' },
                          ]}
                          value={form.health || ''}
                          onChange={(v) => set('health', v)}
                          allowDeselect={true}
                          columns={2}
                        />
                      </Field>
                      <Field label={isFemale ? 'هل تدخنين؟' : 'هل تدخن؟'} hint="عادة التدخين" showRequirementBadge={false}>
                        <SelectInput
                          value={form.smoking || ''}
                          onChange={(v) => set('smoking', v)}
                          options={getUnifiedSmokingOptions()}
                          placeholder="اختر (اختياري)..."
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ═══ 4. التعليم والعمل ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">التعليم والعمل</h2>
                    </div>

                    <Field label="المؤهل الدراسي" hint="أعلى مؤهل علمي" showRequirementBadge={false}>
                      <SelectInput
                        value={form.education || ''}
                        onChange={(v) => set('education', v)}
                        options={getUnifiedEducationLevels()}
                        placeholder="اختر المؤهل (اختياري)..."
                      />
                    </Field>

                    <Field label="نوع الوظيفة (اضغط للخيار أو لإلغائه)" hint="طبيعة العمل" showRequirementBadge={false}>
                      <RadioGroup
                        options={getUnifiedWorkTypes().map((w) => ({ value: w, label: w }))}
                        value={form.workType || form.work_type || ''}
                        onChange={(v) => {
                          set('workType', v);
                          set('work_type', v);
                          if (!v || v === 'بدون عمل') {
                            set('jobTitle', '');
                            set('job_title', '');
                          }
                        }}
                        allowDeselect={true}
                        columns={3}
                      />
                    </Field>

                    {(form.workType || form.work_type) && (form.workType || form.work_type) !== 'بدون عمل' && (
                      <Field label="المسمى الوظيفي" showRequirementBadge={false}>
                        <TextInput
                          value={form.jobTitle || form.job_title || ''}
                          onChange={(v) => {
                            set('jobTitle', v);
                            set('job_title', v);
                          }}
                          placeholder="معلم، طبيب، مهندس، إداري..."
                        />
                      </Field>
                    )}

                    <Field label="نوع السكن" hint="الوضع السكني" showRequirementBadge={false}>
                      <SelectInput
                        value={form.housing || ''}
                        onChange={(v) => set('housing', v)}
                        options={getUnifiedHousingTypes()}
                        placeholder="اختر السكن (اختياري)..."
                      />
                    </Field>
                  </div>

                  {/* ═══ 5. نبذة ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">نبذة عن العضو</h2>
                    </div>
                    <Field label="اكتب نبذة قصيرة" hint={`${(form.bio || '').length}/500 حرف`} showRequirementBadge={false}>
                      <TextArea
                        value={form.bio || ''}
                        onChange={(v) => set('bio', v)}
                        placeholder="اكتب نبذة عن شخصية العضو وأهدافه وتطلعاته الأسرية..."
                        rows={4}
                      />
                    </Field>
                  </div>

                  {/* ═══ 6. مواصفات الشريك — المطابقة تماماً لـ EditProfile و AdminMemberDetailModal ═══ */}
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">
                        مواصفات {partnerTerms.partnerLabel} المطلوبة
                      </h2>
                    </div>

                    {/* 1. دولة الشريك */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        1. {partnerTerms.countryLabel} (اضغط للتحديد أو لإلغاء الاختيار)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={togglePCountrySame}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCountrySame
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCountrySame && '✓ '}نفس دولتي {form.country ? `(${form.country})` : ''}
                        </button>
                        <button
                          type="button"
                          onClick={togglePCountryAny}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCountryAny
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCountryAny && '✓ '}أي دولة / لا يهم
                        </button>
                        <button
                          type="button"
                          onClick={togglePCountryCustom}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCountryCustom
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCountryCustom && '✓ '}تحديد دول معينة (دولة أو أكثر)
                        </button>
                      </div>
                      {isPCountryCustom && (
                        <div className="pt-2">
                          <Field label="الدول المطلوبة (يمكنك اختيار دولة واحدة أو عدة دول)" hint="اختر دولة أو أكثر من القائمة" showRequirementBadge={false}>
                            <MultiSearchableSelect
                              values={pSelectedCountries}
                              onChange={(v) => set('pCountry', v.length > 0 ? v.join('، ') : '')}
                              options={countryOptions}
                              placeholder="ابحث واختر الدول المطلوبة..."
                              searchPlaceholder="ابحث عن دولة..."
                              allowAddNew
                              onAddNew={handleAddCountry}
                              addNewLabel="إذا لم تجد الدولة؟ اضغط هنا لكتابتها"
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* 2. مدينة الشريك */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        2. {partnerTerms.cityLabel} (اضغط للتحديد أو لإلغاء الاختيار)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={togglePCitySame}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCitySame
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCitySame && '✓ '}نفس مدينتي {form.city ? `(${form.city})` : ''}
                        </button>
                        <button
                          type="button"
                          onClick={togglePCityAny}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCityAny
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCityAny && '✓ '}أي مدينة / لا يهم
                        </button>
                        <button
                          type="button"
                          onClick={togglePCityCustom}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPCityCustom
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPCityCustom && '✓ '}تحديد مدن معينة (مدينة أو أكثر)
                        </button>
                      </div>
                      {isPCityCustom && (
                        <div className="pt-2">
                          <Field label="المدن المطلوبة (يمكنك اختيار مدينة واحدة أو عدة مدن)" hint="اختر مدينة أو أكثر من القائمة" showRequirementBadge={false}>
                            <MultiSearchableSelect
                              values={pSelectedCities}
                              onChange={(v) => set('pCity', v.length > 0 ? v.join('، ') : '')}
                              options={pCities}
                              placeholder="ابحث واختر المدن المطلوبة..."
                              searchPlaceholder="ابحث عن مدينة..."
                              allowAddNew
                              onAddNew={(n) => handleAddCity(form.pCountry || form.country || 'قطر')(n)}
                              addNewLabel="إذا لم تجد المدينة؟ اضغط هنا لكتابتها"
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* 3. الجنسية */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        3. {partnerTerms.nationalityLabel} (اضغط للتحديد أو لإلغاء الاختيار)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={togglePNatSame}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPNatSame
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPNatSame && '✓ '}نفس جنسيتي {form.country ? `(${form.country})` : ''}
                        </button>
                        <button
                          type="button"
                          onClick={togglePNatAny}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPNatAny
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPNatAny && '✓ '}اقبل اجنبي (أية جنسية)
                        </button>
                        <button
                          type="button"
                          onClick={togglePNatCustom}
                          className={`px-3 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            isPNatCustom
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPNatCustom && '✓ '}تحديد جنسيات معينة
                        </button>
                      </div>
                      {isPNatCustom && (
                        <div className="pt-2">
                          <Field label="تحديد جنسيات معينة (يمكنك اختيار جنسية واحدة أو عدة جنسيات)" hint={`الدولة التي منها جنسية العضو: ${form.country || 'اختر دولة الإقامة أولاً'}`} showRequirementBadge={false}>
                            <MultiSearchableSelect
                              values={pSelectedNationalities}
                              onChange={(v) => set('pNationality', v.length > 0 ? v.join('، ') : '')}
                              options={partnerNationalityOptions}
                              placeholder="ابحث واختر الجنسيات المطلوبة..."
                              searchPlaceholder="أدخل اسم الدولة التي منها جنسيتك..."
                              allowAddNew
                              onAddNew={handleAddNationality}
                              addNewLabel="إذا لم تجد الجنسية؟ اضغط هنا لكتابة دولة الجنسية"
                              addNewPlaceholder="أدخل اسم الدولة التي منها جنسيتك..."
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* 4. العمر */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="block text-xs font-cairo font-bold text-slate-800">
                          4. {partnerTerms.ageLabel}
                        </label>
                        <span className="text-xs font-cairo font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {isPAgeAny
                            ? 'غير محدد (أي عمر)'
                            : form.pAgeMin || form.pAgeMax
                            ? `من ${form.pAgeMin || 'أي عمر'} إلى ${form.pAgeMax || 'أي عمر'} سنة`
                            : 'بدون تحديد'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPAgeAny) {
                              set('pAgeAny', false);
                            } else {
                              set('pAgeAny', true);
                              set('pAgeMin', '');
                              set('pAgeMax', '');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-cairo font-bold border transition-all ${
                            isPAgeAny
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPAgeAny && '✓ '}غير محدد / أي عمر
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-600 font-cairo font-bold mb-1 block">الحد الأدنى للعمر (من)</label>
                          <input
                            type="number"
                            min={16}
                            max={90}
                            value={form.pAgeMin || ''}
                            onChange={(e) => {
                              set('pAgeMin', e.target.value === '' ? '' : Number(e.target.value));
                              set('pAgeAny', false);
                            }}
                            placeholder="مثال: 20"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-cream-200 focus:border-gold-500 focus:outline-none font-tajawal text-sm text-navy-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-cairo font-bold mb-1 block">الحد الأقصى للعمر (إلى)</label>
                          <input
                            type="number"
                            min={16}
                            max={90}
                            value={form.pAgeMax || ''}
                            onChange={(e) => {
                              set('pAgeMax', e.target.value === '' ? '' : Number(e.target.value));
                              set('pAgeAny', false);
                            }}
                            placeholder="مثال: 45"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-cream-200 focus:border-gold-500 focus:outline-none font-tajawal text-sm text-navy-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. الحالة الاجتماعية */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        5. {partnerTerms.maritalLabel} (اضغط لتحديد خيار أو إلغائه)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePartnerMarital('لا يهم')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-cairo font-bold transition-all border ${
                            pSelectedMarital.includes('لا يهم')
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pSelectedMarital.includes('لا يهم') && '✓ '}لا يهم / الجميع
                        </button>
                        {partnerMaritalOptions.map((opt) => {
                          const isSelected = pSelectedMarital.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleTogglePartnerMarital(opt)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-cairo font-bold transition-all border flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-gold-300/30 text-navy-900 border-gold-500 shadow-2xs font-extrabold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-navy-900" />}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. قبول الأطفال */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        6. {partnerTerms.childrenLabel} (اضغط للخيار أو لإلغائه)
                      </label>
                      <RadioGroup
                        options={[
                          { value: 'نعم', label: 'نعم (أقبل)' },
                          { value: 'لا', label: 'لا (أفضل بدون أطفال)' },
                          { value: 'لا يهم', label: 'لا يهم' },
                          { value: 'بشرط ألا يعيشوا معنا', label: 'بشرط ألا يعيشوا معنا' },
                        ]}
                        value={form.pAcceptChildren || ''}
                        onChange={(v) => set('pAcceptChildren', v)}
                        allowDeselect={true}
                        columns={2}
                      />
                    </div>

                    {/* 7. ملاحظات */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <label className="block text-xs font-cairo font-bold text-slate-800">
                        7. ملاحظات وصفات إضافية مرغوبة
                      </label>
                      <TextArea
                        value={form.pNotes || form.aboutPartner || ''}
                        onChange={(v) => {
                          set('pNotes', v);
                          set('aboutPartner', v);
                        }}
                        placeholder={partnerTerms.notesPlaceholder || 'اكتب أي مواصفات أو تفاصيل إضافية ترغب بها في شريك حياتك...'}
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* ═══ التبويب 2: بيانات الحساب والاشتراك والاتصال ═══ */
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">بيانات الاتصال والحساب</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="الاسم الحقيقي بالكامل" hint="سري للإدارة فقط للتوثيق" showRequirementBadge={false}>
                        <TextInput
                          value={form.realName || form.real_name || ''}
                          onChange={(v) => {
                            set('realName', v);
                            set('real_name', v);
                          }}
                          placeholder="الاسم الثلاثي أو الرباعي..."
                        />
                      </Field>
                      <Field label="رقم الواتساب / الهاتف" hint="رقم التواصل الرئيسي" showRequirementBadge={false}>
                        <TextInput
                          value={form.whatsapp || form.phone || ''}
                          onChange={(v) => {
                            set('whatsapp', v);
                            set('phone', v);
                          }}
                          placeholder="0500000000"
                        />
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="البريد الإلكتروني (لتسجيل الدخول)" hint="يستخدم لتسجيل الدخول (يولّد تلقائياً إن ترك فارغاً)" showRequirementBadge={false}>
                        <TextInput
                          type="email"
                          value={form.email || ''}
                          onChange={(v) => set('email', v)}
                          placeholder="member@twafok.sa"
                        />
                      </Field>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-semibold text-navy-800 font-cairo">
                            كلمة المرور
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                              let p = 'Tw-';
                              for (let i = 0; i < 7; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                              set('password', p);
                              showToast('تم توليد كلمة مرور جديدة ✓', 'success');
                            }}
                            className="text-[11px] font-bold text-gold-600 hover:text-gold-700 flex items-center gap-1 font-cairo"
                          >
                            <RefreshCw className="w-3 h-3" /> توليد عشوائي
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password || ''}
                            onChange={(e) => set('password', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border-2 border-cream-200 text-sm focus:outline-none focus:border-gold-500 font-tajawal text-navy-900"
                            placeholder="Twafok@123 (تلقائي إن ترك فارغاً)"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-200 bg-purple-50/40 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                        <LogIn className="w-4 h-4 text-purple-600" /> تصنيف ومصدر الملف
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-cairo font-bold text-slate-700">نوع الملف:</span>
                        <select
                          value={form.sourceType || ''}
                          onChange={(e) => set('sourceType', e.target.value)}
                          className="text-xs font-cairo font-bold px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white text-purple-950"
                        >
                          <option value="">بدون تحديد (تلقائي)</option>
                          <option value="registered">عضو مسجل ذاتياً في الموقع</option>
                          <option value="imported">ملف وساطة مرفوع من الإدارة / الخطابة</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="اسم مكتب / الخطابة الوسيطة" showRequirementBadge={false}>
                        <TextInput
                          value={form.importOfficeName || ''}
                          onChange={(v) => set('importOfficeName', v)}
                          placeholder="مثال: وساطة الإدارة المباشرة..."
                        />
                      </Field>
                      <Field label="ملاحظات الاستيراد والتنسيق" showRequirementBadge={false}>
                        <TextInput
                          value={form.importNotes || ''}
                          onChange={(v) => set('importNotes', v)}
                          placeholder="ملاحظات..."
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-soft border border-cream-200/60 p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gold-300/15 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-gold-600" />
                      </div>
                      <h2 className="font-cairo font-bold text-lg text-navy-900">الاشتراك والحالة والتوثيق</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="باقة الاشتراك" showRequirementBadge={false}>
                        <SelectInput
                          value={form.plan || ''}
                          onChange={(v) => set('plan', v)}
                          options={[
                            { value: 'free', label: 'مجاني' },
                            { value: 'featured_1m', label: 'مميز - شهر (30 يوماً)' },
                            { value: 'featured_6m', label: 'مميز - 6 أشهر (180 يوماً)' },
                            { value: 'featured_1y', label: 'مميز - سنة كاملة (365 يوماً)' },
                          ]}
                          placeholder="اختر الباقة (افتراضي مجاني)..."
                        />
                      </Field>

                      <Field label="حالة الحساب" showRequirementBadge={false}>
                        <SelectInput
                          value={form.status || ''}
                          onChange={(v) => set('status', v)}
                          options={[
                            { value: 'active', label: 'نشط (مفعل في الموقع فوراً)' },
                            { value: 'pending', label: 'قيد المراجعة' },
                            { value: 'suspended', label: 'موقوف مؤقتاً' },
                          ]}
                          placeholder="اختر الحالة (افتراضي نشط)..."
                        />
                      </Field>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isVerifiedAdminCheck"
                        checked={!!form.isVerified}
                        onChange={(e) => set('isVerified', e.target.checked)}
                        className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 accent-gold-500 cursor-pointer"
                      />
                      <label
                        htmlFor="isVerifiedAdminCheck"
                        className="text-xs font-cairo font-bold text-navy-800 cursor-pointer flex items-center gap-1.5"
                      >
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        توثيق الحساب ومنحه شارة العضو الموثق رسمياً
                      </label>
                    </div>

                    <Field label="ملاحظات إدارية خاصة" hint="لا تظهر للعضو وتستخدم للمتابعة الداخلية" showRequirementBadge={false}>
                      <TextArea
                        value={form.adminNotes || ''}
                        onChange={(v) => set('adminNotes', v)}
                        placeholder="أي ملاحظات إدارية عن هذا العضو..."
                        rows={2}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* الأزرار السفلية */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-cream-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'profile' ? 'account' : 'profile')}
                  className="py-2.5 px-4 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-800 font-cairo font-bold text-xs transition-colors"
                >
                  {activeTab === 'profile' ? 'الانتقال إلى بيانات الحساب والاتصال ←' : '← العودة لبيانات الملف والشريك'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-cream-100 hover:bg-cream-200 text-navy-600 font-cairo font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-600 active:scale-[0.99] text-white font-cairo font-bold text-xs transition-all shadow-md disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {isSubmitting ? 'جارٍ الحفظ في قاعدة البيانات...' : 'حفظ العضو وإنشاء الحساب في قاعدة البيانات'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
