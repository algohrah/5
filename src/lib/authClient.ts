// ====================================================================
//  عميل المصادقة المحلي — بديل عميل قاعدة البيانات المحلية بالكامل
//  ملاحظة: مصادقة الإدارة تتم بشكل مستقل في AdminLayout عبر verifyLocalAdmin
//  هذا الملف يتعامل فقط مع الأعضاء العاديين
// ====================================================================

import { MEMBERS } from './members';

const ADMIN_EMAIL_LOCAL = 'admin@tawafok.com';

type LocalSession = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
};

const AUTH_KEY = 'twafok_local_auth_session';

function readSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(session: LocalSession | null) {
  if (typeof window === 'undefined') return;
  if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent('local-auth-changed', { detail: session }));
}

export function makeSession(email: string, userId?: string): LocalSession {
  let encoded = '';
  try { encoded = typeof btoa === 'function' ? btoa(encodeURIComponent(email || '')) : ''; } catch { encoded = ''; }
  return {
    access_token: `local-token-${encoded}-${Date.now()}`,
    refresh_token: `local-refresh-${encoded}-${Date.now()}`,
    user: { id: userId || email || 'local-user', email: email || 'user@tawafok.com' },
  };
}

const createDummyChannel = () => {
  const dummy: any = {
    on: (..._args: any[]) => dummy,
    subscribe: (..._args: any[]) => dummy,
    unsubscribe: (..._args: any[]) => dummy,
  };
  return dummy;
};

const createDummyQuery = () => {
  let lastPayload: any = null;
  const dummy: any = {
    select: () => dummy, insert: (v: any) => { lastPayload = v; return dummy; },
    upsert: (v: any) => { lastPayload = v; return dummy; }, update: (v: any) => { lastPayload = v; return dummy; },
    delete: () => dummy, eq: () => dummy, neq: () => dummy, gt: () => dummy, gte: () => dummy,
    lt: () => dummy, lte: () => dummy, like: () => dummy, ilike: () => dummy, is: () => dummy,
    in: () => dummy, contains: () => dummy, containedBy: () => dummy, range: () => dummy,
    textSearch: () => dummy, match: () => dummy, not: () => dummy, or: () => dummy,
    filter: () => dummy, order: () => dummy, limit: () => dummy, offset: () => dummy,
    csv: () => dummy, returns: () => dummy,
    rollback: async () => ({ data: Array.isArray(lastPayload) ? (lastPayload[0] || {}) : (lastPayload || {}), error: null }),
    single: async () => ({ data: Array.isArray(lastPayload) ? (lastPayload[0] || {}) : (lastPayload || {}), error: null }),
    maybeSingle: async () => ({ data: Array.isArray(lastPayload) ? (lastPayload[0] || null) : (lastPayload || null), error: null }),
    then: (resolve: any, reject: any) => {
      const resultData = Array.isArray(lastPayload) ? lastPayload : lastPayload ? [lastPayload] : [];
      return Promise.resolve({ data: resultData, error: null }).then(resolve, reject);
    },
    catch: (reject: any) => Promise.resolve({ data: [], error: null }).catch(reject),
  };
  return new Proxy(dummy, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'symbol' || prop === 'inspect' || prop === 'valueOf' || prop === 'toString') return undefined;
      return (arg: any) => { if (arg !== undefined) lastPayload = arg; return target; };
    },
  });
};

const authClient = {
  auth: {
    getSession: async () => ({ data: { session: readSession() }, error: null }),
    onAuthStateChange: (callback: (_event: string, session: LocalSession | null) => void) => {
      const handler = (event: Event) => callback('LOCAL_AUTH_CHANGED', (event as CustomEvent).detail ?? readSession());
      window.addEventListener('local-auth-changed', handler);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('local-auth-changed', handler) } } };
    },
    createSessionForEmail: (email: string, userId?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const session = makeSession(cleanEmail, userId);
      saveSession(session);
      return { data: { user: session.user, session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (!email.includes('@') || password.length < 6) {
        return { data: { user: null, session: null }, error: new Error('بيانات الدخول غير صحيحة') };
      }
      const cleanEmail = email.trim().toLowerCase();

      // السماح للمدير بالمرور مباشرة — التحقق من كلمة المرور تم مسبقاً في verifyLocalAdmin
      if (cleanEmail === ADMIN_EMAIL_LOCAL) {
        const session = makeSession(cleanEmail, 'admin-1');
        saveSession(session);
        return { data: { user: session.user, session }, error: null };
      }

      // 1. الاستعلام المباشر من خادم Hostinger MySQL أولاً (لتسجيل الدخول من أي هاتف أو جهاز جديد)
      try {
        const apiRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        }).catch(() => null);

        if (apiRes) {
          if (apiRes.ok) {
            const resData = await apiRes.json();
            if (resData.success && resData.user) {
              const session = makeSession(cleanEmail, resData.user.id || resData.user.member_code);
              saveSession(session);
              // حفظ كائن العضو محلياً لتسريع الوصول في الجلسة
              try {
                localStorage.setItem('twafok_current_user', JSON.stringify(resData.user));
              } catch { /* ignore */ }
              return { data: { user: session.user, session }, error: null };
            }
          } else if (apiRes.status === 401) {
            return { data: { user: null, session: null }, error: new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة') };
          }
        }
      } catch { /* متابعة للبحث المحلي في حال عدم توفر الشبكة */ }

      // 2. البحث في الذاكرة المحلية كخيار بديل عند انقطاع الاتصال بالإنترنت
      try {
        const savedMembers = JSON.parse(localStorage.getItem('saved_members_list') || '[]');
        const savedAdminMembers = JSON.parse(localStorage.getItem('saved_admin_members_list') || '[]');
        const twafokMembers = JSON.parse(localStorage.getItem('twafok_members') || '[]');
        const allList = [
          ...(Array.isArray(savedMembers) ? savedMembers : []),
          ...(Array.isArray(savedAdminMembers) ? savedAdminMembers : []),
          ...(Array.isArray(twafokMembers) ? twafokMembers : []),
          ...(Array.isArray(MEMBERS) ? MEMBERS : []),
        ];

        const member = allList.find((m: any) => m.email?.toLowerCase().trim() === cleanEmail);
        if (!member) {
          return { data: { user: null, session: null }, error: new Error('لا يوجد حساب بهذا البريد الإلكتروني') };
        }
        if (member.password && member.password !== password) {
          return { data: { user: null, session: null }, error: new Error('كلمة المرور غير صحيحة') };
        }
      } catch { /* ignore */ }

      const session = makeSession(cleanEmail);
      saveSession(session);
      return { data: { user: session.user, session }, error: null };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      if (!email.includes('@') || password.length < 6) {
        return { data: { user: null, session: null }, error: new Error('البريد أو كلمة المرور غير صحيحة. كلمة المرور يجب أن تكون 6 أحرف على الأقل') };
      }
      try {
        const savedMembers = JSON.parse(localStorage.getItem('saved_members_list') || '[]');
        const savedAdminMembers = JSON.parse(localStorage.getItem('saved_admin_members_list') || '[]');
        const twafokMembers = JSON.parse(localStorage.getItem('twafok_members') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        const allList = [
          ...(Array.isArray(savedMembers) ? savedMembers : []),
          ...(Array.isArray(savedAdminMembers) ? savedAdminMembers : []),
          ...(Array.isArray(twafokMembers) ? twafokMembers : []),
          ...(Array.isArray(MEMBERS) ? MEMBERS : []),
        ];
        const existing = allList.find((m: any) => m.email?.toLowerCase().trim() === cleanEmail);
        if (existing) {
          return { data: { user: null, session: null }, error: new Error('يوجد حساب مسجل بهذا البريد الإلكتروني مسبقاً') };
        }
      } catch { /* ignore */ }
      const session = makeSession(email);
      saveSession(session);
      return { data: { user: session.user, session }, error: null };
    },
    signOut: async () => { saveSession(null); return { error: null }; },
    resetPasswordForEmail: async (email?: string, _options?: any) => {
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        const session = makeSession(cleanEmail);
        saveSession(session);
      }
      return { data: {}, error: null };
    },
    updateUser: async (attributes?: { password?: string; [key: string]: any }) => {
      if (attributes?.password) {
        const session = readSession();
        const email = session?.user?.email?.toLowerCase().trim();
        if (email) {
          try {
            const updateList = (key: string) => {
              const raw = localStorage.getItem(key);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  let changed = false;
                  const updated = list.map((m: any) => {
                    if (m.email?.toLowerCase().trim() === email) {
                      changed = true;
                      return { ...m, password: attributes.password };
                    }
                    return m;
                  });
                  if (changed) {
                    localStorage.setItem(key, JSON.stringify(updated));
                  }
                }
              }
            };
            updateList('saved_members_list');
            updateList('twafok_members');
            updateList('saved_admin_members_list');
          } catch { /* ignore */ }
        }
      }
      return { data: {}, error: null };
    },
    setSession: async ({ access_token, refresh_token }: { access_token?: string; refresh_token?: string }) => {
      const session: LocalSession = {
        access_token: access_token || `local-token-${Date.now()}`,
        refresh_token: refresh_token || `local-refresh-${Date.now()}`,
        user: { id: 'google-local-user', email: 'google.local@tawafok.com' },
      };
      saveSession(session);
      return { data: { session }, error: null };
    },
    signInWithIdToken: async (_params?: { provider?: string; token?: string; [key: string]: any }) => {
      const session = makeSession('google.local@tawafok.com');
      saveSession(session);
      return { data: { session }, error: null };
    },
  },
  channel: (_name: string) => createDummyChannel(),
  removeChannel: (_ch: any) => {},
  from: (_table: string) => createDummyQuery(),
};

export const cloudSyncEnabled = false;
export default authClient;
