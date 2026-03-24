// Drop-off Intelligence Platform Types

export interface Workspace {
  id: string
  name: string
  api_key: string
  created_at: string
}

export interface Event {
  id: string
  workspace_id: string
  session_id: string
  user_id: string | null
  event_name: string
  properties: Record<string, unknown>
  page_url: string | null
  timestamp: string
  created_at: string
}

export interface FunnelStep {
  event: string
  label: string
}

export interface Funnel {
  id: string
  workspace_id: string
  name: string
  steps: FunnelStep[]
  created_at: string
  updated_at: string
}

export interface FunnelInsight {
  id: string
  funnel_id: string
  step_index: number
  insight_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

// Analytics Types
export interface FunnelStepAnalytics {
  step_index: number
  event: string
  label: string
  count: number
  percentage: number
  drop_off_rate: number
  previous_count: number
}

export interface FunnelAnalytics {
  funnel: Funnel
  steps: FunnelStepAnalytics[]
  total_sessions: number
  conversion_rate: number
  insights: FunnelInsight[]
}

export interface EventBreakdown {
  event_name: string
  count: number
  unique_sessions: number
  properties_breakdown: Record<string, Record<string, number>>
}

// API Request/Response Types
export interface TrackEventRequest {
  event: string
  properties?: Record<string, unknown>
  session_id?: string
  user_id?: string
  page_url?: string
  timestamp?: string
}

export interface CreateFunnelRequest {
  name: string
  steps: FunnelStep[]
}

export interface UpdateFunnelRequest {
  name?: string
  steps?: FunnelStep[]
}

export interface AnalyticsQueryParams {
  start_date?: string
  end_date?: string
  granularity?: 'hour' | 'day' | 'week'
}

// Insight Types
export type InsightType = 
  | 'high_drop_off'
  | 'device_correlation'
  | 'time_pattern'
  | 'browser_issue'
  | 'page_performance'
