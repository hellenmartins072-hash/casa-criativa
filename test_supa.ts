import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{ name: 'Test Supplier', email: 'test@test.com' }])
    .select()

  if (error) {
    console.error('Supabase Error:', error)
  } else {
    console.log('Success:', data)
  }
}

test()
