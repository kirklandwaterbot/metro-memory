import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('xian', {
  icons: {
    icon: '/api/city-icon/xian',
    apple: '/api/city-icon/xian',
  },
  title: 'Xi\'an Metro Memory',
  description: 'How many of the Xi\'an rail transit stations can you name from memory?',
  openGraph: {
    title: 'Xi\'an Metro Memory',
    description: 'How many of the Xi\'an rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/xian',
  },
})
