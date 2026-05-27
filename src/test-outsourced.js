import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { sql: `
    ALTER TABLE public.outsourced_services ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable all operations for outsourced_services"
    ON public.outsourced_services
    FOR ALL USING (true) WITH CHECK (true);
  ` })

  if (error) {
    console.error('Error running RPC:', error)
  } else {
    console.log('Success adding RLS:', data)
  }
}
run()
