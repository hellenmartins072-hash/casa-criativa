import Papa from 'papaparse'

const csvText = `Extrato de Conta Corrente
Conta: 1234-5
Agência: 0001
Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)
01/05/2026;PIX RECEBIDO;12345;100,00;;100,00
02/05/2026;PAGAMENTO CONTA;54321;;50,00;50,00
`

Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    console.log("Papa results:", results.data)
  }
})
