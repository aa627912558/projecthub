import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Simple secret check (not perfect security but basic protection)
const UPDATE_SECRET = process.env.BATCH_UPDATE_SECRET || 'xiangmupai-batch-update-2026'

export async function POST(request: Request) {
  try {
    const { slug, description, secret } = await request.json()
    
    if (secret !== UPDATE_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    
    if (!slug || !description) {
      return NextResponse.json({ error: 'missing slug or description' }, { status: 400 })
    }
    
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from('projects')
      .update({ description })
      .eq('slug', slug)
      .select('slug')
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, slug: data.slug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
