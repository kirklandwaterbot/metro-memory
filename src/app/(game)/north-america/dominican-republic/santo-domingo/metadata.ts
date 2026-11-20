import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('santo-domingo', {
  icons: {
    icon: '/api/city-icon/santo-domingo',
    apple: '/api/city-icon/santo-domingo',
  },
  title: 'Santo Domingo Metro Memory',
  description: 'How many Metro de Santo Domingo stations can you name from memory?',
  openGraph: {
    title: 'Santo Domingo Metro Memory',
    description: 'How many Metro de Santo Domingo stations can you name from memory?',
    type: 'website',
    locale: 'es_DO',
    url: 'https://metro-memory.xyz/north-america/dominican-republic/santo-domingo',
  },
})
