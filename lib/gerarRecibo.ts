const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const ptBRDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export async function gerarRecibo(params: {
  tipo: string; nome: string; valor: number; descricao?: string; data: string; numero?: string
}) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210, mx = 20
  let y = 15

  try {
    const resp = await fetch('/logo-tlfa.jpg')
    if (resp.ok) {
      const blob = await resp.blob()
      const b64: string = await new Promise((res) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.readAsDataURL(blob)
      })
      doc.addImage(b64, 'JPEG', W / 2 - 22, y, 44, 44)
      y += 50
    }
  } catch { /* sem logo */ }

  doc.setFillColor(20, 16, 4)
  doc.rect(0, y, W, 13, 'F')
  doc.setTextColor(212, 175, 55)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('THALES LIMA FOOTBALL ACADEMY', W / 2, y + 8.5, { align: 'center' })
  y += 17

  doc.setTextColor(25, 25, 25)
  doc.setFontSize(17)
  doc.text('RECIBO DE PAGAMENTO', W / 2, y, { align: 'center' })
  y += 6

  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.6)
  doc.line(mx, y, W - mx, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  if (params.numero) doc.text(`Nº ${params.numero}`, mx, y)
  doc.text(`Data: ${ptBRDate(params.data)}`, W - mx, y, { align: 'right' })
  y += 10

  const tipoLabel = params.tipo === 'MENSALIDADE' ? 'Mensalidade'
    : params.tipo === 'PATROCINIO' ? 'Patrocínio' : params.tipo

  doc.setFillColor(248, 244, 228)
  doc.roundedRect(mx, y, 48, 7, 1, 1, 'F')
  doc.setFontSize(8)
  doc.setTextColor(140, 110, 10)
  doc.setFont('helvetica', 'bold')
  doc.text(tipoLabel.toUpperCase(), mx + 24, y + 4.8, { align: 'center' })
  y += 14

  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)

  const linha = (label: string, valor: string, yy: number) => {
    doc.setFont('helvetica', 'bold'); doc.text(label, mx, yy)
    doc.setFont('helvetica', 'normal'); doc.text(valor, mx + 42, yy)
  }

  linha('Recebemos de:', params.nome, y); y += 9
  linha('Referente a:', params.descricao || tipoLabel, y); y += 9
  y += 2

  doc.setFillColor(20, 16, 4)
  doc.rect(mx, y, W - mx * 2, 15, 'F')
  doc.setTextColor(212, 175, 55)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`VALOR: ${brl(params.valor)}`, W / 2, y + 10, { align: 'center' })
  y += 22

  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.4)
  doc.line(mx, y, W - mx, y)
  y += 14

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`Iturama – MG, ${ptBRDate(params.data)}`, W / 2, y, { align: 'center' })
  y += 18

  doc.setDrawColor(160, 130, 40)
  doc.line(W / 2 - 42, y, W / 2 + 42, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Thales Lima – Thales Lima Football Academy', W / 2, y, { align: 'center' })

  doc.setFillColor(20, 16, 4)
  doc.rect(0, 281, W, 16, 'F')
  doc.setTextColor(212, 175, 55)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('gestaofc.com.br  |  @tlfa.iturama  |  @tlfa.alexandrita', W / 2, 291, { align: 'center' })

  const safe = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`recibo-${safe(params.tipo)}-${safe(params.nome)}-${params.data}.pdf`)
}