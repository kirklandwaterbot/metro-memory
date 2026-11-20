import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kochi', {
  icons: {
    icon: '/api/city-icon/kochi',
    apple: '/api/city-icon/kochi',
  },
  title: 'Kochi Metro Memory',
  description: 'How many Kochi Metro stations can you name from memory?',
  openGraph: {
    title: 'Kochi Metro Memory',
    description: 'How many Kochi Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/kochi',
  },
})
