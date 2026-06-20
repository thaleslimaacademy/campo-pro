import { ClerkProvider } from '@clerk/nextjs'
import { BrandingProvider } from '@/lib/branding'
import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'GestaoFC',
  description: 'Gestao de escolinha de futebol',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <head>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#4169E1" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="GestaoFC" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="icon" href="/gestaofc-icon.png" type="image/png" />
          <link rel="apple-touch-icon" href="/gestaofc-icon.png" />
        </head>
        <body style={{ margin: 0, padding: 0, background: '#0A0E1A' }}>
          <BrandingProvider>{children}</BrandingProvider>
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
