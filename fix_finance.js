const fs = require('fs');
let api = fs.readFileSync('src/lib/api/finance.ts', 'utf8');

api = api.replace(/created_at\?: string/g, "created_at?: string\n  is_recurring?: boolean\n  current_installment?: number\n  total_installments?: number\n  recurrence_period?: string");

fs.writeFileSync('src/lib/api/finance.ts', api, 'utf8');
console.log('done finance api');
