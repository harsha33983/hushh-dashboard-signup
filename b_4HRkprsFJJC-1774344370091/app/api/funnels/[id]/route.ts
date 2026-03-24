import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateFunnelRequest } from '@/lib/types'

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

    const supabase = await createClient()

    const { data: funnel, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    return NextResponse.json({ funnel })
  } catch (error) {
    console.error('Funnel GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workspaceId = await getWorkspaceId(request)
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body: UpdateFunnelRequest = await request.json()
    const supabase = await createClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name) updateData.name = body.name
    if (body.steps) updateData.steps = body.steps

    const { data: funnel, error } = await supabase
      .from('funnels')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error || !funnel) {
      return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 })
    }

    return NextResponse.json({ funnel })
  } catch (error) {
    console.error('Funnel PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete funnel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Funnel DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
