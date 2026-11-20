import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('chengdu', {
  icons: {
    icon: '/api/city-icon/chengdu',
    apple: '/api/city-icon/chengdu',
  },
  title: 'Chengdu–Dujiangyan Metro Memory',
  description: 'How many of the Chengdu–Dujiangyan rail transit stations can you name from memory?',
  openGraph: {
    title: 'Chengdu–Dujiangyan Metro Memory',
    description: 'How many of the Chengdu–Dujiangyan rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/chengdu',
  },
})
