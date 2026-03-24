import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId(request)
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get distinct event names with counts
    const { data, error } = await supabase
      .from('events')
      .select('event_name')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error fetching event names:', error)
      return NextResponse.json({ error: 'Failed to fetch event names' }, { status: 500 })
    }

    // Count occurrences of each event name
    const eventCounts: Record<string, number> = {}
    data?.forEach(row => {
      const name = row.event_name
      eventCounts[name] = (eventCounts[name] || 0) + 1
    })

    // Convert to array and sort by count
    const eventNames = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ event_names: eventNames })
  } catch (error) {
    console.error('Event names GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
