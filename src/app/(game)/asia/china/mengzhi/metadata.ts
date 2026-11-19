import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('mengzhi', {
  icons: {
    icon: '/api/city-icon/mengzhi',
    apple: '/api/city-icon/mengzhi',
  },
  title: 'Mengzi Metro Memory',
  description: 'How many of the Mengzi rail transit stations can you name from memory?',
  openGraph: {
    title: 'Mengzi Metro Memory',
    description: 'How many of the Mengzi rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/mengzhi',
  },
})
