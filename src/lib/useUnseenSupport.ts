import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from './AppContext';
import { getCurrentUserId } from './useInterestRequests';

const SUPPORT_SEEN_KEY = 'support_tickets_last_seen';

export function readSupportSeenMap(userId?: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const activeId = userId || getCurrentUserId();
    const key = activeId ? `${SUPPORT_SEEN_KEY}_${activeId}` : SUPPORT_SEEN_KEY;
    const val = localStorage.getItem(key);
    if (val) return JSON.parse(val);
    return {};
  } catch {
    return {};
  }
}

export function markAllSupportSeen(userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const activeId = userId || getCurrentUserId();
    if (!activeId) return;
    const key = `${SUPPORT_SEEN_KEY}_${activeId}`;
    const now = new Date().toISOString();
    const map = readSupportSeenMap(activeId);

    const saved = localStorage.getItem('saved_support_tickets_list');
    if (saved) {
      try {
        const tickets = JSON.parse(saved);
        if (Array.isArray(tickets)) {
          tickets.forEach((t: any) => {
            map[t.id] = now;
          });
        }
      } catch { /* ignore */ }
    }
    localStorage.setItem(key, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('twafok_support_seen_update', { detail: { userId: activeId } }));
  } catch {
    /* ignore */
  }
}

export function getUnseenSupportCount(tickets: any[], userId?: string): number {
  const activeId = userId || getCurrentUserId();
  if (!activeId || !Array.isArray(tickets)) return 0;

  const map = readSupportSeenMap(activeId);
  const userTickets = tickets.filter(
    (t: any) => (t.userId === activeId || t.userId === 'm2') && t.id !== 't1' && t.id !== 't2'
  );

  let unreadCount = 0;
  for (const t of userTickets) {
    if (!t.messages || t.messages.length === 0) continue;

    // فحص الرسائل القادمة من الإدارة
    const adminMessages = t.messages.filter((m: any) => m.sender === 'admin');
    if (adminMessages.length === 0) continue;

    const seenTime = map[t.id];
    if (!seenTime) {
      unreadCount++;
    } else {
      // فحص وجود أي رسالة من الإدارة أحدث من وقت آخر رؤية
      const hasNewAdminMsg = adminMessages.some((m: any) => {
        const msgTime = m.createdAt ? new Date(m.createdAt).getTime() : (t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now());
        return msgTime > new Date(seenTime).getTime();
      });
      if (hasNewAdminMsg) {
        unreadCount++;
      }
    }
  }

  return unreadCount;
}

export function useUnseenSupport() {
  const { user, supportTickets } = useApp();
  const location = useLocation();
  const activeUserId = user?.memberId || getCurrentUserId();

  const [unseenSupportCount, setUnseenSupportCount] = useState<number>(0);

  const refreshCount = useCallback(() => {
    if (!activeUserId) {
      setUnseenSupportCount(0);
      return;
    }
    const count = getUnseenSupportCount(supportTickets, activeUserId);
    setUnseenSupportCount(count);
  }, [activeUserId, supportTickets]);

  useEffect(() => {
    refreshCount();

    const handleUpdate = () => {
      refreshCount();
    };

    window.addEventListener('twafok_support_seen_update', handleUpdate);
    window.addEventListener('twafok_notification_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshCount();
      }
    }, 4000);

    return () => {
      window.removeEventListener('twafok_support_seen_update', handleUpdate);
      window.removeEventListener('twafok_notification_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(timer);
    };
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
  }, [location.pathname, refreshCount]);

  return {
    unseenSupportCount,
    hasUnseenSupport: unseenSupportCount > 0,
    markAllSupportSeen: () => activeUserId && markAllSupportSeen(activeUserId),
    refresh: refreshCount,
  };
}
