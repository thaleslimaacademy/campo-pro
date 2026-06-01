import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

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
          <meta name="theme-color" content="#16a34a" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="GestaoFC" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
