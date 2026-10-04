import { SignIn } from '@clerk/nextjs'
export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F6F8F7 0%, #FFFFFF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle,rgba(46,168,102,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle,rgba(46,168,102,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <img src="/gestaofc-logo-horizontal.png" alt="GestãoFC" style={{ width: 240, maxWidth: '80vw', height: 'auto', display: 'block', margin: '0 auto 10px' }} />
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Gestao profissional de escolinhas</p>
      </div>
      <SignIn forceRedirectUrl='/dashboard'
        appearance={{
          variables: {
            colorPrimary: '#2EA866',
            colorBackground: '#FFFFFF',
            colorText: '#1F2937',
            colorTextSecondary: '#6B7280',
            colorInputBackground: '#F3F5F4',
            colorInputText: '#1F2937',
            colorNeutral: '#1F2937',
            borderRadius: '12px',
          },
          elements: {
            card: { background: '#FFFFFF', border: '1px solid rgba(46,168,102,0.25)', boxShadow: '0 8px 32px rgba(46,168,102,0.1)' },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            socialButtonsBlockButton: { background: '#F3F5F4', border: '1px solid rgba(46,168,102,0.2)', color: '#1F2937' },
            socialButtonsBlockButtonText: { color: '#1F2937' },
            formButtonPrimary: { background: 'linear-gradient(135deg,#2EA866,#23874F)', color: '#fff', fontWeight: 800, fontFamily: 'Syne, sans-serif', boxShadow: '0 0 20px rgba(46,168,102,0.35)' },
            footerActionLink: { color: '#23874F' },
            formFieldInput: {
              background: '#F3F5F4',
              border: '1px solid rgba(46,168,102,0.25)',
              color: '#1F2937',
              colorScheme: 'light',
              WebkitTextFillColor: '#1F2937',
              '&:-webkit-autofill': {
                WebkitTextFillColor: '#1F2937',
                WebkitBoxShadow: '0 0 0px 1000px #F3F5F4 inset',
                caretColor: '#1F2937',
              },
              '&:-webkit-autofill:focus': {
                WebkitTextFillColor: '#1F2937',
                WebkitBoxShadow: '0 0 0px 1000px #F3F5F4 inset',
              },
              '&::placeholder': { color: '#6B7280' },
            },
            formFieldLabel: { color: '#374151' },
            dividerLine: { background: 'rgba(46,168,102,0.2)' },
            dividerText: { color: '#6B7280' },
            identityPreviewText: { color: '#1F2937' },
            formResendCodeLink: { color: '#23874F' },
          }
        }}
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;900&family=Inter:wght@400;500&display=swap" />
    </div>
  )
}
