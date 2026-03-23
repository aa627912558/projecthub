import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxfpsmreaktaugrzsoto.supabase.co';
const supabaseKey = 'sb_publishable_NLNYkDI4HGUn90D9BzmAqw_7sSeosxv';

const client = createClient(supabaseUrl, supabaseKey);

// Try to execute raw SQL
// Note: This requires the service_role key or a function that allows this
async function setup() {
  try {
    // This will only work if RLS is disabled for the service role
    const { data, error } = await client.rpc('exec', { sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
        username text UNIQUE NOT NULL,
        email text UNIQUE NOT NULL,
        avatar_url text,
        is_admin boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );
    `});
    
    if (error) {
      console.log('RPC approach failed:', error.message);
      console.log('Note: To set up Supabase, you need to run the SQL manually:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select project xxfpsmreaktaugrzsoto');
      console.log('3. Go to SQL Editor');
      console.log('4. Run the contents of ~/projects/projecthub/supabase_schema_manual.sql');
    } else {
      console.log('Success:', data);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

setup();
