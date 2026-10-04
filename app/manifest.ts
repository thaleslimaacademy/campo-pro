import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestãoFC',
    short_name: 'GestãoFC',
    description: 'Gestão de escolinha de futebol',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F6F8F7',
    theme_color: '#2EA866',
    orientation: 'portrait',
    categories: ['sports', 'business', 'education'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
