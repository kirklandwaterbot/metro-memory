import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tianshui', {
  icons: {
    icon: '/api/city-icon/tianshui',
    apple: '/api/city-icon/tianshui',
  },
  title: 'Tianshui Metro Memory',
  description: 'How many of the Tianshui rail transit stations can you name from memory?',
  openGraph: {
    title: 'Tianshui Metro Memory',
    description: 'How many of the Tianshui rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/tianshui',
  },
})
