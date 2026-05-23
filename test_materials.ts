import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      suppliers (
        id,
        name
      )
    `)
    .limit(3)

  if (error) {
    console.error('Supabase Error:', error)
  } else {
    console.log('Success:', JSON.stringify(data, null, 2))
  }
}

test()
