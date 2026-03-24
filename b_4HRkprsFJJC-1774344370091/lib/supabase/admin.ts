import { createClient } from '@supabase/supabase-js'

// Admin client for API routes - doesn't need cookie handling
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Validate API key and return workspace
export async function validateApiKey(apiKey: string | null) {
  if (!apiKey) {
    return { error: 'API key is required', workspace: null }
  }

  const supabase = createAdminClient()
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  if (error || !workspace) {
    return { error: 'Invalid API key', workspace: null }
  }

  return { error: null, workspace }
}
