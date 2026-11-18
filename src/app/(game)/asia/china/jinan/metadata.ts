import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('jinan', {
  icons: {
    icon: '/api/city-icon/jinan',
    apple: '/api/city-icon/jinan',
  },
  title: 'Jinan Metro Memory',
  description: 'How many of the Jinan rail transit stations can you name from memory?',
  openGraph: {
    title: 'Jinan Metro Memory',
    description: 'How many of the Jinan rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/jinan',
  },
})
