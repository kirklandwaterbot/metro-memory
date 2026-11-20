import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nagpur', {
  icons: {
    icon: '/api/city-icon/nagpur',
    apple: '/api/city-icon/nagpur',
  },
  title: 'Nagpur Metro Memory',
  description: 'How many Nagpur Metro stations can you name from memory?',
  openGraph: {
    title: 'Nagpur Metro Memory',
    description: 'How many Nagpur Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/nagpur',
  },
})
