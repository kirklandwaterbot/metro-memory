import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('zhangjiakou', {
  icons: {
    icon: '/api/city-icon/zhangjiakou',
    apple: '/api/city-icon/zhangjiakou',
  },
  title: 'Zhangjiakou Tram Memory',
  description: 'How many stops of the Chongli Taizicheng tram can you name from memory?',
  openGraph: {
    title: 'Zhangjiakou Tram Memory',
    description: 'How many stops of the Chongli Taizicheng tram can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/zhangjiakou',
  },
})
