const fs = require('fs');

let content = fs.readFileSync('src/components/orders/order-form.tsx', 'utf8');

// 1. Add to initialData fallback
if (!content.includes('amount_paid: 0')) {
  content = content.replace("payment_status: 'Pendente',", "payment_status: 'Pendente',\n        amount_paid: 0,");
}

// 2. Add to UI
let targetUI = `                  <div className="space-y-2">
                    <Label>Status Pgto</Label>
                    <select`;
let replUI = `                  <div className="space-y-2">
                    <Label className="text-[#5C3D8F] font-bold">Valor Pago (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.amount_paid || 0}
                      onChange={(e) => handleSelectChange('amount_paid', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Pgto</Label>
                    <select`;

if (!content.includes('Valor Pago (R$)')) {
  content = content.replace(targetUI, replUI);
}

// 3. Render Balance below Totals
let targetTotal = `                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">`;

let replTotal = `                </div>
                <div className="flex justify-between items-center text-red-600 font-bold border-t pt-2">
                  <span>Restante a Pagar:</span>
                  <span>R$ {(calculateTotals().total - (formData.amount_paid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">`;

if (!content.includes('Restante a Pagar:')) {
  content = content.replace(targetTotal, replTotal);
}

// 4. Update the Finance transaction in handleSubmit
let targetSubmit = `      let finalFormData = { ...formData }
      if (finalFormData.client_id === '') finalFormData.client_id = null
      if (finalFormData.company_id === '') finalFormData.company_id = null
      if (finalFormData.reseller_id === '') finalFormData.reseller_id = null`;

let replSubmit = `      let finalFormData = { ...formData }
      if (finalFormData.client_id === '') finalFormData.client_id = null
      if (finalFormData.company_id === '') finalFormData.company_id = null
      if (finalFormData.reseller_id === '') finalFormData.reseller_id = null

      const orderBalance = calculateTotals().total - (finalFormData.amount_paid || 0);
      if (orderBalance <= 0 && finalFormData.payment_status === 'Pendente') {
        finalFormData.payment_status = 'Pago';
      } else if (orderBalance > 0 && finalFormData.amount_paid > 0 && finalFormData.payment_status === 'Pendente') {
        finalFormData.payment_status = 'Pago Parcial';
      }`;
if (!content.includes('orderBalance <= 0')) {
  content = content.replace(targetSubmit, replSubmit);
}

fs.writeFileSync('src/components/orders/order-form.tsx', content, 'utf8');
console.log('done updating order form amount_paid');
