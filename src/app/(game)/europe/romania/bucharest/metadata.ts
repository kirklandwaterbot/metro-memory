import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bucharest', {
  icons: {
    icon: '/api/city-icon/bucharest',
    apple: '/api/city-icon/bucharest',
  },
  title: 'Bucharest Metro Memory',
  description: 'How many Bucharest Metro stations can you name from memory?',
  openGraph: {
    title: 'Bucharest Metro Memory',
    description: 'How many Bucharest Metro stations can you name from memory?',
    type: 'website',
    locale: 'ro_RO',
    url: 'https://metro-memory.xyz/europe/romania/bucharest',
  },
})
