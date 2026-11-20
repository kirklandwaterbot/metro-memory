import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('rennes', {
  icons: {
    icon: '/api/city-icon/rennes',
    apple: '/api/city-icon/rennes',
  },
  title: 'Rennes Metro Memory',
  description: 'How many Rennes Metro stations can you name from memory?',
  openGraph: {
    title: 'Rennes Metro Memory',
    description: 'How many Rennes Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/rennes',
  },
})
