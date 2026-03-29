import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxfpsmreaktaugrzsoto.supabase.co';
// Try with anon key first
const anonKey = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

// Check RLS status
const { data: policies } = await supabase.rpc('pg_catalog.pg_policies', {tablename: 'projects'}).eq('tablename', 'projects');
console.log('policies:', JSON.stringify(policies));
