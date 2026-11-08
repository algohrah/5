import type { Gender } from './types';

// ====================================================================
//  واجهة العضو — مطابقة لحقول نموذج التسجيل
// ====================================================================
export interface Member {
  [key: string]: any;
  id: string;
  nickname: string;        // الاسم المستعار
  username?: string;       // اسم المستخدم / اليوزر
  gender: Gender;          // الجنس
  age: number;             // العمر
  country: string;         // الدولة
  city: string;            // المدينة
  district: string;        // المنطقة / الحي
  nationality: string;     // الجنسية
  sect: string;            // المذهب
  maritalStatus: string;   // الحالة الاجتماعية (قيمة)
  maritalLabel: string;    // الحالة الاجتماعية (نص عربي صحيح حسب الجنس)
  marriageType?: string;   // نوع الزواج (announced | misyar | both)
  marriageTypeLabel?: string; // نوع الزواج بالعربي (معلن | مسيار | لا مانع / معلن او مسيار)
  tribe?: string;          // القبيلة / النسب
  hasChildren: boolean;    // لديه أبناء
  childrenCount: string;   // عدد الأبناء
  // شخصية
  height: number;          // الطول
  weight: number;          // الوزن
  skinColor: string;       // لون البشرة
  health: string;          // الحالة الصحية
  smoking: string;         // التدخين
  ethnicity?: string;      // العرق
  // تعليم وعمل
  education: string;       // المؤهل
  workType: string;        // نوع جهة العمل
  jobTitle: string;        // المسمى الوظيفي
  housing: string;         // نوع السكن
  bio: string;             // نبذة عني
  // مواصفات الشريك
  aboutPartner: string;    // وصف الشريك المطلوب
  // حالة الحساب
  verified: boolean;       // موثق
  premium: boolean;        // عضو ذهبي/نخبة
  online: boolean;         // متصل
  lastActive: string;      // آخر ظهور
  matchScore?: number;     // نسبة التوافق
  hasSeriousnessBadge?: boolean; // وسام الجدية المعتمد
  plan?: 'free' | 'featured' | 'featured_1m' | 'featured_6m' | 'featured_1y' | string; // باقة العضو الحالية
  planDurationDays?: number; // مدة الباقة بالأيام
  planExpiresAt?: string; // تاريخ انتهاء الباقة
  pinned?: boolean; // هل العضو مثبت من الإدارة؟
  isManagedByAdmin?: boolean;
  managedByAdminId?: string;
  // ===== حقول الاستيراد =====
  sourceType?: 'registered' | 'imported';  // نوع المصدر
  importBatchId?: string;      // معرف الدفعة
  importOfficeName?: string;   // اسم الخطابة
  importDate?: string;         // تاريخ الاستيراد
  importNotes?: string;        // ملاحظات الاستيراد
  isProfileIncomplete?: boolean; // هل الملف الشخصي غير مكتمل؟
  status?: 'active' | 'suspended' | 'pending' | 'banned' | 'deleted';
  email?: string;
  phone?: string;
  whatsapp?: string;
  realName?: string;
  birthDate?: string;
  // كلمة المرور لا تُخزَّن نصاً صريحاً في بيانات العرض
  // تُخزَّن فقط عبر التسجيل وتُحجَّب داخل قاعدة البيانات المحلية
  password?: string;
}

// ===== الأعضاء التجريبيين الافتراضيين (قطريون) =====
export const MEMBERS: Member[] = [
  {
    id: 'm1',
    nickname: 'أبو عبدالله',
    username: 'abu_abdullah_qa',
    gender: 'male', age: 32,
    country: 'قطر', city: 'الدوحة', district: 'حي الدفنة',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'single', maritalLabel: 'أعزب',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 178, weight: 78, skinColor: 'أبيض قمحي',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'ماجستير', workType: 'حكومي', jobTitle: 'مهندس مدني',
    housing: 'أملك منزل',
    bio: 'مهندس طموح أحب الحياة المستقرة، أعمل في الدوحة، أبحث عن شريكة تكملني وتشاركني رحلة الحياة بإذن الله.',
    aboutPartner: 'أبحث عن شريكة متعلمة، هادئة، تحب العائلة وتطمح لبناء بيت مستقر على القيم الإسلامية.',
    verified: true, premium: true, online: true, lastActive: 'متصل الآن', matchScore: 94, hasSeriousnessBadge: true,
  },
  {
    id: 'm2',
    nickname: 'باحثة عن الستر',
    username: 'sara_qtr',
    gender: 'female', age: 27,
    country: 'قطر', city: 'الريان', district: 'حي الوعب',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'single', maritalLabel: 'عزباء',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 165, weight: 58, skinColor: 'أبيض',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'بكالوريوس', workType: 'عمل حر', jobTitle: 'معلمة',
    housing: 'أسكن مع العائلة',
    bio: 'معلمة أحب العلم والمعرفة، مقيمة بالريان، أؤمن أن الزواج شراكة عقول قبل القلوب، أبحث عن سكني ومستقر.',
    aboutPartner: 'أبحث عن رجل مثقف، ناضج، يحترم العائلة ويقدّر طموحي ويخاف الله.',
    verified: true, premium: true, online: false, lastActive: 'آخر ظهور منذ ساعة', matchScore: 96,
  },
  {
    id: 'm3',
    nickname: 'الكواري',
    username: 'fahad_alkuwari',
    gender: 'male', age: 35,
    country: 'قطر', city: 'الوكرة', district: 'حي الجبل',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'divorced', maritalLabel: 'مطلق',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 180, weight: 85, skinColor: 'حنطي',
    health: 'جيدة', smoking: 'سابقة وتركت',
    education: 'بكالوريوس', workType: 'عمل حر', jobTitle: 'رجل أعمال',
    housing: 'أملك منزل',
    bio: 'رجل أعمال ناجح في الوكرة، خبرة الحياة علّمتني الصبر والحكمة، أبحث عن شريكة تكملني بصدق.',
    aboutPartner: 'أبحث عن امرأة ناضجة، واثقة، تفهم معنى الشراكة وتقدّر الاستقرار العائلي.',
    verified: true, premium: true, online: false, lastActive: 'آخر ظهور منذ 3 ساعات', matchScore: 88, hasSeriousnessBadge: true,
  },
  {
    id: 'm4',
    nickname: 'أم محمد',
    username: 'noura_qtr',
    gender: 'female', age: 30,
    country: 'قطر', city: 'الدوحة', district: 'حي الهلال',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'divorced', maritalLabel: 'مطلقة',
    hasChildren: true, childrenCount: '1',
    height: 162, weight: 60, skinColor: 'حنطي مائل للسمار',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'دبلوم', workType: 'عمل حر', jobTitle: 'مصممة أزياء',
    housing: 'أسكن مع العائلة',
    bio: 'أم لطفل واحد، مقيمة بالدوحة، أحب الحياة العائلية، أبحث عن رجل يعرف معنى المسؤولية ويقبل ابني كابن له.',
    aboutPartner: 'أبحث عن رجل متدين، حنون، يقبل أبنائي ويبني معي حياة مستقرة ومستقيمة.',
    verified: true, premium: false, online: true, lastActive: 'متصل الآن', matchScore: 85,
  },
  {
    id: 'm5',
    nickname: 'المهندي',
    username: 'majed_almohannadi',
    gender: 'male', age: 29,
    country: 'قطر', city: 'الخور', district: 'حي الخور الساحلي',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'single', maritalLabel: 'أعزب',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 175, weight: 72, skinColor: 'أبيض قمحي',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'بكالوريوس', workType: 'حكومي', jobTitle: 'ضابط أمني',
    housing: 'أملك منزل',
    bio: 'ضابط في القطاع الحكومي بالخور، أحب الانضباط والاستقرار، أبحث عن شريكة حياة تقف بجانبي.',
    aboutPartner: 'أبحث عن فتاة طموحة، دافئة، تحب الحياة العائلية البسيطة وتخاف الله.',
    verified: true, premium: false, online: true, lastActive: 'متصل الآن', matchScore: 91, hasSeriousnessBadge: true,
  },
  {
    id: 'm6',
    nickname: 'أم عبدالرحمن',
    username: 'reem_qtr',
    gender: 'female', age: 25,
    country: 'قطر', city: 'الدوحة', district: 'حي الدفنة',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'single', maritalLabel: 'عزباء',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 168, weight: 56, skinColor: 'أبيض',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'ماجستير', workType: 'حكومي', jobTitle: 'محاضرة جامعية',
    housing: 'أسكن مع العائلة',
    bio: 'محاضرة جامعية بالدوحة شغوفة بالعلم، أؤمن أن خير البيوت من اختارها أهلها على دينها وخلقها.',
    aboutPartner: 'أبحث عن رجل متعلم، ذو خلق ودين، يحترم طموحي ويعينني على الآخرة والدنيا.',
    verified: true, premium: true, online: false, lastActive: 'آخر ظهور أمس', matchScore: 93,
  },
  {
    id: 'm7',
    nickname: 'أبو فيصل',
    username: 'sultan_almarri',
    gender: 'male', age: 40,
    country: 'قطر', city: 'الوكرة', district: 'حي الوكير',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'widower', maritalLabel: 'أرمل',
    hasChildren: true, childrenCount: '2',
    height: 172, weight: 80, skinColor: 'أسمر',
    health: 'جيدة', smoking: 'لا أدخن',
    education: 'بكالوريوس', workType: 'عمل حر', jobTitle: 'تاجر',
    housing: 'أملك منزل',
    bio: 'تاجر وأب لطفلين في الوكير، رزقني الله الصبر بعد فقد زوجتي، أبحث عن أم حنونة لأبنائي وشريكة حياة.',
    aboutPartner: 'أبحث عن امرأة صالحة، حنونة، تقبل أبنائي وتكون لهم أمًا، وتشاركني الحياة بإذن الله.',
    verified: true, premium: true, online: false, lastActive: 'آخر ظهور منذ يومين', matchScore: 82,
  },
  {
    id: 'm8',
    nickname: 'درة الدوحة',
    username: 'latifa_qtr',
    gender: 'female', age: 24,
    country: 'قطر', city: 'الدوحة', district: 'حي اللؤلؤة',
    nationality: 'قطر', sect: 'سني',
    maritalStatus: 'single', maritalLabel: 'عزباء',
    hasChildren: false, childrenCount: 'لا يوجد',
    height: 160, weight: 52, skinColor: 'أبيض جدا',
    health: 'ممتازة', smoking: 'لا أدخن',
    education: 'بكالوريوس', workType: 'باحث عن عمل', jobTitle: 'محاسبة',
    housing: 'أسكن مع العائلة',
    bio: 'محاسبة هادئة الطباع من الدوحة، أحب العائلة والاستقرار، أبحث عن شريك حياة جاد وحسن الخلق.',
    aboutPartner: 'أبحث عن رجل متدين، مستقر ماديًا، يحب العائلة ويقدّر معنى الزواج الحقيقي.',
    verified: false, premium: false, online: true, lastActive: 'متصل الآن', matchScore: 89,
  },
  {
    id: 'reg-m101',
    sourceType: 'registered',
    nickname: 'سلمان بن خالد',
    name: 'سلمان بن خالد',
    displayName: 'سلمان بن خالد',
    username: 'salman_khaled',
    gender: 'male',
    age: 35,
    country: 'قطر',
    city: 'الدوحة',
    district: 'حي الخليج الغربي',
    nationality: 'قطر',
    sect: 'سني',
    maritalStatus: 'single',
    maritalLabel: 'أعزب',
    marriageType: 'announced',
    marriageTypeLabel: 'معلن (عادي)',
    tribe: 'الهاجري',
    ethnicity: 'عربي',
    hasChildren: false,
    childrenCount: '',
    childrenLiveWith: '',
    wifeCount: '',
    seekingWife: '',
    acceptPolygamy: '',
    acceptDivorced: 'أقبل بالمطلقة',
    acceptWithChildren: 'أقبل بالأبناء بشروط',
    height: 182,
    weight: 82,
    skinColor: 'أبيض قمحي',
    health: 'ممتازة (سليم)',
    smoking: 'لا أدخن',
    education: 'ماجستير',
    workType: 'قطاع خاص',
    jobTitle: 'مدير مشاريع تقنية',
    housing: 'أملك منزل',
    bio: 'مهندس وتقني طموح، هادئ ومحافظ، أعمل مديرًا للمشاريع في إحدى كبرى الشركات بالدوحة.',
    aboutPartner: 'أبحث عن فتاة متعلمة، تخاف الله، تتمتع بحس عالي من المسؤولية والهدوء.',
    pCountry: 'قطر',
    pCity: 'الدوحة، الريان، الوكرة',
    pAgeMin: 23,
    pAgeMax: 30,
    pNationality: 'قطر',
    pMaritalStatus: 'عزباء',
    pAcceptChildren: 'لا يهم',
    pSect: 'سني',
    pEducation: 'بكالوريوس فأعلى',
    pWorkType: 'لا يهم',
    pSkinColor: 'أبيض أو حنطي',
    pHousing: 'سكن مستقل',
    pNotes: 'أن تكون ذات دين وخلق رفيع، تحب الاستقرار.',
    email: 'salman.khaled.qa@gmail.com',
    phone: '+97455987654',
    whatsapp: '+97455987654',
    realName: 'سلمان خالد الكواري',
    birthDate: '1991-05-14',
    password: null, // كلمة المرور تُحدد عند التسجيل وتُخزَّن داخل قاعدة البيانات فقط
    status: 'active',
    plan: 'featured',
    verified: true,
    premium: true,
    online: true,
    lastActive: 'متصل الآن',
    hasSeriousnessBadge: true,
    matchScore: 97,
  },
  {
    id: 'reg-f102',
    sourceType: 'registered',
    nickname: 'جوهره الدوحة',
    name: 'جوهره الدوحة',
    displayName: 'جوهره الدوحة',
    username: 'jawhara_aldoha',
    gender: 'female',
    age: 30,
    country: 'قطر',
    city: 'الدوحة',
    district: 'حي اللؤلؤة',
    nationality: 'قطر',
    sect: 'سني',
    maritalStatus: 'single',
    maritalLabel: 'عزباء',
    marriageType: 'announced',
    marriageTypeLabel: 'معلن (عادي)',
    tribe: 'الكواري',
    ethnicity: 'عربي',
    hasChildren: false,
    childrenCount: '',
    childrenLiveWith: '',
    wifeCount: '',
    seekingWife: '',
    acceptPolygamy: 'لا أقبل التعدد',
    acceptDivorced: 'أقبل بوجود سبب مقنع',
    acceptWithChildren: 'أقبل إذا كان العدد قليلاً',
    height: 166,
    weight: 59,
    skinColor: 'أبيض',
    health: 'ممتازة',
    smoking: 'لا أدخن',
    education: 'بكالوريوس',
    workType: 'حكومي',
    jobTitle: 'أخصائية جودة وتطوير',
    housing: 'أسكن مع العائلة',
    bio: 'امرأة طموحة، هادئة الطباع ومثقفة، أعمل أخصائية جودة وتطوير بالقطاع الحكومي بمدينة الدوحة.',
    aboutPartner: 'أبحث عن رجل متدين، صادق، خلوق ونبيل النفس، يملك وظيفة مستقرة.',
    pCountry: 'قطر',
    pCity: 'الدوحة',
    pAgeMin: 31,
    pAgeMax: 39,
    pNationality: 'قطر',
    pMaritalStatus: 'أعزب، مطلق',
    pAcceptChildren: 'أقبل بشروط',
    pSect: 'سني',
    pEducation: 'بكالوريوس فأعلى',
    pWorkType: 'حكومي أو قطاع خاص استقراري',
    pSkinColor: 'لا يهم',
    pHousing: 'سكن مستقل خاص',
    pNotes: 'رجل ناضج، غير مدخن، قادر على تحمل مسؤوليات الزواج.',
    email: 'jawhara.kuwari.qa@gmail.com',
    phone: '+97450112233',
    whatsapp: '+97450112233',
    realName: 'الجوهرة عبدالله الكواري',
    birthDate: '1996-09-22',
    password: null, // كلمة المرور تُحدد عند التسجيل وتُخزَّن داخل قاعدة البيانات فقط
    status: 'active',
    plan: 'featured',
    verified: true,
    premium: true,
    online: true,
    lastActive: 'متصل الآن',
    hasSeriousnessBadge: true,
    matchScore: 98,
  },
  {
    id: 'imp-88001',
    sourceType: 'imported',
    nickname: 'سارة الكواري',
    name: 'سارة الكواري',
    displayName: 'سارة الكواري (كود #88001)',
    username: 'sara_kuwari_88001',
    gender: 'female',
    age: 26,
    country: 'قطر',
    city: 'الدوحة',
    district: 'حي الدفنة',
    nationality: 'قطر',
    sect: 'سني',
    maritalStatus: 'single',
    maritalLabel: 'عزباء',
    marriageType: 'announced',
    marriageTypeLabel: 'معلن (عادي)',
    tribe: 'الكواري',
    ethnicity: 'عربي (قبيلي)',
    hasChildren: false,
    childrenCount: 'لا يوجد',
    acceptPolygamy: 'لا أقبل التعدد',
    acceptDivorced: 'أقبل بالمطلق دون أطفال',
    acceptWithChildren: 'لا أفضل ذلك',
    height: 167,
    weight: 58,
    skinColor: 'أبيض',
    health: 'ممتازة',
    smoking: 'لا تدخن',
    education: 'بكالوريوس',
    workType: 'قطاع حكومي',
    jobTitle: 'أخصائية إدارية',
    housing: 'تسكن مع الأسرة',
    bio: 'فتاة هادئة ومحافظة، ذات خلق ودين، من عائلة كريمة بالدوحة.',
    aboutPartner: 'شاب قبيلي من عائلة محترمة، أعزب أو مطلق بدون أطفال.',
    pCountry: 'قطر',
    pCity: 'الدوحة',
    pAgeMin: 27,
    pAgeMax: 35,
    pNationality: 'قطر',
    pMaritalStatus: 'أعزب، مطلق بدون أطفال',
    pAcceptChildren: 'لا أقبل',
    pSect: 'سني',
    pEducation: 'بكالوريوس فأعلى',
    pWorkType: 'موظف حكومي أو قطاع خاص مستقر',
    pSkinColor: 'أبيض أو حنطي',
    pHousing: 'سكن مستقل',
    pNotes: 'أن يكون رجل كفؤ، صاحب خلق ودين.',
    email: 'admin.imported.88001@twafok.com',
    phone: '+97455588001',
    whatsapp: '+97455588001',
    realName: 'سارة بنت تميم الكواري',
    birthDate: '2000-01-15',
    importOfficeName: 'أم فهد (وساطة وتنسيق الإدارة)',
    importBatchId: 'batch-khataaba-01',
    importDate: '2026-09-10',
    status: 'active',
    plan: 'featured',
    verified: false,
    premium: true,
    online: false,
    lastActive: 'مرفوع عبر وساطة الإدارة',
    hasSeriousnessBadge: true,
    matchScore: 96,
  },
  {
    id: 'imp-88002',
    sourceType: 'imported',
    nickname: 'المهندس عبدالعزيز',
    name: 'المهندس عبدالعزيز',
    displayName: 'المهندس عبدالعزيز (كود #88002)',
    username: 'eng_abdulaziz_88002',
    gender: 'male',
    age: 33,
    country: 'قطر',
    city: 'الريان',
    district: 'حي الوعب',
    nationality: 'قطر',
    sect: 'سني',
    maritalStatus: 'single',
    maritalLabel: 'أعزب',
    marriageType: 'announced',
    marriageTypeLabel: 'معلن (عادي)',
    tribe: 'الهاجري',
    ethnicity: 'عربي (قبيلي)',
    hasChildren: false,
    childrenCount: 'لا يوجد',
    acceptPolygamy: 'لا أرغب بالتعدد',
    acceptDivorced: 'أقبل بالمطلقة',
    acceptWithChildren: 'أقبل بطفل واحد كحد أقصى',
    height: 180,
    weight: 79,
    skinColor: 'حنطي فاتح',
    health: 'ممتازة ورياضي',
    smoking: 'لا أدخن',
    education: 'ماجستير هندسة نظم',
    workType: 'قطاع شبه حكومي',
    jobTitle: 'مهندس أول مشاريع',
    housing: 'أملك شقة تمليك مؤثثة بالكامل',
    bio: 'مهندس شاب طموح، هادئ ومحافظ، أعمل بالدوحة، جاهز ومستعد ماديًا للزواج.',
    aboutPartner: 'فتاة ذات دين وخلق وأصل طيب، عمرها بين 22 و 29 سنة.',
    pCountry: 'قطر',
    pCity: 'الدوحة أو الريان أو الوكرة',
    pAgeMin: 22,
    pAgeMax: 29,
    pNationality: 'قطر',
    pMaritalStatus: 'عزباء أو مطلقة بدون أطفال',
    pAcceptChildren: 'لا أفضل',
    pSect: 'سني',
    pEducation: 'جامعية',
    pWorkType: 'لا يهم',
    pSkinColor: 'بيضاء أو حنطية',
    pHousing: 'سكن مستقل',
    pNotes: 'ذات أصل وخلق، حسنة المظهر والتعامل.',
    email: 'admin.imported.88002@twafok.com',
    phone: '+97455588002',
    whatsapp: '+97455588002',
    realName: 'عبدالعزيز خالد الهاجري',
    birthDate: '1993-04-10',
    importOfficeName: 'أم سعود (وساطة وتنسيق الإدارة)',
    importBatchId: 'batch-khataaba-01',
    importDate: '2026-09-10',
    status: 'active',
    plan: 'featured',
    verified: true,
    premium: true,
    online: true,
    lastActive: 'مرفوع عبر وساطة الإدارة',
    hasSeriousnessBadge: true,
    matchScore: 98,
  },
];

// يقرأ تعديلات الإدارة المحفوظة (saved_members_list) أولاً
// ثم يسقط للقائمة الأصلية.
export function getMemberById(id: string): Member | undefined {
  let member: Member | undefined;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('saved_members_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const found = parsed.find((m: Member) => m.id === id);
          if (found) member = found;
        }
      }
    } catch { /* تجاهل */ }
  }
  if (!member) {
    member = MEMBERS.find((m) => m.id === id);
  }
  // التحقق من حالة العضو — إخفاء المحذوفين والمحظورين
  if (member && typeof window !== 'undefined') {
    try {
      const metaRaw = localStorage.getItem('twafok_admin_meta_v1');
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        const m = meta[member.id];
        if (m) {
          if (m.deleted) return undefined;
          if (m.status && m.status !== 'active') return undefined;
        }
        if (member.status && member.status !== 'active') return undefined;
      }
    } catch { /* تجاهل */ }
  }
  return member;
}
