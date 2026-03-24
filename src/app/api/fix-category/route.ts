import { createAdminClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const adminClient = await createAdminClient()
    
    // Add category column to projects table
    const { data, error } = await adminClient.rpc('exec', {
      sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT \'副业\';'
    })
    
    if (error) {
      // Try direct SQL if RPC doesn't work
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true, data })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
