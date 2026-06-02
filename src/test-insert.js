import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { error } = await supabase.from('financial_transactions').insert([{
    type: 'Receita',
    description: 'Test',
    amount: 100,
    status: 'Pago',
    client_id: null
  }])
  console.log("Insert result error:", error)
}

test()
