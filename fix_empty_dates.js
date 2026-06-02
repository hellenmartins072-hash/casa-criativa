const fs = require('fs');

// 1. Fix company-form.tsx
let companyContent = fs.readFileSync('src/components/companies/company-form.tsx', 'utf8');
let companyTarget = `      const payloadToSave = { ...formData }
      delete payloadToSave.contacts`;
let companyNew = `      const payloadToSave = { ...formData }
      delete payloadToSave.contacts
      if (payloadToSave.birth_date === "") payloadToSave.birth_date = null;`;
companyContent = companyContent.replace(companyTarget, companyNew);
fs.writeFileSync('src/components/companies/company-form.tsx', companyContent, 'utf8');

// 2. Fix reseller-form-dialog.tsx
let resellerContent = fs.readFileSync('src/components/reseller-form-dialog.tsx', 'utf8');
let resellerTarget = `    try {
      if (initialData?.id) {
        await updateReseller(initialData.id, formData)`;
let resellerNew = `    try {
      const payloadToSave = { ...formData };
      if (payloadToSave.birth_date === "") payloadToSave.birth_date = null;

      if (initialData?.id) {
        await updateReseller(initialData.id, payloadToSave)`;
resellerContent = resellerContent.replace(resellerTarget, resellerNew);
resellerContent = resellerContent.replace(/await createReseller\(formData\)/g, 'await createReseller(payloadToSave)');
fs.writeFileSync('src/components/reseller-form-dialog.tsx', resellerContent, 'utf8');

console.log('done fixing empty dates');
