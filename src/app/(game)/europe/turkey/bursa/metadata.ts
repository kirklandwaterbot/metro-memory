import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bursa', {
  icons: {
    icon: '/api/city-icon/bursa',
    apple: '/api/city-icon/bursa',
  },
  title: 'Bursa Metro Memory',
  description: 'How many Bursaray stations can you name from memory?',
  openGraph: {
    title: 'Bursa Metro Memory',
    description: 'How many Bursaray stations can you name from memory?',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://metro-memory.xyz/europe/turkey/bursa',
  },
})
