import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('toulouse', {
  icons: {
    icon: '/api/city-icon/toulouse',
    apple: '/api/city-icon/toulouse',
  },
  title: 'Toulouse Metro Memory',
  description: 'How many Toulouse Metro stations can you name from memory?',
  openGraph: {
    title: 'Toulouse Metro Memory',
    description: 'How many Toulouse Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/toulouse',
  },
})
