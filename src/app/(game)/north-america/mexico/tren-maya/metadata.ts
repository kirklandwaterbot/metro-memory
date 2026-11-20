import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tren-maya', {
  icons: {
    icon: '/api/city-icon/tren-maya',
    apple: '/api/city-icon/tren-maya',
  },
  title: 'Tren Maya Memory',
  description: 'How many Tren Maya stations can you name from memory?',
  openGraph: {
    title: 'Tren Maya Memory',
    description: 'How many Tren Maya stations can you name from memory?',
    type: 'website',
    locale: 'es_MX',
    url: 'https://metro-memory.xyz/north-america/mexico/tren-maya',
  },
})
