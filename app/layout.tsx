import { ClerkProvider } from '@clerk/nextjs'
import { BrandingProvider } from '@/lib/branding'
import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'GestaoFC',
  description: 'Gestao de escolinha de futebol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#FF6B00" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="GestaoFC" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body><BrandingProvider>{children}</BrandingProvider><ServiceWorkerRegister /></body>
      </html>
    </ClerkProvider>
  )
}
