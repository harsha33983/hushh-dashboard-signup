-- Performance indexes for Drop-off Intelligence Platform

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_workspace_event_timestamp 
ON events(workspace_id, event_name, timestamp);

CREATE INDEX IF NOT EXISTS idx_events_workspace_session 
ON events(workspace_id, session_id);

CREATE INDEX IF NOT EXISTS idx_events_timestamp 
ON events(timestamp);

CREATE INDEX IF NOT EXISTS idx_events_workspace_timestamp
ON events(workspace_id, timestamp DESC);

-- Funnels table indexes
CREATE INDEX IF NOT EXISTS idx_funnels_workspace 
ON funnels(workspace_id);

-- Funnel insights table indexes
CREATE INDEX IF NOT EXISTS idx_insights_funnel 
ON funnel_insights(funnel_id);

CREATE INDEX IF NOT EXISTS idx_insights_severity 
ON funnel_insights(severity);

-- Workspaces table indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_api_key 
ON workspaces(api_key);
