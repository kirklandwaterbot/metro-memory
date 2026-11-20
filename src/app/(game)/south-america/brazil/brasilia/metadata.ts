import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('brasilia', {
  icons: {
    icon: '/api/city-icon/brasilia',
    apple: '/api/city-icon/brasilia',
  },
  title: 'Brasília Metro Memory',
  description: 'How many Metrô-DF stations can you name from memory?',
  openGraph: {
    title: 'Brasília Metro Memory',
    description: 'How many Metrô-DF stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/brasilia',
  },
})
