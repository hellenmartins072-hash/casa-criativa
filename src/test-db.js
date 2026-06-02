import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('ignored_bank_transactions').select('*').limit(1)
  console.log('ignored_bank_transactions check:', error ? error.message : 'Table exists')

  const { data: fData, error: fError } = await supabase.from('financial_transactions').select('bank_transaction_id').limit(1)
  console.log('financial_transactions check:', fError ? fError.message : 'Column exists')
}
run()
