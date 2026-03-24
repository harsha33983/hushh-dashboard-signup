import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TrackEventRequest } from '@/lib/types'

// Generate a session ID if not provided
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Include x-api-key header.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Validate API key and get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: TrackEventRequest = await request.json()

    if (!body.event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      )
    }

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        workspace_id: workspace.id,
        session_id: body.session_id || generateSessionId(),
        user_id: body.user_id || null,
        event_name: body.event,
        properties: body.properties || {},
        page_url: body.page_url || null,
        timestamp: body.timestamp || new Date().toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error inserting event:', eventError)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, event_id: event.id })
  } catch (error) {
    console.error('Track error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  })
}
