import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yinchuan', {
  icons: {
    icon: '/api/city-icon/yinchuan',
    apple: '/api/city-icon/yinchuan',
  },
  title: 'Yinchuan Monorail Memory',
  description: 'How many stations of the Yinchuan Flower Expo Park monorail can you name from memory?',
  openGraph: {
    title: 'Yinchuan Monorail Memory',
    description: 'How many stations of the Yinchuan Flower Expo Park monorail can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/yinchuan',
  },
})
