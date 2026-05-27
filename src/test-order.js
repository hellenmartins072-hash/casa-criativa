import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbxgbqjktvhjbsjiijxi.supabase.co'
const supabaseKey = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const itemsData = [{
    order_id: '00000000-0000-0000-0000-000000000000',
    product_id: "",
    product_name: "test",
    quantity: 1,
    unit_price: 10,
    total_price: 10
  }]

  const { data, error } = await supabase
    .from('order_items')
    .insert(itemsData)
    .select()

  if (error) {
    console.error('Error insert order:', error)
  } else {
    console.log('Success insert order:', data)
  }
}
run()
