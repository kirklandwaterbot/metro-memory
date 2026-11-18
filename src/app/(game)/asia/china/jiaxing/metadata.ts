import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('jiaxing', {
  icons: {
    icon: '/api/city-icon/jiaxing',
    apple: '/api/city-icon/jiaxing',
  },
  title: 'Jiaxing Metro Memory',
  description: 'How many of the Jiaxing rail transit stations can you name from memory?',
  openGraph: {
    title: 'Jiaxing Metro Memory',
    description: 'How many of the Jiaxing rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/jiaxing',
  },
})
