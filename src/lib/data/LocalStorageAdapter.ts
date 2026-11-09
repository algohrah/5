import { IRepository, IDatabaseAdapter, ISettingsRepository } from './interfaces';
import * as localStore from './adapters/local/localStore';
import * as verificationStore from './adapters/local/verificationStore';
import * as geoStore from './adapters/local/geoStore';
import {
  SECTS as DEFAULT_SECTS,
  SKIN_COLORS as DEFAULT_SKIN_COLORS,
  EDUCATION_LEVELS as DEFAULT_EDUCATION_LEVELS,
  WORK_TYPES as DEFAULT_WORK_TYPES,
  HOUSING_TYPES as DEFAULT_HOUSING_TYPES,
  SMOKING_OPTIONS as DEFAULT_SMOKING_OPTIONS,
  MARITAL_MALE as DEFAULT_MARITAL_MALE,
  MARITAL_FEMALE as DEFAULT_MARITAL_FEMALE,
  NATIONALITIES,
} from '../constants';

// ============================================================
//  LocalStorage Adapter — التخزين المحلي عبر المتصفح
//  هذا هو الملف الوحيد المسموح له بالوصول المباشر لـ window.localStorage
// ============================================================

export class LocalStorageRepository<T extends { id: string | number }> implements IRepository<T> {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  private getItems(): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveItems(items: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (e) {
      console.error(`Error saving to localStorage [${this.storageKey}]:`, e);
    }
  }

  async getAll(): Promise<T[]> {
    return this.getItems();
  }

  async getById(id: string | number): Promise<T | null> {
    const items = this.getItems();
    const item = items.find((i) => i.id == id);
    return item || null;
  }

  async create(item: T): Promise<T> {
    const items = this.getItems();
    items.push(item);
    this.saveItems(items);
    return item;
  }

  async update(id: string | number, payload: Partial<T>): Promise<T> {
    const items = this.getItems();
    const index = items.findIndex((i) => i.id == id);
    if (index === -1) {
      // إذا لم يكن العنصر موجوداً في هذا الجدول ونحن في جدول الأعضاء، نجرب تحديثه في localStore
      if (this.storageKey === 'twafok_members') {
        localStore.adminUpdateMember(String(id), payload as any).catch(() => undefined);
      }
      throw new Error(`Item with id ${id} not found.`);
    }
    const updatedItem = { ...items[index], ...payload };
    items[index] = updatedItem;
    this.saveItems(items);

    if (this.storageKey === 'twafok_members') {
      localStore.adminUpdateMember(String(id), payload as any).catch(() => undefined);
    }
    return updatedItem;
  }

  async delete(id: string | number): Promise<boolean> {
    const items = this.getItems();
    const initialLength = items.length;
    const filteredItems = items.filter((i) => i.id != id);
    if (filteredItems.length === initialLength) {
      return false;
    }
    this.saveItems(filteredItems);
    return true;
  }
}

/**
 * مستودع الإعدادات عبر localStorage.
 * المنفذ الوحيد المسموح له بالقراءة/الكتابة المباشرة في localStorage.
 */
export class LocalStorageSettingsRepository implements ISettingsRepository {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
      if (typeof fetch !== 'undefined') {
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        }).catch(() => null);
      }
    } catch (e) {
      console.error(`Error setting localStorage key [${key}]:`, e);
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* تجاهل */
    }
  }
}

export class LocalStorageAdapter implements IDatabaseAdapter {
  members: IRepository<any> = new LocalStorageRepository<any>('twafok_members');
  requests: IRepository<any> = new LocalStorageRepository<any>('twafok_requests');
  transactions: IRepository<any> = new LocalStorageRepository<any>('twafok_transactions');
  tickets: IRepository<any> = new LocalStorageRepository<any>('twafok_tickets');
  adminUsers: IRepository<any> = new LocalStorageRepository<any>('twafok_admin_users');
  settings: ISettingsRepository = new LocalStorageSettingsRepository();

  // ===== الأعضاء (Members) =====
  getMembers = () => localStore.getMembers();
  getLiveMembers = (includeInactiveAndDeleted?: boolean) => localStore.getLiveMembers(includeInactiveAndDeleted);
  getLiveMemberById = (id: string) => localStore.getLiveMemberById(id);
  getCurrentUserId = () => localStore.getCurrentUserId();
  setCurrentUserId = (id: string) => localStore.setCurrentUserId(id);
  hasUserPaidDepositAnywhere = (userId: string) => localStore.hasUserPaidDepositAnywhere(userId);

  // ===== محول الطلبات والرحلات (Requests & Journeys - متزامن لحظياً مع Hostinger MySQL) =====
  private mapDbRequest(r: any): any {
    if (!r) return null;
    const stage = r.stage || r.journey_stage || 'sent';
    let status = r.status || 'pending';
    if (stage === 'sent' || stage === 'pending') status = 'pending';
    else if (stage === 'accepted' || stage === 'seriousness') status = 'accepted_pending_payment';
    else if (stage === 'coordination' || stage === 'sharia_viewing' || stage === 'engagement') status = 'in_mediation';
    else if (stage === 'completed') status = 'completed';
    else if (stage === 'declined') status = 'declined';
    else if (stage === 'cancelled') status = 'cancelled';

    if (r.sender_paid && r.receiver_paid && status === 'accepted_pending_payment') {
      status = 'paid';
    }

    return {
      id: Number(r.id),
      request_number: Number(r.id),
      requestNumber: Number(r.id),
      requestCode: r.request_code || `REQ-${r.id}`,
      request_code: r.request_code || `REQ-${r.id}`,
      sender_id: String(r.sender_id),
      receiver_id: String(r.receiver_id),
      senderId: String(r.sender_id),
      receiverId: String(r.receiver_id),
      status,
      stage,
      journey_stage: stage,
      message: r.message || 'طلب توافق واهتمام مرسل عبر المنصة',
      sender_paid: Boolean(r.sender_paid),
      receiver_paid: Boolean(r.receiver_paid),
      senderPaid: Boolean(r.sender_paid),
      receiverPaid: Boolean(r.receiver_paid),
      sender_paid_amount: Number(r.sender_paid_amount) || 0,
      receiver_paid_amount: Number(r.receiver_paid_amount) || 0,
      total_fee: Number(r.total_fee) || 5000,
      totalFee: Number(r.total_fee) || 5000,
      deposit_fee: Number(r.deposit_amount) || 1000,
      deposit_amount: Number(r.deposit_amount) || 1000,
      depositAmount: Number(r.deposit_amount) || 1000,
      admin_notes: r.admin_notes || '',
      adminNotes: r.admin_notes || '',
      meeting_date: r.meeting_date || '',
      meetingDate: r.meeting_date || '',
      meeting_notes: r.meeting_notes || '',
      meetingNotes: r.meeting_notes || '',
      decline_reason: r.decline_reason || '',
      declineReason: r.decline_reason || '',
      cancel_reason: r.cancel_reason || '',
      cancelReason: r.cancel_reason || '',
      created_at: r.created_at || new Date().toISOString(),
      createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      updated_at: r.updated_at || r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
      source_type: 'registered',
      sourceType: 'registered',
    };
  }

  getRequests = async (userId?: string): Promise<any[]> => {
    if (typeof fetch !== 'undefined') {
      try {
        const url = '/api/requests' + (userId ? `?userId=${encodeURIComponent(userId)}` : '');
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && Array.isArray(data.requests)) {
            let mapped = data.requests.map((r: any) => this.mapDbRequest(r)).filter(Boolean);
            if (userId) {
              const uStr = String(userId);
              mapped = mapped.filter((r: any) => r.sender_id === uStr || r.receiver_id === uStr);
            }
            return mapped;
          }
        }
      } catch (err) {
        console.warn('[Requests API fallback]:', err);
      }
    }
    return localStore.getRequests(userId);
  };

  getRequest = async (id: number): Promise<any | null> => {
    const list = await this.getRequests();
    const found = list.find((r) => Number(r.id) === Number(id));
    if (found) return found;
    return localStore.getRequest(id);
  };

  createRequest = async (senderId: string, receiverId: string, message: string): Promise<any> => {
    // 1. إرسال الطلب فورياً لخادم MySQL لضمان المزامنة المباشرة بين الأجهزة
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId,
            receiverId,
            message,
            status: 'pending',
            stage: 'sent',
          }),
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.success) {
            // حفظ نسخة محلية للتفاعل الفوري
            const localRes = await localStore.createRequest(senderId, receiverId, message);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('twafok_request_created', { detail: { senderId, receiverId } }));
              window.dispatchEvent(new CustomEvent('twafok_notification_update'));
            }
            return {
              ok: true,
              request: {
                id: data.id || (localRes as any)?.data?.id || (localRes as any)?.requestId || 1,
                requestCode: data.requestCode,
                sender_id: senderId,
                receiver_id: receiverId,
                journey_stage: 'sent',
                status: 'pending',
                message,
              },
            };
          }
        }
      } catch (err) {
        console.warn('[Create Request API]:', err);
      }
    }
    return localStore.createRequest(senderId, receiverId, message);
  };

  runRequestAction = async (requestId: number, action: string, actorId: string, payload?: any): Promise<any> => {
    if (typeof fetch !== 'undefined') {
      fetch(`/api/requests/${requestId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, actorId, payload }),
      }).catch(() => null);
    }
    const res = await localStore.runRequestAction(requestId, action, actorId, payload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('twafok_notification_update'));
    }
    return res;
  };

  getEvents = (requestId: number) => localStore.getEvents(requestId);
  isRequestUnseen = (requestId: number, updatedAt?: string | null, userId?: string) => localStore.isRequestUnseen(requestId, updatedAt, userId);
  markRequestSeen = (requestId: number, userId?: string) => localStore.markRequestSeen(requestId, userId);
  markAllRequestsSeen = (userId?: string) => localStore.markAllRequestsSeen(userId);
  getUnseenRequestsCount = (userId?: string) => localStore.getUnseenRequestsCount(userId);
  markRequestNotificationsRead = (requestId: number, userId?: string) => localStore.markRequestNotificationsRead(requestId, userId);

  // ===== توجيهات الإدارة وتوافق مخطط قديم؛ شراء/إرسال الأعضاء معطل نهائيًا =====
  getUserInquiryBalance = (userId: string) => localStore.getUserInquiryBalance(userId);
  consumeUserInquiryMessage = (userId: string) => localStore.consumeUserInquiryMessage(userId);
  getInquiry = (requestId: number) => localStore.getInquiry(requestId);
  initializeInquiry = (requestId: number, userId: string) => localStore.initializeInquiry(requestId, userId);
  buyInquiry = (requestId: number, ownerId: string) => localStore.buyInquiry(requestId, ownerId);
  buyMessagePackageCustom = (userId: string, credits: number, price: number, _requestId?: number, _skipTransactionRecord?: boolean) => localStore.buyMessagePackageCustom(userId, credits, price);
  sendInquiry = (requestId: number, senderId: string, text: string) => localStore.sendInquiry(requestId, senderId, text);
  simulateReply = (requestId: number, replierId: string, text: string) => localStore.simulateReply(requestId, replierId, text);
  getAllInquiryMessages = () => localStore.getAllInquiryMessages();
  moderateInquiryMessage = (messageId: number, action: 'approve' | 'reject', moderatorName: string) => localStore.moderateInquiryMessage(messageId, action, moderatorName);
  updateInquiryMessage = (messageId: number, newText: string) => localStore.updateInquiryMessage(messageId, newText);
  deleteInquiryMessage = (messageId: number) => localStore.deleteInquiryMessage(messageId);

  // ===== الإشعارات الفورية والمزامنة بين الأجهزة (Notifications) =====
  getJourneyNotifications = async (userId: string): Promise<any[]> => {
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`).catch(() => null);
        if (res && res.ok) {
          const rows = await res.json().catch(() => null);
          if (Array.isArray(rows)) {
            return rows.map((n: any) => ({
              id: Number(n.id),
              user_id: String(n.member_id),
              type: n.type || 'system',
              title: n.title || 'إشعار من المنصة',
              text: n.message || '',
              href: n.link_url || '/notifications',
              read: Boolean(n.is_read),
              created_at: n.created_at || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('[Notifications API fallback]:', err);
      }
    }
    return localStore.getJourneyNotifications(userId);
  };

  markNotificationRead = async (id: number): Promise<void> => {
    if (typeof fetch !== 'undefined') {
      fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => null);
    }
    return localStore.markNotificationRead(id);
  };

  markAllNotificationsRead = async (userId: string): Promise<void> => {
    if (typeof fetch !== 'undefined') {
      fetch(`/api/notifications/read-all?userId=${encodeURIComponent(userId)}`, { method: 'PUT' }).catch(() => null);
    }
    return localStore.markAllNotificationsRead(userId);
  };

  getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const list = await this.getJourneyNotifications(userId);
    return list.filter((n) => !n.read).length;
  };

  getActionableRequestsCount = (userId: string): Promise<number> => localStore.getActionableRequestsCount(userId);

  deleteNotification = async (id: number): Promise<void> => {
    if (typeof fetch !== 'undefined') {
      fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => null);
    }
    return localStore.deleteNotification(id);
  };

  // ===== لوحة الإدارة (Admin Panel Operations) =====
  adminGetMembers = async () => {
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/members?include_inactive=true&limit=5000').catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && Array.isArray(data.members) && data.members.length > 0) {
            // تحويل أعضاء MySQL إلى كائنات متوافقة مع لوحة الإدارة وتحديث الذاكرة
            const mapped = data.members.map((m: any) => ({
              id: String(m.id || m.member_code),
              member_code: m.member_code,
              nickname: m.nickname || m.full_name || 'عضو',
              realName: m.real_name || m.full_name || '',
              username: m.username || m.member_code || '',
              email: m.email || '',
              phone: m.phone || m.whatsapp || '',
              whatsapp: m.whatsapp || m.phone || '',
              password: m.password_hash || m.password || '123456',
              gender: m.gender || 'male',
              age: Number(m.age) || 25,
              country: m.country || 'قطر',
              city: m.city || 'الدوحة',
              district: m.district || '',
              nationality: m.nationality || 'قطري',
              maritalStatus: m.marital_status || 'single',
              marriageType: m.marriage_type || 'announced',
              verified: Boolean(m.is_verified),
              premium: Boolean(m.is_featured),
              status: m.is_active ? 'active' : 'suspended',
              plan: m.plan_id || 'free',
              sourceType: m.source_type || 'registered',
              bio: m.bio || '',
              aboutPartner: m.partner_requirements || '',
              height: Number(m.height) || null,
              weight: Number(m.weight) || null,
              skinColor: m.skin_color || '',
              health: m.health || '',
              smoking: m.smoking || 'no',
              education: m.education || '',
              workType: m.work_type || '',
              jobTitle: m.occupation || '',
              housing: m.housing_type || '',
              tribe: m.tribe || '',
              ethnicity: m.ethnicity || '',
              details: typeof m.details === 'string' ? JSON.parse(m.details || '{}') : (m.details || {}),
              joinedAt: m.created_at ? new Date(m.created_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA'),
            }));
            return mapped;
          }
        }
      } catch (e) {
        console.warn('[AdminGetMembers] API fallback:', e);
      }
    }
    return localStore.adminGetMembers();
  };
  adminUpdateMember = (id: string, fields: any) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/' + encodeURIComponent(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      }).catch(() => null);
    }
    return localStore.adminUpdateMember(id, fields);
  };
  adminBulkDeleteMembers = (ids: string[]) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' }),
      }).catch(() => null);
    }
    return localStore.adminBulkDeleteMembers(ids);
  };
  adminBulkUpdateStatus = (ids: string[], status: any, reason?: string, by?: string) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'update_status', status }),
      }).catch(() => null);
    }
    return localStore.adminBulkUpdateStatus(ids, status, reason, by);
  };
  adminBulkSetVerified = (ids: string[], value: boolean) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: value ? 'verify' : 'unverify' }),
      }).catch(() => null);
    }
    return localStore.adminBulkSetVerified(ids, value);
  };
  adminBulkSetPinned = (ids: string[], value: boolean) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'feature' }),
      }).catch(() => null);
    }
    return localStore.adminBulkSetPinned(ids, value);
  };
  adminBulkSetPlan = (ids: string[], plan: string) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'set_plan', plan }),
      }).catch(() => null);
    }
    return localStore.adminBulkSetPlan(ids, plan);
  };
  adminBulkSetSeriousnessBadge = (ids: string[], value: boolean) => localStore.adminBulkSetSeriousnessBadge(ids, value);
  adminDeleteMember = (id: string) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => null);
    }
    return localStore.adminDeleteMember(id);
  };
  adminHardDeleteMember = (id: string) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/members/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => null);
    }
    return localStore.adminHardDeleteMember(id);
  };
  adminResetPassword = (id: string) => localStore.adminResetPassword(id);
  adminToggleVerified = (id: string, value: boolean) => localStore.adminToggleVerified(id, value);
  adminSetPremium = (id: string, value: boolean) => localStore.adminSetPremium(id, value);
  adminSetNote = (id: string, note: string) => localStore.adminSetNote(id, note);
  adminToggleFlag = (id: string, value: boolean) => localStore.adminToggleFlag(id, value);
  adminSendNotification = async (id: string, text: string, title?: string) => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: id,
          type: 'admin',
          title: title || 'رسالة من الإدارة',
          message: text,
        }),
      }).catch(() => null);
    }
    return localStore.adminSendNotification(id, text, title);
  };

  adminSendBulkNotifications = async (userIds: string[], text: string, title?: string) => {
    if (typeof fetch !== 'undefined') {
      userIds.forEach((uid) => {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: uid,
            type: 'admin',
            title: title || 'إشعار من الإدارة',
            message: text,
          }),
        }).catch(() => null);
      });
    }
    return localStore.adminSendBulkNotifications(userIds, text, title);
  };

  adminDeleteRequest = async (requestId: number) => {
    if (typeof fetch !== 'undefined') {
      fetch(`/api/requests/${requestId}`, { method: 'DELETE' }).catch(() => null);
    }
    return localStore.adminDeleteRequest(requestId);
  };

  archiveRequest = (requestId: number, userId: string) => localStore.archiveRequest(requestId, userId);
  unarchiveRequest = (requestId: number, userId: string) => localStore.unarchiveRequest(requestId, userId);
  hideRequestFromUser = (requestId: number, userId: string) => localStore.hideRequestFromUser(requestId, userId);
  adminGrantSeriousnessBadge = (id: string) => localStore.adminGrantSeriousnessBadge(id);
  adminRevokeSeriousnessBadge = (id: string) => localStore.adminRevokeSeriousnessBadge(id);

  adminGetRequests = async () => {
    return this.getRequests();
  };

  adminGetStats = async () => {
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/stats').catch(() => null);
        if (res && res.ok) {
          const stats = await res.json().catch(() => null);
          if (stats && stats.source === 'mysql') {
            return stats;
          }
        }
      } catch (err) {
        console.warn('[Stats API fallback]:', err);
      }
    }

    // حساب إحصائيات حية متسقة مباشرة من قائمة الأعضاء الحقيقية المجلوبة
    const members = await this.adminGetMembers();
    const requests = await this.getRequests();
    const activeCount = members.filter((m: any) => m.status === 'active' || !m.status).length;
    const pendingCount = members.filter((m: any) => m.status === 'pending').length;
    const verifiedCount = members.filter((m: any) => m.verified).length;
    const premiumCount = members.filter((m: any) => m.premium || m.plan === 'featured').length;
    const maleCount = members.filter((m: any) => m.gender === 'male').length;
    const femaleCount = members.filter((m: any) => m.gender === 'female').length;

    const pendingRequests = requests.filter((r: any) => r.status === 'pending' || r.stage === 'sent').length;
    const activeJourneys = requests.filter((r: any) => !['sent', 'completed', 'declined', 'cancelled'].includes(r.stage || r.journey_stage)).length;
    const completedCount = requests.filter((r: any) => (r.stage || r.journey_stage) === 'completed').length;
    const declinedCount = requests.filter((r: any) => (r.stage || r.journey_stage) === 'declined').length;
    const cancelledCount = requests.filter((r: any) => (r.stage || r.journey_stage) === 'cancelled').length;

    let depositsPaid = 0;
    requests.forEach((r: any) => {
      if (r.sender_paid || r.senderPaid) depositsPaid++;
      if (r.receiver_paid || r.receiverPaid) depositsPaid++;
    });

    const stageBreakdown: Record<string, number> = {
      sent: pendingRequests,
      accepted: requests.filter((r: any) => (r.stage || r.journey_stage) === 'accepted').length,
      seriousness: requests.filter((r: any) => (r.stage || r.journey_stage) === 'seriousness').length,
      coordination: requests.filter((r: any) => (r.stage || r.journey_stage) === 'coordination').length,
      sharia_viewing: requests.filter((r: any) => (r.stage || r.journey_stage) === 'sharia_viewing').length,
      engagement: requests.filter((r: any) => (r.stage || r.journey_stage) === 'engagement').length,
      completed: completedCount,
      declined: declinedCount,
      cancelled: cancelledCount,
    };

    return {
      totalMembers: members.length,
      activeMembers: activeCount,
      pendingMembers: pendingCount,
      suspendedMembers: 0,
      bannedMembers: 0,
      verified: verifiedCount,
      premium: premiumCount,
      males: maleCount,
      females: femaleCount,
      maleCount,
      femaleCount,
      totalRequests: requests.length,
      pendingRequests,
      activeRequests: requests.length,
      activeJourneys,
      completed: completedCount,
      declined: declinedCount,
      cancelled: cancelledCount,
      depositsPaid,
      revenue: depositsPaid * 500,
      totalRevenue: depositsPaid * 500,
      totalTransactions: depositsPaid,
      stageBreakdown,
      recentEvents: [],
    };
  };

  adminGetRequestPayments = (requestId: number) => localStore.adminGetRequestPayments(requestId);
  adminApplyExemption = (memberId: string, type: 'deposit' | 'badge', value: number | boolean, memberName?: string) => localStore.adminApplyExemption(memberId, type, value, memberName);

  // ===== الكوبونات والمعاملات المالية (Coupons & Transactions عبر MySQL) =====
  getCoupons = () => localStore.getCoupons();
  saveCoupon = (coupon: any) => localStore.saveCoupon(coupon);
  deleteCoupon = (code: string) => localStore.deleteCoupon(code);
  toggleCouponActive = (code: string) => localStore.toggleCouponActive(code);

  getTransactions = (): any[] => {
    if (typeof fetch !== 'undefined') {
      fetch('/api/transactions')
        .then((res) => (res.ok ? res.json() : null))
        .then((rows) => {
          if (Array.isArray(rows) && rows.length > 0) {
            try {
              localStorage.setItem('twafok_transactions', JSON.stringify(rows));
            } catch (_) {}
          }
        })
        .catch(() => null);
    }
    return localStore.getTransactions();
  };

  recordTransaction = (tx: any): void => {
    localStore.recordTransaction(tx);
    if (typeof fetch !== 'undefined') {
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      }).catch(() => null);
    }
  };

  updateTransactionStatus = (id: string, status: string) => localStore.updateTransactionStatus(id, status);
  validateCoupon = (code: string, amount?: number) => localStore.validateCoupon(code, amount);
  useCoupon = (code: string) => localStore.useCoupon(code);
  resetLocalDB = () => localStore.resetLocalDB();

  // ===== مستندات التوثيق (Verification documents) =====
  submitVerificationDoc = (doc: any) => verificationStore.submitVerificationDoc(doc);
  getAllVerificationDocs = () => verificationStore.getAllVerificationDocs();
  getMemberVerificationDoc = (memberId: string) => verificationStore.getMemberVerificationDoc(memberId);
  getVerificationStatus = (memberId: string) => verificationStore.getVerificationStatus(memberId);
  approveVerificationDoc = (docId: string, reviewerName: string) => verificationStore.approveVerificationDoc(docId, reviewerName);
  rejectVerificationDoc = (docId: string, reviewerName: string, reason: string) => verificationStore.rejectVerificationDoc(docId, reviewerName, reason);
  deleteVerificationDoc = (docId: string) => verificationStore.deleteVerificationDoc(docId);
  deleteReviewedDocs = () => verificationStore.deleteReviewedDocs();
  downloadDocImage = (doc: any) => verificationStore.downloadDocImage(doc);
  downloadAllPendingDocs = () => verificationStore.downloadAllPendingDocs();

  // ===== خيارات التسجيل المربوطة بقاعدة البيانات =====
  getSects = (): string[] => {
    return this.getRegistrationOptions('sects');
  };

  getRegistrationOptions = (key: string): any[] => {
    const stored = this.settings.get(`platform_options_${key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (key === 'workTypes') {
            return parsed.map((item: any) => {
              if (item === 'باحث عن عمل') return 'باحث عن وظيفة';
              if (item === 'بدون عمل') return 'بدون وظيفة';
              if (item?.label === 'باحث عن عمل' || item?.value === 'باحث عن عمل') return { ...item, label: 'باحث عن وظيفة', value: 'باحث عن وظيفة' };
              if (item?.label === 'بدون عمل' || item?.value === 'بدون عمل') return { ...item, label: 'بدون وظيفة', value: 'بدون وظيفة' };
              return item;
            });
          }
          return parsed;
        }
      } catch (e) {}
    }
    switch (key) {
      case 'sects': return DEFAULT_SECTS;
      case 'skinColors': return DEFAULT_SKIN_COLORS;
      case 'educationLevels': return DEFAULT_EDUCATION_LEVELS;
      case 'workTypes': return DEFAULT_WORK_TYPES;
      case 'housingTypes': return DEFAULT_HOUSING_TYPES;
      case 'smokingOptions': return DEFAULT_SMOKING_OPTIONS;
      case 'maritalMale': return DEFAULT_MARITAL_MALE;
      case 'maritalFemale': return DEFAULT_MARITAL_FEMALE;
      default: return [];
    }
  };

  updateRegistrationOptions = (key: string, values: any[]): void => {
    this.settings.set(`platform_options_${key}`, JSON.stringify(values));
  };

  // ===== المدن والدول (Geo Store - Cities & Countries) =====
  normalizeText = (s: string) => geoStore.normalizeText(s);
  getCountries = () => geoStore.getCountries();
  getCountryNames = () => geoStore.getCountryNames();
  getNationalities = () => {
    let list: string[] = [];
    try {
      const raw = this.settings.get('geo_nationalities_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch {}
    return Array.from(new Set([...list, ...NATIONALITIES, ...this.getCountryNames()])).filter(Boolean);
  };
  addNationality = (name: string, country?: string, gender?: string) => {
    const list = this.getNationalities();
    if (!list.includes(name)) list.unshift(name);
    this.settings.set('geo_nationalities_list', JSON.stringify(list));
    return { ok: true, name, country, gender };
  };
  removeNationality = (name: string) => {
    const norm = this.normalizeText(name);
    this.settings.set('geo_nationalities_list', JSON.stringify(this.getNationalities().filter((n: string) => this.normalizeText(n) !== norm)));
  };
  renameNationality = (oldName: string, newName: string) => {
    const normOld = this.normalizeText(oldName);
    const curr = this.getNationalities();
    let replaced = false;
    const list = curr.map((n: string) => {
      if (this.normalizeText(n) === normOld) {
        replaced = true;
        return newName;
      }
      return n;
    });
    if (!replaced && !list.includes(newName)) {
      list.unshift(newName);
    }
    this.settings.set('geo_nationalities_list', JSON.stringify(Array.from(new Set(list))));

    // Update pending suggestions if any match
    try {
      const suggestions = this.getPendingGeoSuggestions();
      let suggChanged = false;
      suggestions.forEach((s: any) => {
        if (s.kind === 'nationality' && this.normalizeText(s.name) === normOld) {
          s.name = newName.trim();
          suggChanged = true;
        }
      });
      if (suggChanged) {
        this.settings.set('geo_suggestions_list', JSON.stringify(suggestions));
      }
    } catch {}

    return { ok: true, oldName, newName };
  };
  isNationalityKnown = (name: string) => this.getNationalities().some((n: string) => this.normalizeText(n) === this.normalizeText(name));
  batchUpdateMemberGeo = (kind: 'country' | 'city' | 'nationality' | 'skinColor' | 'education' | 'workType', oldValue: string, newValue: string, targetCountry?: string, sourceCountryFilter?: string) => geoStore.batchUpdateMemberGeo(kind, oldValue, newValue, targetCountry, sourceCountryFilter);
  addCountry = (name: string, code?: string, flag?: string) => geoStore.addCountry(name, code, flag);
  removeCountry = (name: string) => geoStore.removeCountry(name);
  renameCountry = (oldName: string, newName: string) => geoStore.renameCountry(oldName, newName);
  getCities = (country: string) => geoStore.getCities(country);
  addCityToCountry = (country: string, city: string) => geoStore.addCityToCountry(country, city);
  removeCityFromCountry = (country: string, city: string) => geoStore.removeCityFromCountry(country, city);
  renameCity = (country: string, oldName: string, newName: string) => geoStore.renameCity(country, oldName, newName);
  adminMergeCities = (sourceCountry: string, sourceCity: string, targetCountry: string, targetCity: string) => {
    const res = geoStore.adminMergeCities(sourceCountry, sourceCity, targetCountry, targetCity);
    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list: any[] = raw ? JSON.parse(raw) : [];
      const normSourceCity = geoStore.normalizeText(sourceCity);
      const normSourceCountry = geoStore.normalizeText(sourceCountry);
      let changed = false;
      list.forEach((g: any) => {
        if (
          g.kind === 'city' &&
          geoStore.normalizeText(g.name) === normSourceCity &&
          (!normSourceCountry || !g.country || geoStore.normalizeText(g.country) === normSourceCountry)
        ) {
          g.status = 'merged';
          g.target_name = targetCity;
          g.target_country = targetCountry;
          changed = true;
        }
      });
      if (changed) this.settings.set('geo_suggestions_list', JSON.stringify(list));
    } catch {}
    return res;
  };
  adminMergeCountries = (sourceCountry: string, targetCountry: string) => {
    const res = geoStore.adminMergeCountries(sourceCountry, targetCountry);
    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list: any[] = raw ? JSON.parse(raw) : [];
      const normSourceCountry = geoStore.normalizeText(sourceCountry);
      let changed = false;
      list.forEach((g: any) => {
        if (g.kind === 'country' && geoStore.normalizeText(g.name) === normSourceCountry) {
          g.status = 'merged';
          g.target_name = targetCountry;
          changed = true;
        }
      });
      if (changed) this.settings.set('geo_suggestions_list', JSON.stringify(list));
    } catch {}
    return res;
  };
  isCityKnown = (country: string, city: string) => geoStore.isCityKnown(country, city);
  isCountryKnown = (country: string) => geoStore.isCountryKnown(country);
  getPendingCities = () => geoStore.getPendingCities();
  getAllPendingCities = () => geoStore.getAllPendingCities();
  getPendingCitiesCount = () => this.getPendingGeoSuggestions().filter((g: any) => g.status === 'pending').length;
  getPendingGeoSuggestions = () => {
    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      const storeCities = geoStore.getAllPendingCities() || [];
      const list2 = storeCities.map((c: any) => ({
        id: c.id,
        kind: 'city',
        name: c.name,
        country: c.country || '',
        suggested_by: c.suggestedBy || c.suggested_by || 'عضو',
        suggestedBy: c.suggestedBy || c.suggested_by || 'عضو',
        suggested_by_id: c.suggestedById || c.suggested_by_id || '',
        source: c.source || 'register',
        status: c.status || 'pending',
        created_at: c.createdAt || c.created_at || new Date().toISOString(),
      }));

      const map = new Map<string, any>();
      list1.forEach((item) => { if (item && item.id) map.set(item.id, item); });
      list2.forEach((item) => { if (item && item.id && !map.has(item.id)) map.set(item.id, item); });
      return Array.from(map.values());
    } catch { return []; }
  };
  getPendingGeoSuggestionsCount = () => this.getPendingGeoSuggestions().filter((g: any) => g.status === 'pending').length;
  addPendingGeo = (kind: 'country' | 'city' | 'nationality', name: string, country = '', suggestedBy = 'عضو', source = 'register', suggestedById?: string) => {
    const list = this.getPendingGeoSuggestions();
    const item = { id: `geo_${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, kind, name, country, suggested_by: suggestedBy, suggestedBy, suggested_by_id: suggestedById || '', source, status: 'pending', created_at: new Date().toISOString() };
    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      list1.unshift(item);
      this.settings.set('geo_suggestions_list', JSON.stringify(list1));
    } catch {}
    if (kind === 'city') {
      geoStore.addPendingCity(name, country, suggestedBy, source as any, suggestedById);
    }
    return { ok: true, ...item };
  };
  approvePendingGeo = (id: string, editedName?: string) => {
    const all = this.getPendingGeoSuggestions();
    const item = all.find((g: any) => g.id === id);
    const targetName = editedName || item?.name || '';
    const normName = item?.name ? geoStore.normalizeText(item.name) : '';
    const normCountry = item?.country ? geoStore.normalizeText(item.country) : '';

    if (item) {
      item.status = 'approved';
      item.target_name = targetName;
      if (item.kind === 'country') this.addCountry(targetName);
      if (item.kind === 'city') this.addCityToCountry(item.country || 'السعودية', targetName);
      if (item.kind === 'nationality') this.addNationality(targetName, item.country);
      if (item.name && targetName) {
        this.batchUpdateMemberGeo(item.kind, item.name, targetName, item.country || 'السعودية');
      }
    }

    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      list1.forEach((g: any) => {
        const isMatch = g.id === id || Boolean(item && g.kind === item.kind && geoStore.normalizeText(g.name) === normName && (item.kind !== 'city' || !g.country || !normCountry || geoStore.normalizeText(g.country) === normCountry));
        if (isMatch) {
          g.status = 'approved';
          g.target_name = targetName;
        }
      });
      this.settings.set('geo_suggestions_list', JSON.stringify(list1));
    } catch {}

    geoStore.approvePendingCity(id, 'admin', editedName, item?.name, item?.country);

    return { ok: true, data: item };
  };
  mergePendingGeo = (id: string, targetName: string, targetCountry?: string) => {
    const all = this.getPendingGeoSuggestions();
    const item = all.find((g: any) => g.id === id);
    const normName = item?.name ? geoStore.normalizeText(item.name) : '';
    const normCountry = item?.country ? geoStore.normalizeText(item.country) : '';

    if (item) {
      item.status = 'merged';
      item.target_name = targetName;
      item.target_country = targetCountry || '';
      if (item.kind === 'city') {
        const cCountry = targetCountry || item.country || 'السعودية';
        this.addCityToCountry(cCountry, targetName);
      }
      if (item.name && targetName) {
        this.batchUpdateMemberGeo(item.kind, item.name, targetName, targetCountry || item.country, item.country);
      }
    }

    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      list1.forEach((g: any) => {
        const isMatch = g.id === id || Boolean(item && g.kind === item.kind && geoStore.normalizeText(g.name) === normName && (item.kind !== 'city' || !g.country || !normCountry || geoStore.normalizeText(g.country) === normCountry));
        if (isMatch) {
          g.status = 'merged';
          g.target_name = targetName;
          g.target_country = targetCountry || '';
        }
      });
      this.settings.set('geo_suggestions_list', JSON.stringify(list1));
    } catch {}

    geoStore.rejectPendingCity(id, 'admin', `merged into ${targetName}`, item?.name, item?.country);
    geoStore.deletePendingCity(id, item?.name, item?.country);

    return { ok: true, data: item };
  };
  rejectPendingGeo = (id: string, reason?: string) => {
    const all = this.getPendingGeoSuggestions();
    const item = all.find((g: any) => g.id === id);
    const normName = item?.name ? geoStore.normalizeText(item.name) : '';
    const normCountry = item?.country ? geoStore.normalizeText(item.country) : '';

    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      list1.forEach((g: any) => {
        const isMatch = g.id === id || Boolean(item && g.kind === item.kind && geoStore.normalizeText(g.name) === normName && (item.kind !== 'city' || !g.country || !normCountry || geoStore.normalizeText(g.country) === normCountry));
        if (isMatch) {
          g.status = 'rejected';
          g.rejection_reason = reason || '';
        }
      });
      this.settings.set('geo_suggestions_list', JSON.stringify(list1));
    } catch {}

    geoStore.rejectPendingCity(id, 'admin', reason, item?.name, item?.country);
    return { ok: true };
  };
  deletePendingGeo = (id: string) => {
    const all = this.getPendingGeoSuggestions();
    const item = all.find((g: any) => g.id === id);
    const normName = item?.name ? geoStore.normalizeText(item.name) : '';
    const normCountry = item?.country ? geoStore.normalizeText(item.country) : '';

    try {
      const raw = this.settings.get('geo_suggestions_list');
      const list1: any[] = raw ? JSON.parse(raw) : [];
      const updated = list1.filter((g: any) => {
        const isMatch = g.id === id || Boolean(item && g.kind === item.kind && geoStore.normalizeText(g.name) === normName && (item.kind !== 'city' || !g.country || !normCountry || geoStore.normalizeText(g.country) === normCountry));
        return !isMatch;
      });
      this.settings.set('geo_suggestions_list', JSON.stringify(updated));
    } catch {}

    geoStore.deletePendingCity(id, item?.name, item?.country);
  };
  addPendingCity = (name: string, country: string, suggestedBy: string, source?: any, suggestedById?: string) => {
    return this.addPendingGeo('city', name, country, suggestedBy, source, suggestedById);
  };
  approvePendingCity = (id: string, reviewer: string, editedName?: string) => this.approvePendingGeo(id, editedName);
  rejectPendingCity = (id: string, reviewer: string, reason?: string) => this.rejectPendingGeo(id, reason);
  deletePendingCity = (id: string) => this.deletePendingGeo(id);
  checkAndRegisterUnknownGeo = (members: any[], source?: any) => geoStore.checkAndRegisterUnknownGeo(members, source);
  exportAllCountries = () => geoStore.exportAllCountries();
  exportCitiesForCountry = (country: string) => geoStore.exportCitiesForCountry(country);
  exportAllGeo = () => geoStore.exportAllGeo();
  importCountries = (json: string, mode?: 'merge' | 'replace') => geoStore.importCountries(json, mode);
  importCitiesForCountry = (country: string, json: string, mode?: 'merge' | 'replace') => geoStore.importCitiesForCountry(country, json, mode);
  importFullGeo = (json: string, mode?: 'merge' | 'replace') => geoStore.importFullGeo(json, mode);
  resetGeoDB = () => geoStore.resetGeoDB();
  refreshGeoDB = () => geoStore.refreshGeoDB();
  ensureGeoLoaded = async (): Promise<void> => { geoStore.refreshGeoDB(); };
}

export type DatabaseProvider = 'local';

export const DATABASE_CONFIG = {
  PROVIDER: 'local' as DatabaseProvider,
};
