import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxfpsmreaktaugrzsoto.supabase.co';
const anonKey = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv';

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

// Try to disable RLS on projects table using the REST API with service role
// Actually let me try a different approach - use the existing articles' IDs to understand author

const { data: profiles } = await supabase.from('profiles').select('*');
console.log('profiles:', JSON.stringify(profiles));
