import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error("Error fetching:", error)
  } else {
    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]))
    } else {
      console.log("No rows, trying to insert dummy with client_id")
      const { error: err2 } = await supabase.from('financial_transactions').insert([{
        type: 'Receita',
        description: 'Test',
        amount: 0,
        status: 'Pendente',
        client_id: null
      }])
      console.log("Insert result:", err2)
    }
  }
}

test()
