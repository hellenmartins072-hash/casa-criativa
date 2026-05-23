# Plano de Implementação: Melhorias no CRM e Dashboard Financeiro

## User Review Required

> [!IMPORTANT]
> **Dashboard Financeiro**
> Para os **Lucros Estimados**, você quer que eu considere o que ainda "vai entrar" de dinheiro (Contas a Receber pendentes) subtraído do que "vai sair" (Contas a Pagar pendentes)?
> 
> **Alerta de Cliente Despedido:**
> Criarei um campo chamado "Aviso Interno" na ficha do cliente. Se você preencher esse campo com "Cliente Problemático", vai aparecer uma tarja **VERMELHA** bem grande na tela sempre que você abrir esse cliente. NUNCA sairá em orçamentos.

## Proposed Changes

---

### 1. Módulo de Clientes (Exclusão e Alerta Interno)

#### [NEW] `database_phase10_client_alert.sql`
- Script SQL para adicionar a coluna `internal_alert TEXT` na tabela `clients`.

#### [MODIFY] `src/lib/api/clients.ts`
- Adicionar a função `deleteClient(id)`.
- Atualizar `createClient` e `updateClient` para aceitarem o campo `internal_alert`.

#### [MODIFY] `src/app/(app)/clients/page.tsx`
- Adicionar o botão de Excluir (lixeira vermelha) na lista de clientes, com confirmação de segurança para evitar exclusão acidental.

#### [MODIFY] `src/components/clients/client-form.tsx`
- Adicionar um campo de texto "Aviso Interno (Oculto do Cliente)" no formulário.
- Se houver algo escrito neste campo, exibir um Banner Vermelho (Alerta) bem visível no topo da ficha.

---

### 2. Dashboard Financeiro

#### [MODIFY] `src/lib/api/analytics.ts` (ou `finance.ts`)
- Criar funções de cálculo:
  1. `getFutureExpenses()`: Soma de Lançamentos (Despesas) com status "Pendente" e data futura.
  2. `getEstimatedProfits()`: Receitas pendentes - Despesas pendentes.
  3. `getTopSellingProducts()`: Ranking de produtos por quantidade vendida (nos itens dos pedidos).
  4. `getMostProfitableProducts()`: Ranking cruzando o preço de venda com o custo de produção (baseado na ficha técnica).

#### [NEW] `src/components/finance/finance-dashboard.tsx`
- Criar os 4 "Cards" de indicadores principais no topo da tela do Financeiro:
  - 📉 Gastos Futuros
  - 📈 Lucros Estimados (A Receber)
  - 🏆 Produtos Mais Vendidos
  - 💰 Produtos Mais Lucrativos

#### [MODIFY] `src/app/(app)/finance/page.tsx`
- Importar e exibir o `FinanceDashboard` acima da Tabela de Histórico de Lançamentos.

## Verification Plan
1. Testar a exclusão de um cliente teste.
2. Escrever um aviso "Cliente despedido por atraso" em um cliente e verificar se o banner vermelho aparece apenas internamente.
3. Cadastrar uma Despesa e uma Receita para o mês que vem e verificar se os Gastos Futuros e Lucros Estimados atualizam no painel.
