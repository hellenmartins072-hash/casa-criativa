const fs = require('fs');

const filesToFix = [
  'src/components/companies/company-form.tsx',
  'src/components/crm/client-timeline.tsx',
  'src/components/finance/finance-dashboard.tsx',
  'src/components/kanban/kanban-board.tsx',
  'src/components/layout/notifications-bell.tsx',
  'src/components/materials/material-form.tsx',
  'src/components/orders/file-upload.tsx',
  'src/components/orders/order-form.tsx',
  'src/components/products/product-form.tsx',
  'src/components/reseller-form-dialog.tsx',
  'src/components/store-form-dialog.tsx',
  'src/components/suppliers/supplier-form.tsx',
  'src/components/calendar/delivery-calendar.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix handleSelectChange signature
  content = content.replace(/const handleSelectChange = \(name: string, value: string\) => {/g, 'const handleSelectChange = (name: string, value: string | null) => {');
  content = content.replace(/const handleSelectChange = \(field: keyof [a-zA-Z]+, value: string\) => {/g, match => match.replace('value: string', 'value: string | null'));

  // Fix Skeleton import
  if (file.includes('finance-dashboard')) {
    content = content.replace(/, Skeleton /g, ' ');
  }

  // Fix client-timeline dispatch
  if (file.includes('client-timeline')) {
    content = content.replace(/onValueChange={setStatusFilter}/g, 'onValueChange={(v) => setStatusFilter(v || "")}');
  }
  
  // Fix products product-form.tsx onValueChange={setCategoryId}
  if (file.includes('product-form.tsx')) {
    content = content.replace(/onValueChange={setCategoryId}/g, 'onValueChange={(v) => setCategoryId(v || "")}');
  }

  // Fix kanban title
  if (file.includes('kanban-board')) {
    content = content.replace(/ title="[^"]+"/g, '');
  }

  // Fix asChild on buttons/triggers where not allowed
  if (file.includes('notifications-bell.tsx')) {
    content = content.replace(/<Button variant="ghost" size="icon" asChild>/g, '<Button variant="ghost" size="icon">');
  }
  if (file.includes('file-upload.tsx')) {
    content = content.replace(/<Button variant="ghost" size="icon" className="h-6 w-6" asChild>/g, '<Button variant="ghost" size="icon" className="h-6 w-6">');
  }
  if (file.includes('order-form.tsx')) {
    content = content.replace(/<Button variant="outline" asChild>/g, '<Button variant="outline">');
    content = content.replace(/<Button asChild className="w-full">/g, '<Button className="w-full">');
  }
  if (file.includes('reseller-form-dialog.tsx') || file.includes('store-form-dialog.tsx')) {
    content = content.replace(/<DialogTrigger asChild>/g, '<DialogTrigger>');
  }

  // Fix calendar locale
  if (file.includes('delivery-calendar.tsx')) {
    content = content.replace(/import ptBR from 'date-fns\/locale\/pt-BR'/g, "import { ptBR } from 'date-fns/locale/pt-BR'");
  }

  // Fix companies
  if (file.includes('company-form.tsx')) {
    content = content.replace(/<div className="space-y-2 md:col-span-2 mt-2 pt-2 border-t">[\s\S]*?<div className="flex items-center space-x-2 md:col-span-2 mt-4 pt-2 border-t">/g, '<div className="flex items-center space-x-2 md:col-span-2 mt-4 pt-2 border-t">');
  }

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Done');
