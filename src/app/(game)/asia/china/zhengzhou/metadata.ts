import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('zhengzhou', {
  icons: {
    icon: '/api/city-icon/zhengzhou',
    apple: '/api/city-icon/zhengzhou',
  },
  title: 'Zhengzhou Metro Memory',
  description: 'How many of the Zhengzhou rail transit stations can you name from memory?',
  openGraph: {
    title: 'Zhengzhou Metro Memory',
    description: 'How many of the Zhengzhou rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/zhengzhou',
  },
})
