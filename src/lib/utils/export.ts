export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    alert("Não há dados para exportar.")
    return
  }

  const separator = ','
  const keys = Object.keys(data[0])
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    data.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k]
        // Se for objeto, tenta transformar em string
        if (typeof cell === 'object') {
          cell = JSON.stringify(cell)
        }
        cell = String(cell)
        // Escapar aspas duplas e envolver em aspas se tiver vírgula ou aspas
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(separator)
    }).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
