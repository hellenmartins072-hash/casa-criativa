const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/orders/page.tsx', 'utf8');

// Fix search filter
let targetFilter = `    const companyName = order.companies?.trading_name || order.companies?.business_name || ''
    const orderStr = order.order_number?.toString() || ''
    const search = searchQuery.toLowerCase()
    
    return clientName.toLowerCase().includes(search) || 
           companyName.toLowerCase().includes(search) ||
           orderStr.includes(search)`;

let newFilter = `    const companyName = order.companies?.trading_name || order.companies?.business_name || ''
    const resellerName = order.resellers?.full_name || ''
    const orderStr = order.order_number?.toString() || ''
    const search = searchQuery.toLowerCase()
    
    return clientName.toLowerCase().includes(search) || 
           companyName.toLowerCase().includes(search) ||
           resellerName.toLowerCase().includes(search) ||
           orderStr.includes(search)`;

content = content.replace(targetFilter, newFilter);

// Fix table render
let targetRender = `{order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || 'Cliente Removido'}`;
let newRender = `{order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente Removido'}`;
content = content.replace(targetRender, newRender);

fs.writeFileSync('src/app/(app)/orders/page.tsx', content, 'utf8');
console.log('done orders page');
