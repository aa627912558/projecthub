import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxfpsmreaktaugrzsoto.supabase.co';
const anonKey = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

// Try to drop and recreate the insert policy to allow anon inserts
// This requires admin access

// First let's check what policies exist by querying the information schema
const { data, error } = await supabase.from('projects').select('id, title').limit(3);
console.log('Can read:', data, error);

// Try to INSERT with the author_id matching a known user
// We need to be authenticated for this
// Let me try to use the email magic link or password auth

// Actually let me check if there's a way to get an anon key that bypasses RLS
// Let me look at the existing published projects and see if I can use their IDs
const { data: existing } = await supabase
  .from('projects')
  .select('id, author_id')
  .eq('status', 'published')
  .limit(2);
console.log('Existing:', existing);
