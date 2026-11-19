import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('qingdao', {
  icons: {
    icon: '/api/city-icon/qingdao',
    apple: '/api/city-icon/qingdao',
  },
  title: 'Qingdao Metro Memory',
  description: 'How many of the Qingdao rail transit stations can you name from memory?',
  openGraph: {
    title: 'Qingdao Metro Memory',
    description: 'How many of the Qingdao rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/qingdao',
  },
})
