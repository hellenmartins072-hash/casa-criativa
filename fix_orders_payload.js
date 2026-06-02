const fs = require('fs');
let content = fs.readFileSync('src/lib/api/orders.ts', 'utf8');

// Update createOrder
content = content.replace(/if \(orderData\.store_id\) payload\.store_id = orderData\.store_id/g, 
"if (orderData.store_id) payload.store_id = orderData.store_id\n    if (orderData.reseller_id) payload.reseller_id = orderData.reseller_id\n    if (orderData.quote_date) payload.quote_date = orderData.quote_date\n    if (orderData.order_date) payload.order_date = orderData.order_date");

// Update updateOrder
content = content.replace(/shipping_partner_id: orderData\.shipping_partner_id/g,
"shipping_partner_id: orderData.shipping_partner_id,\n      reseller_id: orderData.reseller_id,\n      quote_date: orderData.quote_date,\n      order_date: orderData.order_date");

fs.writeFileSync('src/lib/api/orders.ts', content, 'utf8');
console.log('done');
