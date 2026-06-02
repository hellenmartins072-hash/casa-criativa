const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/finance/page.tsx', 'utf8');

// Add fields to newPayable state
content = content.replace(/newPayable, setNewPayable\] = useState<Partial<Payable>>\(\{/g, "newPayable, setNewPayable] = useState<Partial<Payable>>({\n    is_recurring: false,\n    current_installment: 1,\n    total_installments: 1,\n    recurrence_period: 'Mensal',");

// Add recurring checkbox UI
let targetUI = `<div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay_category">Categoria</Label>`;
let newUI = `<div className="flex items-center space-x-2 my-4">
                  <Checkbox 
                    id="is_recurring" 
                    checked={newPayable.is_recurring} 
                    onCheckedChange={(c) => setNewPayable({...newPayable, is_recurring: !!c})} 
                  />
                  <Label htmlFor="is_recurring" className="font-semibold cursor-pointer">Pagamento Recorrente / Parcelado</Label>
                </div>
                {newPayable.is_recurring && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                    <div className="space-y-2">
                      <Label>Tipo Recorrência</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
                        value={newPayable.recurrence_period || 'Mensal'}
                        onChange={(e) => setNewPayable({...newPayable, recurrence_period: e.target.value})}
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
                        value={newPayable.current_installment || 1} 
                        onChange={(e) => setNewPayable({...newPayable, current_installment: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total de Parcelas</Label>
                      <Input 
                        type="number" min="1" 
                        value={newPayable.total_installments || 1} 
                        onChange={(e) => setNewPayable({...newPayable, total_installments: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay_category">Categoria</Label>`;
content = content.replace(targetUI, newUI);

// Check if Checkbox is imported
if (!content.includes('import { Checkbox }')) {
  content = content.replace(/import { Input } from '@\/components\/ui\/input'/g, "import { Input } from '@/components/ui/input'\nimport { Checkbox } from '@/components/ui/checkbox'");
}

fs.writeFileSync('src/app/(app)/finance/page.tsx', content, 'utf8');
console.log('done finance page');
