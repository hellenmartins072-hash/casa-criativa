const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/orders/[id]/pdf/page.tsx', 'utf8');

content = content.replace(
  /const clientName = order\.clients\?\.full_name \|\| order\.companies\?\.trading_name \|\| order\.companies\?\.business_name \|\| 'Cliente Removido'/g, 
  "const clientName = order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente Removido'"
);

content = content.replace(
  /<strong>Emissão:<\/strong> \{new Date\(order\.created_at\)\.toLocaleDateString\('pt-BR'\)\}/g,
  "<strong>Data do Orçamento/Emissão:</strong> {new Date(order.quote_date || order.created_at).toLocaleDateString('pt-BR')}\n            </p>\n            {order.order_date && (\n              <p className=\"mt-1 text-sm text-gray-600\">\n                <strong>Data do Pedido/Aprovação:</strong> {new Date(order.order_date).toLocaleDateString('pt-BR')}"
);

// Add logic to get clientPhone if not available, which isn't there, wait.
// Let's replace the client header part if it exists.
let targetClient = `              <p className="font-bold text-gray-800 text-lg">{clientName}</p>
              {order.clients?.cpf && <p>CPF: {order.clients?.cpf}</p>}
              {order.companies?.cnpj && <p>CNPJ: {order.companies?.cnpj}</p>}
              {(order.clients?.whatsapp || order.companies?.phone) && (
                <p>Tel/WhatsApp: {order.clients?.whatsapp || order.companies?.phone}</p>
              )}
              {(order.clients?.email || order.companies?.email) && (
                <p>Email: {order.clients?.email || order.companies?.email}</p>
              )}
              {(order.clients?.address || order.companies?.address) && (
                <p className="mt-2 text-gray-600">{order.clients?.address || order.companies?.address}</p>
              )}`;

let replacementClient = `              <p className="font-bold text-gray-800 text-lg">{clientName}</p>
              {(order.clients as any)?.cpf && <p>CPF: {(order.clients as any)?.cpf}</p>}
              {(order.companies as any)?.cnpj && <p>CNPJ: {(order.companies as any)?.cnpj}</p>}
              {(order.clients?.whatsapp || order.companies?.phone || order.resellers?.whatsapp || order.resellers?.phone) && (
                <p>Tel/WhatsApp: {order.clients?.whatsapp || order.companies?.phone || order.resellers?.whatsapp || order.resellers?.phone}</p>
              )}
              {(order.clients?.email || order.companies?.email || order.resellers?.email) && (
                <p>Email: {order.clients?.email || order.companies?.email || order.resellers?.email}</p>
              )}
              {(order.clients?.address || order.companies?.address || order.resellers?.address) && (
                <p className="mt-2 text-gray-600">{order.clients?.address || order.companies?.address || order.resellers?.address}</p>
              )}`;

content = content.replace(targetClient, replacementClient);

// Fix total amount and installments mapping. We already have the PDF structure mostly done but let's check what's missing.
fs.writeFileSync('src/app/(app)/orders/[id]/pdf/page.tsx', content, 'utf8');
console.log('done pdf');
