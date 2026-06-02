import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      full_name: 'Test Client',
      whatsapp: '123',
      company_id: null,
      birth_date: null
    }])
    .select()

  console.log('Client Insert Error:', error)
}
run()
