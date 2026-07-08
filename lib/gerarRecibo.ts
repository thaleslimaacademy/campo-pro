const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const ptBRDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export async function gerarRecibo(params: {
  tipo: string
  nome: string
  valor: number
  descricao?: string
  vencimento?: string   // data de vencimento da cobrança
  dataPagamento?: string // data em que foi pago (hoje se não informado)
  data?: string          // legado — usado como vencimento se vencimento não vier
  numero?: string
  escolaNome?: string
  escolaCidade?: string
  escolaEstado?: string
  escolaLogoUrl?: string
  responsavelNome?: string
}) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210, mx = 20
  let y = 15

  // Dados dinâmicos da escola
  const nomeEscola = params.escolaNome?.includes('—')
    ? params.escolaNome.split('—').pop()?.trim() || params.escolaNome
    : params.escolaNome || 'GestãoFC'
  const cidade = params.escolaCidade || 'Iturama'
  const estado = params.escolaEstado || 'MG'

  // Datas
  const hoje = new Date().toISOString().slice(0, 10)
  const dataVenc = params.vencimento || params.data || hoje
  const dataPago = params.dataPagamento || hoje

  // Logo da escola (tenta carregar, fallback sem logo)
  if (params.escolaLogoUrl) {
    try {
      const resp = await fetch(params.escolaLogoUrl)
      if (resp.ok) {
        const blob = await resp.blob()
        const ext = blob.type.includes('png') ? 'PNG' : 'JPEG'
        const b64: string = await new Promise((res) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.readAsDataURL(blob)
        })
        doc.addImage(b64, ext, W / 2 - 20, y, 40, 40)
        y += 48
      }
    } catch { /* sem logo */ }
  }

  // Header escola
  doc.setFillColor(10, 14, 26)
  doc.rect(0, y, W, 14, 'F')
  doc.setTextColor(65, 105, 225)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(nomeEscola.toUpperCase(), W / 2, y + 9.5, { align: 'center' })
  y += 18

  // Título
  doc.setTextColor(25, 25, 25)
  doc.setFontSize(18)
  doc.text('RECIBO DE PAGAMENTO', W / 2, y, { align: 'center' })
  y += 6

  doc.setDrawColor(65, 105, 225)
  doc.setLineWidth(0.6)
  doc.line(mx, y, W - mx, y)
  y += 8

  // Número e datas
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  if (params.numero) doc.text(`Nº ${params.numero}`, mx, y)
  doc.text(`Emitido em: ${ptBRDate(dataPago)}`, W - mx, y, { align: 'right' })
  y += 12

  // Badge tipo
  const tipoLabel = params.tipo === 'MENSALIDADE' ? 'Mensalidade'
    : params.tipo === 'PATROCINIO' ? 'Patrocínio'
    : params.tipo === 'TAXA' ? 'Taxa de Matrícula'
    : params.tipo

  doc.setFillColor(225, 235, 255)
  doc.roundedRect(mx, y, 52, 7, 1, 1, 'F')
  doc.setFontSize(8)
  doc.setTextColor(65, 105, 225)
  doc.setFont('helvetica', 'bold')
  doc.text(tipoLabel.toUpperCase(), mx + 26, y + 4.8, { align: 'center' })
  y += 14

  // Corpo
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)

  const linha = (label: string, valor: string, yy: number) => {
    doc.setFont('helvetica', 'bold'); doc.text(label, mx, yy)
    doc.setFont('helvetica', 'normal'); doc.text(valor, mx + 48, yy)
  }

  linha('Recebemos de:', params.nome || '—', y); y += 9
  if (params.responsavelNome) { linha('Responsável:', params.responsavelNome, y); y += 9 }
  linha('Referente a:', params.descricao || tipoLabel, y); y += 9
  linha('Vencimento:', ptBRDate(dataVenc), y); y += 9
  linha('Data de pagamento:', ptBRDate(dataPago), y); y += 11

  // Bloco valor
  doc.setFillColor(10, 14, 26)
  doc.rect(mx, y, W - mx * 2, 16, 'F')
  doc.setTextColor(0, 214, 122)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(`VALOR PAGO: ${brl(params.valor)}`, W / 2, y + 11, { align: 'center' })
  y += 24

  // Linha assinatura
  doc.setDrawColor(65, 105, 225)
  doc.setLineWidth(0.4)
  doc.line(mx, y, W - mx, y)
  y += 14

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`${cidade} – ${estado}, ${ptBRDate(dataPago)}`, W / 2, y, { align: 'center' })
  y += 18

  doc.setDrawColor(65, 105, 225)
  doc.line(W / 2 - 45, y, W / 2 + 45, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(nomeEscola, W / 2, y, { align: 'center' })

  // Rodapé
  doc.setFillColor(10, 14, 26)
  doc.rect(0, 281, W, 16, 'F')
  doc.setTextColor(100, 130, 200)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('gestaofc.com.br', W / 2, 291, { align: 'center' })

  const safe = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`recibo-${safe(tipoLabel)}-${safe(params.nome || 'atleta')}-${dataPago}.pdf`)
}
