import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('belo-horizonte', {
  icons: {
    icon: '/api/city-icon/belo-horizonte',
    apple: '/api/city-icon/belo-horizonte',
  },
  title: 'Belo Horizonte Metro Memory',
  description: 'How many Metrô BH stations can you name from memory?',
  openGraph: {
    title: 'Belo Horizonte Metro Memory',
    description: 'How many Metrô BH stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/belo-horizonte',
  },
})
