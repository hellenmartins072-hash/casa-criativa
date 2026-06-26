import { supabase } from './supabase';
async function test() {
  const { data, error } = await supabase.from('companies').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
test();
