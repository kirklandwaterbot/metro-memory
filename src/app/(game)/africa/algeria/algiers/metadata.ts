import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('algiers', {
  icons: {
    icon: '/api/city-icon/algiers',
    apple: '/api/city-icon/algiers',
  },
  title: 'Algiers Metro Memory',
  description: 'How many Algiers Metro and tram stations can you name from memory?',
  openGraph: {
    title: 'Algiers Metro Memory',
    description: 'How many Algiers Metro and tram stations can you name from memory?',
    type: 'website',
    locale: 'fr_DZ',
    url: 'https://metro-memory.xyz/africa/algeria/algiers',
  },
})
