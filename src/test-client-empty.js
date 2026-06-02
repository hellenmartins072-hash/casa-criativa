import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      full_name: 'Test Client Empty Date',
      whatsapp: '123',
      birth_date: ''
    }])
    .select()

  console.log('Client Insert Empty Date Error:', error)
}
run()
