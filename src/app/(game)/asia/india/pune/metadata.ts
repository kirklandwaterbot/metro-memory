import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('pune', {
  icons: {
    icon: '/api/city-icon/pune',
    apple: '/api/city-icon/pune',
  },
  title: 'Pune Metro Memory',
  description: 'How many Pune Metro stations can you name from memory?',
  openGraph: {
    title: 'Pune Metro Memory',
    description: 'How many Pune Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/pune',
  },
})
