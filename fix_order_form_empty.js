const fs = require('fs');

let content = fs.readFileSync('src/components/orders/order-form.tsx', 'utf8');

// Fix reseller_id
let target1 = `      if (finalFormData.client_id === '') finalFormData.client_id = null
      if (finalFormData.company_id === '') finalFormData.company_id = null`;
let repl1 = `      if (finalFormData.client_id === '') finalFormData.client_id = null
      if (finalFormData.company_id === '') finalFormData.company_id = null
      if (finalFormData.reseller_id === '') finalFormData.reseller_id = null`;
content = content.replace(target1, repl1);

// Fix default validity to 3 days instead of 30
let target2 = `const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const formattedDeadline = thirtyDaysFromNow.toISOString().split('T')[0]`;
let repl2 = `const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const formattedDeadline = threeDaysFromNow.toISOString().split('T')[0]`;
content = content.replace(target2, repl2);

fs.writeFileSync('src/components/orders/order-form.tsx', content, 'utf8');
console.log('done fixing order form');
