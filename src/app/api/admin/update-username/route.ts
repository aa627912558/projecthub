import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { id, username } = await req.json()
    
    if (!id || !username) {
      return NextResponse.json({ error: 'Missing id or username' }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    
    const { data, error } = await adminClient
      .from('profiles')
      .update({ username })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Update username error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
