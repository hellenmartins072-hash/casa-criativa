const fs = require('fs');

let content = fs.readFileSync('src/lib/api/orders.ts', 'utf8');

// select companies(business_name, trading_name)
content = content.replace(/companies\(business_name, trading_name\)/g, "companies(business_name, trading_name),\n        resellers(full_name)");

// select companies(business_name, trading_name, phone, cnpj)
content = content.replace(/companies\(business_name, trading_name, phone, cnpj\)/g, "companies(business_name, trading_name, phone, cnpj),\n        resellers(full_name, whatsapp, phone)");

// add relations type
content = content.replace(/companies\?: any/g, "companies?: any\n  resellers?: any");

fs.writeFileSync('src/lib/api/orders.ts', content, 'utf8');
console.log('done orders api');
