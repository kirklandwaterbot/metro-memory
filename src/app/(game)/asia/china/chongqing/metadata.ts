import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('chongqing', {
  icons: {
    icon: '/api/city-icon/chongqing',
    apple: '/api/city-icon/chongqing',
  },
  title: 'Chongqing Metro Memory',
  description: 'How many of the Chongqing rail transit stations can you name from memory?',
  openGraph: {
    title: 'Chongqing Metro Memory',
    description: 'How many of the Chongqing rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/chongqing',
  },
})
