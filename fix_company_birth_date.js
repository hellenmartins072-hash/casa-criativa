const fs = require('fs');

let content = fs.readFileSync('src/components/companies/company-form.tsx', 'utf8');

// Add to state
content = content.replace(/boleto_days: 30/g, "boleto_days: 30,\n        birth_date: ''");

// Add to UI
let targetUI = `<div className="space-y-2">
                <Label htmlFor="trading_name">Nome Fantasia</Label>
                <Input
                  id="trading_name"
                  name="trading_name"
                  value={formData.trading_name || ''}
                  onChange={handleChange}
                />
              </div>`;

let newUI = `<div className="space-y-2">
                <Label htmlFor="trading_name">Nome Fantasia</Label>
                <Input
                  id="trading_name"
                  name="trading_name"
                  value={formData.trading_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Fundação</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={handleChange}
                />
              </div>`;

content = content.replace(targetUI, newUI);

fs.writeFileSync('src/components/companies/company-form.tsx', content, 'utf8');
console.log('done company birth_date');
