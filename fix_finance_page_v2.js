const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/finance/page.tsx', 'utf8');

// Add fields to formData state
content = content.replace(/bank_account_id: ''/g, "bank_account_id: '',\n    is_recurring: false,\n    current_installment: 1,\n    total_installments: 1,\n    recurrence_period: 'Mensal'");

// Add recurring checkbox UI
let targetUI = `<div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>`;
let newUI = `<div className="flex items-center space-x-2 my-4">
                  <Checkbox 
                    id="is_recurring" 
                    checked={formData.is_recurring as boolean} 
                    onCheckedChange={(c) => setFormData({...formData, is_recurring: !!c})} 
                  />
                  <Label htmlFor="is_recurring" className="font-semibold cursor-pointer">Pagamento Recorrente / Parcelado</Label>
                </div>
                {formData.is_recurring && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    <div className="space-y-2">
                      <Label>Tipo Recorrência</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
                        value={formData.recurrence_period || 'Mensal'}
                        onChange={(e) => setFormData({...formData, recurrence_period: e.target.value})}
                      >
                        <option value="Semanal">Semanal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Parcela Atual (Já Paga)</Label>
                      <Input 
                        type="number" min="1" 
                        value={formData.current_installment || 1} 
                        onChange={(e) => setFormData({...formData, current_installment: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total de Parcelas</Label>
                      <Input 
                        type="number" min="1" 
                        value={formData.total_installments || 1} 
                        onChange={(e) => setFormData({...formData, total_installments: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>`;
content = content.replace(targetUI, newUI);

// Update createTransaction payload
content = content.replace(/bank_account_id: formData\.bank_account_id \|\| null/g, "bank_account_id: formData.bank_account_id || null,\n        is_recurring: formData.is_recurring,\n        current_installment: formData.current_installment,\n        total_installments: formData.total_installments,\n        recurrence_period: formData.recurrence_period");

// Reset form
content = content.replace(/bank_account_id: accounts\.length > 0 \? accounts\[0\]\.id : ''/g, "bank_account_id: accounts.length > 0 ? accounts[0].id : '', is_recurring: false, current_installment: 1, total_installments: 1, recurrence_period: 'Mensal'");

fs.writeFileSync('src/app/(app)/finance/page.tsx', content, 'utf8');
console.log('done finance page update');
