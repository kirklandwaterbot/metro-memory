import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('liverpool', {
  icons: {
    icon: '/api/city-icon/liverpool',
    apple: '/api/city-icon/liverpool',
  },
  title: 'Liverpool Metro Memory',
  description: 'How many Merseyrail and City Line stations can you name from memory?',
  openGraph: {
    title: 'Liverpool Metro Memory',
    description: 'How many Merseyrail and City Line stations can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.xyz/europe/uk/liverpool',
  },
})
