import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Funnel, FunnelStepAnalytics, FunnelAnalytics, FunnelStep } from '@/lib/types'

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001'

async function getWorkspaceId(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey) {
    return DEMO_WORKSPACE_ID
  }

  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('api_key', apiKey)
    .single()

  return workspace?.id || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workspaceId = await getWorkspaceId(request)
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()

    const supabase = await createClient()

    // Get funnel
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    const typedFunnel = funnel as Funnel
    const steps = typedFunnel.steps as FunnelStep[]

    // Get unique sessions that started the funnel (first step)
    const firstStepEvent = steps[0]?.event
    const { data: sessionsData } = await supabase
      .from('events')
      .select('session_id')
      .eq('workspace_id', workspaceId)
      .eq('event_name', firstStepEvent)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)

    const totalSessions = new Set(sessionsData?.map(e => e.session_id) || []).size

    // Calculate step analytics
    const stepAnalytics: FunnelStepAnalytics[] = []
    let previousCount = totalSessions

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // Get unique sessions for this step
      const { data: stepData } = await supabase
        .from('events')
        .select('session_id')
        .eq('workspace_id', workspaceId)
        .eq('event_name', step.event)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      const uniqueSessions = new Set(stepData?.map(e => e.session_id) || [])
      const count = uniqueSessions.size
      const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0
      const dropOffRate = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0

      stepAnalytics.push({
        step_index: i,
        event: step.event,
        label: step.label,
        count,
        percentage,
        drop_off_rate: i === 0 ? 0 : dropOffRate,
        previous_count: previousCount,
      })

      previousCount = count
    }

    // Get insights for this funnel
    const { data: insights } = await supabase
      .from('funnel_insights')
      .select('*')
      .eq('funnel_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    const lastStep = stepAnalytics[stepAnalytics.length - 1]
    const conversionRate = totalSessions > 0 ? (lastStep?.count || 0) / totalSessions * 100 : 0

    const analytics: FunnelAnalytics = {
      funnel: typedFunnel,
      steps: stepAnalytics,
      total_sessions: totalSessions,
      conversion_rate: conversionRate,
      insights: insights || [],
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Funnel analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
