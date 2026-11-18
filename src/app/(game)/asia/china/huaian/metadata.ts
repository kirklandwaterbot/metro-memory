import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('huaian', {
  icons: {
    icon: '/api/city-icon/huaian',
    apple: '/api/city-icon/huaian',
  },
  title: 'Huai\'an Metro Memory',
  description: 'How many of the Huai\'an rail transit stations can you name from memory?',
  openGraph: {
    title: 'Huai\'an Metro Memory',
    description: 'How many of the Huai\'an rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/huaian',
  },
})
