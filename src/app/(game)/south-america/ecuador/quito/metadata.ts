import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('quito', {
  icons: {
    icon: '/api/city-icon/quito',
    apple: '/api/city-icon/quito',
  },
  title: 'Quito Metro Memory',
  description: 'How many Metro de Quito stations can you name from memory?',
  openGraph: {
    title: 'Quito Metro Memory',
    description: 'How many Metro de Quito stations can you name from memory?',
    type: 'website',
    locale: 'es_EC',
    url: 'https://metro-memory.xyz/south-america/ecuador/quito',
  },
})
