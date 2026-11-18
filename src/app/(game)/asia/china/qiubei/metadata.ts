import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('qiubei', {
  icons: {
    icon: '/api/city-icon/qiubei',
    apple: '/api/city-icon/qiubei',
  },
  title: 'Qiubei Metro Memory',
  description: 'How many of the Qiubei rail transit stations can you name from memory?',
  openGraph: {
    title: 'Qiubei Metro Memory',
    description: 'How many of the Qiubei rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/qiubei',
  },
})
