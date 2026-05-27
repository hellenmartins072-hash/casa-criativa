import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { sql: `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
  ` })

  console.log(data, error)
}
run()
