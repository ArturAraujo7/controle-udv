/** Gera e baixa um CSV (separador ";" e BOM, para abrir certo no Excel em português). */
export function baixarCSV(nomeArquivo: string, linhas: (string | number | null | undefined)[][]) {
  const escapar = (valor: string | number | null | undefined) => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const conteudo = linhas.map(l => l.map(escapar).join(';')).join('\n')
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
