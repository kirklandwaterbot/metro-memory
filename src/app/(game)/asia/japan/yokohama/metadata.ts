import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yokohama', {
  icons: {
    icon: '/api/city-icon/yokohama',
    apple: '/api/city-icon/yokohama',
  },
  title: 'Yokohama Metros Memory',
  description: 'How many Yokohama Metros stations can you name from memory?',
  openGraph: {
    title: 'Yokohama Metros Memory',
    description: 'How many Yokohama Metros stations can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/yokohama',
  },
})
