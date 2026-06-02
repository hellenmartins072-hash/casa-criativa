const fs = require('fs');

let api = fs.readFileSync('src/lib/api/companies.ts', 'utf8');
api = api.replace(/payment_method\?: 'PIX' \| 'Cart[ãǜ]o de cr[éǸ]dito' \| 'Cart[ãǜ]o de d[éǸ]bito' \| 'Transfer[êǦ]ncia' \| 'Boleto' \| 'Dinheiro' \| null/g, "payment_methods?: string[] | null");
fs.writeFileSync('src/lib/api/companies.ts', api);

let comp = fs.readFileSync('src/components/companies/company-form.tsx', 'utf8');

comp = comp.replace(/payment_method: 'Boleto',/g, "payment_methods: [],");

// Remove payment_method select entirely
comp = comp.replace(/<div className="space-y-2">\s*<Label htmlFor="payment_method">Forma de Pagamento<\/Label>\s*<Select[\s\S]*?<\/Select>\s*<\/div>/g, 
`<div className="space-y-2 md:col-span-2">
  <Label>Formas de Pagamento Aceitas</Label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
    {['PIX', 'Cartão de crédito', 'Cartão de débito', 'Transferência', 'Boleto', 'Dinheiro'].map(method => (
      <div key={method} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md border">
        <Checkbox
          id={\`pay-\${method}\`}
          checked={(formData.payment_methods || []).includes(method)}
          onCheckedChange={(checked) => {
            const current = formData.payment_methods || [];
            const updated = checked ? [...current, method] : current.filter(m => m !== method);
            setFormData({ ...formData, payment_methods: updated });
          }}
        />
        <Label htmlFor={\`pay-\${method}\`} className="text-sm cursor-pointer">{method}</Label>
      </div>
    ))}
  </div>
</div>`);

fs.writeFileSync('src/components/companies/company-form.tsx', comp);
console.log('done');
