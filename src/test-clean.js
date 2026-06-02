import Papa from 'papaparse'

function cleanCSVText(text) {
  const lines = text.split(/\r?\n/)
  let headerIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase()
    if ((lower.includes('data') || lower.includes('date')) && (lower.includes(';') || lower.includes(','))) {
      headerIndex = i
      break
    }
  }
  return lines.slice(headerIndex).join('\n')
}

const csvText = `Extrato de Conta Corrente
Conta: 1234-5
Agência: 0001
Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)
01/05/2026;PIX RECEBIDO;12345;100,00;;100,00
02/05/2026;PAGAMENTO CONTA;54321;;50,00;50,00
`

const cleanedText = cleanCSVText(csvText)
console.log("Cleaned text:", cleanedText)

Papa.parse(cleanedText, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    console.log("Papa results:", results.data)
  }
})
