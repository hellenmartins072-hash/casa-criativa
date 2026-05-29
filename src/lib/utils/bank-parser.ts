import Papa from 'papaparse'

export type ParsedBankTransaction = {
  id: string
  date: string // YYYY-MM-DD
  description: string
  amount: number
  type: 'Receita' | 'Despesa'
  raw_data?: any
}

function parseDate(dateStr: string): string {
  // Try to parse DD/MM/YYYY or DD/MM/YY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      let [d, m, y] = parts
      if (y.length === 2) y = `20${y}`
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  
  // Try YYYYMMDD (OFX)
  if (dateStr.length >= 8 && !dateStr.includes('-')) {
    const y = dateStr.substring(0, 4)
    const m = dateStr.substring(4, 6)
    const d = dateStr.substring(6, 8)
    return `${y}-${m}-${d}`
  }

  // Fallback, attempt to construct Date
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch (e) {
    return new Date().toISOString().split('T')[0]
  }
}

function generateId(date: string, amount: number, description: string): string {
  // Simple hash for CSV without unique IDs
  const str = `${date}|${amount.toFixed(2)}|${description.trim()}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `csv_${Math.abs(hash)}_${date.replace(/-/g, '')}`
}

export async function parseBankFile(file: File): Promise<ParsedBankTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return resolve([])

      // Detect OFX
      if (file.name.toLowerCase().endsWith('.ofx') || text.includes('<OFX>')) {
        resolve(parseOFX(text))
        return
      }

      // Fallback to CSV
      parseCSV(text).then(resolve).catch(reject)
    }

    reader.onerror = reject
    reader.readAsText(file)
  })
}

function parseOFX(text: string): ParsedBankTransaction[] {
  const transactions: ParsedBankTransaction[] = []
  
  // Quick and dirty OFX parser with Regex
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match
  const seenIds = new Map<string, number>()

  while ((match = stmtTrnRegex.exec(text)) !== null) {
    const block = match[1]
    
    const typeMatch = /<TRNTYPE>(.*?)(?:<|\r|\n)/.exec(block)
    const dateMatch = /<DTPOSTED>(.*?)(?:<|\r|\n)/.exec(block)
    const amtMatch = /<TRNAMT>(.*?)(?:<|\r|\n)/.exec(block)
    const fitidMatch = /<FITID>(.*?)(?:<|\r|\n)/.exec(block)
    const memoMatch = /<MEMO>(.*?)(?:<|\r|\n)/.exec(block)

    if (dateMatch && amtMatch) {
      const amountStr = amtMatch[1].trim()
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount === 0) continue

      const rawDate = dateMatch[1].trim()
      const date = parseDate(rawDate)
      
      const description = memoMatch ? memoMatch[1].trim() : 'Transação'
      let id = fitidMatch ? fitidMatch[1].trim() : generateId(date, amount, description)

      if (seenIds.has(id)) {
        const count = seenIds.get(id)! + 1
        seenIds.set(id, count)
        id = `${id}_dup${count}`
      } else {
        seenIds.set(id, 0)
      }

      transactions.push({
        id,
        date,
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? 'Despesa' : 'Receita',
        raw_data: block
      })
    }
  }

  return transactions
}

function cleanCSVText(text: string): string {
  const lines = text.split(/\r?\n/)
  // Find the first line that looks like a header (contains 'data' or 'date' and a delimiter)
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

function parseCSV(text: string): Promise<ParsedBankTransaction[]> {
  return new Promise((resolve, reject) => {
    const cleanedText = cleanCSVText(text)
    Papa.parse(cleanedText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: ParsedBankTransaction[] = []
        const seenIds = new Map<string, number>()
        
        results.data.forEach((row: any) => {
          // Normalize row keys to lowercase
          const normalizedRow: any = {}
          Object.keys(row).forEach(k => {
            normalizedRow[k.toLowerCase().trim()] = row[k]
          })

          // Try to find Date
          const dateStr = normalizedRow['data'] || normalizedRow['date'] || normalizedRow['data de lançamento']
          
          // Try to find Description
          const descStr = normalizedRow['histórico'] || normalizedRow['historico'] || normalizedRow['descrição'] || normalizedRow['description'] || normalizedRow['lançamento']

          // Try to find Amount (Bradesco often has Crédito/Débito separate or a Value column)
          let amount = 0
          let type: 'Receita' | 'Despesa' = 'Despesa'

          const creditStr = normalizedRow['crédito (r$)'] || normalizedRow['crédito'] || normalizedRow['credito']
          const debitStr = normalizedRow['débito (r$)'] || normalizedRow['débito'] || normalizedRow['debito']
          const valueStr = normalizedRow['valor'] || normalizedRow['valor (r$)'] || normalizedRow['amount']

          if (creditStr && creditStr.trim() !== '') {
            amount = parseFloat(creditStr.replace(/\./g, '').replace(',', '.'))
            type = 'Receita'
          } else if (debitStr && debitStr.trim() !== '') {
            amount = parseFloat(debitStr.replace(/\./g, '').replace(',', '.'))
            type = 'Despesa'
          } else if (valueStr && valueStr.trim() !== '') {
            const val = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'))
            if (val >= 0) {
              amount = val
              type = 'Receita'
            } else {
              amount = Math.abs(val)
              type = 'Despesa'
            }
          }

          if (dateStr && amount > 0 && descStr) {
            // Ignore headers masquerading as data (like "SALDO ANTERIOR" with 0 balance if missed)
            if (descStr.toLowerCase().includes('saldo') && descStr.toLowerCase().includes('anterior')) return
            if (descStr.toLowerCase().includes('saldo do dia')) return

            const date = parseDate(dateStr)
            
            // Try to find an ID like 'Docto.' or generate one
            const docto = normalizedRow['docto.'] || normalizedRow['documento'] || normalizedRow['id']
            let id = docto ? `bradesco_${docto.trim()}_${date.replace(/-/g,'')}` : generateId(date, amount, descStr)

            if (seenIds.has(id)) {
              const count = seenIds.get(id)! + 1
              seenIds.set(id, count)
              id = `${id}_dup${count}`
            } else {
              seenIds.set(id, 0)
            }

            transactions.push({
              id,
              date,
              description: descStr,
              amount,
              type,
              raw_data: row
            })
          }
        })

        resolve(transactions)
      },
      error: (error: any) => {
        reject(error)
      }
    })
  })
}
