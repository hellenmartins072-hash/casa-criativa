import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('financial_transactions').insert({
    type: 'Despesa',
    amount: 0.1,
    description: 'test enum',
    due_date: '2026-01-01',
    status: 'Pendente',
    payment_method: 'Cartão de débito'
  })
  console.log('payment enum check:', error ? error.message : 'Enum updated')
}
run()
