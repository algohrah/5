import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from './AppContext';
import {
  getUnseenRequestsCount,
  markAllRequestsSeen,
  markRequestSeen,
  getCurrentUserId,
} from './useInterestRequests';

export function useUnseenRequests(customUserId?: string) {
  const { user } = useApp();
  const location = useLocation();
  const activeUserId = customUserId || user?.memberId || getCurrentUserId();

  const [unseenCount, setUnseenCount] = useState<number>(0);

  const refreshCount = useCallback(() => {
    if (!activeUserId) {
      setUnseenCount(0);
      return;
    }
    const count = getUnseenRequestsCount(activeUserId);
    setUnseenCount(count);
  }, [activeUserId]);

  useEffect(() => {
    refreshCount();

    const handleUpdate = () => {
      refreshCount();
    };

    window.addEventListener('twafok_requests_seen_update', handleUpdate);
    window.addEventListener('twafok_notification_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    // التحقق الدوري كل 6 ثوانٍ لضمان التزامن اللحظي
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshCount();
      }
    }, 6000);

    return () => {
      window.removeEventListener('twafok_requests_seen_update', handleUpdate);
      window.removeEventListener('twafok_notification_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(timer);
    };
  }, [refreshCount]);

  // تحديث فوري عند تغير المسار
  useEffect(() => {
    refreshCount();
  }, [location.pathname, refreshCount]);

  const markAllSeen = useCallback(() => {
    if (!activeUserId) return;
    markAllRequestsSeen(activeUserId);
    setUnseenCount(0);
  }, [activeUserId]);

  const markSingleSeen = useCallback((requestId: number) => {
    if (!activeUserId) return;
    markRequestSeen(requestId, activeUserId);
    refreshCount();
  }, [activeUserId, refreshCount]);

  return {
    unseenCount,
    hasUnseen: unseenCount > 0,
    markAllSeen,
    markSingleSeen,
    refresh: refreshCount,
  };
}
