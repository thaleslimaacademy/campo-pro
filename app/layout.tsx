import { ClerkProvider } from '@clerk/nextjs'
import { BrandingProvider } from '@/lib/branding'
import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'GestaoFC',
  description: 'Gestao de escolinha de futebol',
  // a Area dos Pais sobrescreve com o proprio manifest (app instalado abre na pagina da familia)
  manifest: '/api/manifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <head>
          <meta name="theme-color" content="#4169E1" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="GestaoFC" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
          <link rel="icon" href="/gestaofc-icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/icon-512.png" />
        </head>
        <body style={{ margin: 0, padding: 0, background: '#F6F8F7' }}>
          <BrandingProvider>{children}</BrandingProvider>
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
