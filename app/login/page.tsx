import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle,rgba(57,255,20,0.1) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', right: '-60px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#39FF14,#00aa00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 800, color: '#000',
          fontFamily: 'Syne, sans-serif',
          boxShadow: '0 0 24px rgba(57,255,20,0.4)',
          margin: '0 auto 16px',
        }}>G</div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px',
          color: '#F0F0F0', margin: '0 0 4px', letterSpacing: '-0.5px',
        }}>GestaoFC</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Gestao profissional de escolinhas
        </p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#39FF14',
            colorBackground: '#0D0D0D',
            colorText: '#F0F0F0',
            colorTextSecondary: 'rgba(255,255,255,0.5)',
            colorInputBackground: 'rgba(255,255,255,0.06)',
            colorInputText: '#F0F0F0',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          elements: {
            card: {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'none',
            },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            socialButtonsBlockButton: {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F0F0F0',
            },
            formButtonPrimary: {
              background: 'linear-gradient(135deg,#39FF14,#00cc00)',
              color: '#000',
              fontWeight: 800,
              fontFamily: 'Syne, sans-serif',
              boxShadow: '0 0 16px rgba(57,255,20,0.3)',
            },
            footerActionLink: { color: '#39FF14' },
          }
        }}
      />
    </div>
  )
}
