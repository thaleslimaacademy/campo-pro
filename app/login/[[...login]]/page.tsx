import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E1A 0%, #0D1535 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle,rgba(65,105,225,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle,rgba(0,191,255,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, boxShadow: '0 0 32px rgba(65,105,225,0.4)' }} />
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: '28px', color: '#F0F4FF', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>GestaoFC</h1>
        <p style={{ fontSize: '13px', color: 'rgba(125,211,252,0.6)', margin: 0 }}>Gestao profissional de escolinhas</p>
      </div>
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#4169E1',
            colorBackground: '#0D1020',
            colorText: '#F0F4FF',
            colorTextSecondary: 'rgba(240,244,255,0.5)',
            colorInputBackground: '#141830',
            colorInputText: '#F0F4FF',
            colorNeutral: '#7DD3FC',
            borderRadius: '12px',
          },
          elements: {
            card: { background: '#0F1428', border: '1px solid rgba(65,105,225,0.25)', boxShadow: '0 8px 32px rgba(65,105,225,0.1)' },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            socialButtonsBlockButton: { background: '#141830', border: '1px solid rgba(65,105,225,0.2)', color: '#F0F4FF' },
            socialButtonsBlockButtonText: { color: '#F0F4FF' },
            formButtonPrimary: { background: 'linear-gradient(135deg,#4169E1,#1A3FA8)', color: '#fff', fontWeight: 800, fontFamily: 'Syne, sans-serif', boxShadow: '0 0 20px rgba(65,105,225,0.35)' },
            footerActionLink: { color: '#00BFFF' },
            formFieldInput: { background: '#141830', border: '1px solid rgba(65,105,225,0.25)', color: '#F0F4FF' },
            formFieldLabel: { color: 'rgba(240,244,255,0.5)' },
            dividerLine: { background: 'rgba(65,105,225,0.2)' },
            dividerText: { color: 'rgba(240,244,255,0.3)' },
            identityPreviewText: { color: '#F0F4FF' },
            formResendCodeLink: { color: '#00BFFF' },
          }
        }}
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;900&family=Inter:wght@400;500&display=swap" />
    </div>
  )
}
