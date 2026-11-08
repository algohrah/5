// مصادقة الإدارة — مستقلة تماماً عن قاعدة بيانات الأعضاء
import { DEMO_ADMIN_PASSWORD } from './constants';

const ADMIN_EMAIL = 'admin@tawafok.com';
const ADMIN_CRED_KEY = 'twafok_admin_credentials';

export type AdminCredentials = { email: string; passwordHash: string };

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// يقارن البريد مباشرةً مع الثابت — لا يعتمد على localStorage
export async function isLocalAdminEmail(email: string): Promise<boolean> {
  const clean = (email || '').trim().toLowerCase();
  return clean === ADMIN_EMAIL;
}

// يتحقق من كلمة المرور مقابل DEMO_ADMIN_PASSWORD الحالية مباشرةً
export async function verifyLocalAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const currentHash = await sha256Hex(DEMO_ADMIN_PASSWORD);
  const inputHash = await sha256Hex(password);
  // محاولة من localStorage أيضاً (إذا غيّر المدير كلمته من لوحة الإعدادات)
  try {
    const raw = localStorage.getItem(ADMIN_CRED_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as AdminCredentials;
      if (stored?.passwordHash && inputHash === stored.passwordHash) return true;
    }
  } catch { /* ignore */ }
  return inputHash === currentHash;
}

export async function verifyLocalAdmin(email: string, password: string): Promise<boolean> {
  if (!(await isLocalAdminEmail(email))) return false;
  return verifyLocalAdminPassword(password);
}
