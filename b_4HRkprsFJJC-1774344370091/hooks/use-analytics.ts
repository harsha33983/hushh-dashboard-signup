'use client';

import { apiClient } from '@/lib/api-client';

export const useAnalytics = () => {
  /**
   * Track a user event and send it to the FastAPI backend.
   * Manages persistent session_id in localStorage.
   */
  const track = async (event: string, metadata: { step: string; field?: string; [key: string]: any }) => {
    if (typeof window === 'undefined') return;

    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);
    }

    try {
      await apiClient.post('/events', {
        event_type: event,
        session_id: sessionId,
        step: metadata.step,
        field: metadata.field || null,
        metadata: metadata,
      });
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  };

  return { track };
};
