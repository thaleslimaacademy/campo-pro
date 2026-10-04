import Link from 'next/link'

export default function MatriculaRootPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⚽</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: '#1F2937', marginBottom: 10, textTransform: 'uppercase', letterSpacing: -0.5 }}>GestãoFC</h1>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
          Para acessar o formulário de matrícula, utilize o link fornecido pela sua academia.
        </p>
        <p style={{ fontSize: 12, color: '#6B7280' }}>
          Ex: <span style={{ color: '#2EA866' }}>gestaofc.com.br/matricula/<strong>nome-da-academia</strong></span>
        </p>
      </div>
    </div>
  )
}
