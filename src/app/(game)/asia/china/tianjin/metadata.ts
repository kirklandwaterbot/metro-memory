import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tianjin', {
  icons: {
    icon: '/api/city-icon/tianjin',
    apple: '/api/city-icon/tianjin',
  },
  title: 'Tianjin Metro Memory',
  description: 'How many of the Tianjin rail transit stations can you name from memory?',
  openGraph: {
    title: 'Tianjin Metro Memory',
    description: 'How many of the Tianjin rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/tianjin',
  },
})
