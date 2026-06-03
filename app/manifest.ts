import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestaoFC',
    short_name: 'GestaoFC',
    description: 'Gestao de escolinha de futebol',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#16a34a',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
