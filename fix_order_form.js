const fs = require('fs');

let content = fs.readFileSync('src/components/orders/order-form.tsx', 'utf8');

// Imports
content = content.replace(/import { getCompanies, createCompany } from '@\/lib\/api\/companies'/g, 
"import { getCompanies, createCompany } from '@/lib/api/companies'\nimport { getResellers } from '@/lib/api/resellers'\nimport { ResellerFormDialog } from '@/components/reseller-form-dialog'");

// State vars
content = content.replace(/const \[companies, setCompanies\] = useState<any\[\]>\(\[\]\)/g,
"const [companies, setCompanies] = useState<any[]>([])\n  const [resellers, setResellers] = useState<any[]>([])\n  const [isNewResellerModalOpen, setIsNewResellerModalOpen] = useState(false)");

// Default Form values
content = content.replace(/company_id: '',/g, "company_id: '',\n      reseller_id: '',\n      quote_date: new Date().toISOString().split('T')[0],\n      order_date: '',");

// LoadSupportData calls
content = content.replace(/const \[cliRes, compRes, prodRes, shipRes\] = await Promise\.allSettled\(\[/g, "const [cliRes, compRes, prodRes, shipRes, resRes] = await Promise.allSettled([");
content = content.replace(/getShippingPartners\(\)/g, "getShippingPartners(),\n          getResellers()");
content = content.replace(/if \(shipRes\.status === 'fulfilled'\) setShippingPartners\(shipRes\.value \|\| \[\]\)/g, "if (shipRes.status === 'fulfilled') setShippingPartners(shipRes.value || [])\n        if (resRes && resRes.status === 'fulfilled') setResellers(resRes.value || [])");

// UI Changes
// Reseller UI
let targetUI = `              <div className="text-center text-sm text-muted-foreground">- OU -</div>
              <div className="space-y-2">
                <Label>Empresa (B2B)</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.company_id || 'none'}
                    onChange={(e) => handleSelectChange('company_id', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="none">-- Nenhuma --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.business_name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewCompanyModalOpen(true)} title="Nova Empresa">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>`;

let replacementUI = `              <div className="text-center text-sm text-muted-foreground">- OU -</div>
              <div className="space-y-2">
                <Label>Empresa (B2B)</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.company_id || 'none'}
                    onChange={(e) => handleSelectChange('company_id', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="none">-- Nenhuma --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.business_name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewCompanyModalOpen(true)} title="Nova Empresa">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">- OU -</div>
              <div className="space-y-2">
                <Label>Revendedor Autorizado</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.reseller_id || 'none'}
                    onChange={(e) => handleSelectChange('reseller_id', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-purple-50 border-purple-200 text-[#5C3D8F]"
                  >
                    <option value="none">-- Nenhum --</option>
                    {resellers.map(r => (
                      <option key={r.id} value={r.id}>{r.full_name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewResellerModalOpen(true)} title="Novo Revendedor">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>`;

content = content.replace(targetUI, replacementUI);

// Quote Date UI
let quoteUI = `<div className="space-y-2">
                  <Label>Status do Pedido</Label>`;
let newQuoteUI = `<div className="space-y-2">
                  <Label>Data do Orçamento</Label>
                  <Input 
                    type="date"
                    value={formData.quote_date || ''}
                    onChange={(e) => handleSelectChange('quote_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do Pedido (Aprovação)</Label>
                  <Input 
                    type="date"
                    value={formData.order_date || ''}
                    onChange={(e) => handleSelectChange('order_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status do Pedido</Label>`;

content = content.replace(quoteUI, newQuoteUI);

// Reseller Form Dialog mount
let dialogUI = `<CompanyForm 
                onSuccess={(newComp) => {
                  setCompanies([...companies, newComp])
                  handleSelectChange('company_id', newComp.id)
                  setIsNewCompanyModalOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </form>
    </Card>
  )
}`;
let newDialogUI = `<CompanyForm 
                onSuccess={(newComp) => {
                  setCompanies([...companies, newComp])
                  handleSelectChange('company_id', newComp.id)
                  setIsNewCompanyModalOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>

          <ResellerFormDialog 
            open={isNewResellerModalOpen} 
            onOpenChange={setIsNewResellerModalOpen} 
            onSuccess={async () => {
              const resRes = await getResellers();
              setResellers(resRes || []);
            }} 
          />
        </CardContent>
      </form>
    </Card>
  )
}`;
content = content.replace(dialogUI, newDialogUI);

fs.writeFileSync('src/components/orders/order-form.tsx', content, 'utf8');
console.log('done order form');
