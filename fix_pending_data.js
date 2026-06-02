const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) env[key.trim()] = values.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching all orders...');
  const { data: orders, error } = await supabase.from('orders').select('*');
  
  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${orders.length} orders.`);
  
  let fixedCount = 0;
  let txCount = 0;

  for (const order of orders) {
    const totalAmount = order.total_amount || 0;
    const amountPaid = order.amount_paid || 0;
    const balance = totalAmount - amountPaid;

    // 1. Fix order payment_status if it's wrong
    let correctStatus = order.payment_status;
    if (balance > 0) {
      if (amountPaid > 0) {
        correctStatus = 'Pago Parcial';
      } else {
        correctStatus = 'Pendente';
      }
    } else {
      correctStatus = 'Pago';
    }

    let needsUpdate = correctStatus !== order.payment_status;

    if (needsUpdate) {
      console.log(`Updating order #${order.order_number}: ${order.payment_status} -> ${correctStatus}`);
      await supabase.from('orders').update({ payment_status: correctStatus }).eq('id', order.id);
      fixedCount++;
    }

    // 2. If balance > 0, ensure there is a Pending financial transaction for the remaining balance
    if (balance > 0 && !order.ignore_auto_finance) {
      // Check if a pending transaction already exists
      const { data: txs } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('order_id', order.id)
        .eq('status', 'Pendente')
        .eq('type', 'Receita');
        
      if (!txs || txs.length === 0) {
        console.log(`Creating missing pending transaction for order #${order.order_number} (Balance: ${balance})`);
        
        let clientName = 'Cliente';
        if (order.client_id) {
          const { data: client } = await supabase.from('clients').select('full_name').eq('id', order.client_id).single();
          if (client) clientName = client.full_name;
        } else if (order.company_id) {
          const { data: company } = await supabase.from('companies').select('business_name').eq('id', order.company_id).single();
          if (company) clientName = company.business_name;
        }

        const newTx = {
          type: 'Receita',
          description: `Pagamento Pendente - Pedido #${order.order_number} (${clientName})`,
          amount: balance,
          category: 'Vendas',
          status: 'Pendente',
          order_id: order.id,
          due_date: order.final_payment_date || order.deadline || new Date().toISOString()
        };

        await supabase.from('financial_transactions').insert([newTx]);
        txCount++;
      }
    }
  }

  console.log(`Done! Fixed ${fixedCount} orders and created ${txCount} missing pending transactions.`);
}

main().catch(console.error);
