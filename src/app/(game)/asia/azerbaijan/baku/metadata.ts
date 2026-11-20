import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('baku', {
  icons: {
    icon: '/api/city-icon/baku',
    apple: '/api/city-icon/baku',
  },
  title: 'Baku Metro Memory',
  description: 'How many Baku Metro stations can you name from memory?',
  openGraph: {
    title: 'Baku Metro Memory',
    description: 'How many Baku Metro stations can you name from memory?',
    type: 'website',
    locale: 'az_AZ',
    url: 'https://metro-memory.xyz/asia/azerbaijan/baku',
  },
})
