import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lucknow', {
  icons: {
    icon: '/api/city-icon/lucknow',
    apple: '/api/city-icon/lucknow',
  },
  title: 'Lucknow Metro Memory',
  description: 'How many Lucknow Metro stations can you name from memory?',
  openGraph: {
    title: 'Lucknow Metro Memory',
    description: 'How many Lucknow Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/lucknow',
  },
})
