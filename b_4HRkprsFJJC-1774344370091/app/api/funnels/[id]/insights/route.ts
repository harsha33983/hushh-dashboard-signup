import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Funnel, FunnelStep, FunnelInsight } from '@/lib/types'

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

interface StepData {
  count: number
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
}

async function generateInsights(
  supabase: Awaited<ReturnType<typeof createClient>>,
  funnel: Funnel,
  workspaceId: string
): Promise<Omit<FunnelInsight, 'id' | 'created_at'>[]> {
  const insights: Omit<FunnelInsight, 'id' | 'created_at'>[] = []
  const steps = funnel.steps as FunnelStep[]
  
  // Get event data for each step
  const stepData: StepData[] = []
  
  for (const step of steps) {
    const { data: events } = await supabase
      .from('events')
      .select('session_id, properties')
      .eq('workspace_id', workspaceId)
      .eq('event_name', step.event)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const uniqueSessions = new Set(events?.map(e => e.session_id) || [])
    const deviceBreakdown: Record<string, number> = {}
    const browserBreakdown: Record<string, number> = {}
    
    events?.forEach(event => {
      const props = event.properties as Record<string, string> || {}
      const device = props.device || 'unknown'
      const browser = props.browser || 'unknown'
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1
    })

    stepData.push({
      count: uniqueSessions.size,
      deviceBreakdown,
      browserBreakdown,
    })
  }

  // Analyze drop-offs
  for (let i = 1; i < stepData.length; i++) {
    const prev = stepData[i - 1]
    const curr = stepData[i]
    const dropOffRate = prev.count > 0 ? ((prev.count - curr.count) / prev.count) * 100 : 0

    // High drop-off insight (> 50%)
    if (dropOffRate > 50) {
      insights.push({
        funnel_id: funnel.id,
        step_index: i,
        insight_type: 'high_drop_off',
        severity: dropOffRate > 70 ? 'critical' : 'warning',
        title: `High drop-off at "${steps[i].label}"`,
        description: `${dropOffRate.toFixed(1)}% of users drop off between "${steps[i - 1].label}" and "${steps[i].label}". Consider simplifying this step or investigating user friction.`,
        metadata: { drop_off_rate: dropOffRate, previous_count: prev.count, current_count: curr.count },
      })
    }

    // Device correlation insight
    const prevMobile = prev.deviceBreakdown['mobile'] || 0
    const currMobile = curr.deviceBreakdown['mobile'] || 0
    const prevDesktop = prev.deviceBreakdown['desktop'] || 0
    const currDesktop = curr.deviceBreakdown['desktop'] || 0

    const mobileDropOff = prevMobile > 0 ? ((prevMobile - currMobile) / prevMobile) * 100 : 0
    const desktopDropOff = prevDesktop > 0 ? ((prevDesktop - currDesktop) / prevDesktop) * 100 : 0

    if (Math.abs(mobileDropOff - desktopDropOff) > 20) {
      const worseDevice = mobileDropOff > desktopDropOff ? 'mobile' : 'desktop'
      insights.push({
        funnel_id: funnel.id,
        step_index: i,
        insight_type: 'device_correlation',
        severity: 'warning',
        title: `${worseDevice === 'mobile' ? 'Mobile' : 'Desktop'} users struggling at "${steps[i].label}"`,
        description: `${worseDevice === 'mobile' ? 'Mobile' : 'Desktop'} users have ${Math.abs(mobileDropOff - desktopDropOff).toFixed(1)}% higher drop-off rate at this step. Consider optimizing the ${worseDevice} experience.`,
        metadata: { mobile_drop_off: mobileDropOff, desktop_drop_off: desktopDropOff },
      })
    }
  }

  // Overall conversion insight
  const conversionRate = stepData.length > 0 && stepData[0].count > 0 
    ? (stepData[stepData.length - 1].count / stepData[0].count) * 100 
    : 0

  if (conversionRate < 5) {
    insights.push({
      funnel_id: funnel.id,
      step_index: -1,
      insight_type: 'low_conversion',
      severity: 'critical',
      title: 'Very low overall conversion rate',
      description: `Only ${conversionRate.toFixed(1)}% of users complete the entire funnel. Consider reviewing each step for friction points.`,
      metadata: { conversion_rate: conversionRate },
    })
  } else if (conversionRate > 15) {
    insights.push({
      funnel_id: funnel.id,
      step_index: -1,
      insight_type: 'good_conversion',
      severity: 'info',
      title: 'Healthy conversion rate',
      description: `${conversionRate.toFixed(1)}% of users complete the funnel, which is above average for most funnels.`,
      metadata: { conversion_rate: conversionRate },
    })
  }

  return insights
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workspaceId = await getWorkspaceId(request)
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

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

    // Generate new insights
    const newInsights = await generateInsights(supabase, funnel as Funnel, workspaceId)

    // Clear old insights for this funnel
    await supabase
      .from('funnel_insights')
      .delete()
      .eq('funnel_id', id)

    // Insert new insights
    if (newInsights.length > 0) {
      const { error: insertError } = await supabase
        .from('funnel_insights')
        .insert(newInsights)

      if (insertError) {
        console.error('Error inserting insights:', insertError)
      }
    }

    // Fetch the inserted insights
    const { data: insights } = await supabase
      .from('funnel_insights')
      .select('*')
      .eq('funnel_id', id)
      .order('severity', { ascending: true })

    return NextResponse.json({ insights: insights || [], generated: newInsights.length })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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

    const supabase = await createClient()

    const { data: insights, error } = await supabase
      .from('funnel_insights')
      .select('*')
      .eq('funnel_id', id)
      .order('severity', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    return NextResponse.json({ insights: insights || [] })
  } catch (error) {
    console.error('Insights GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
