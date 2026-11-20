import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bengaluru', {
  icons: {
    icon: '/api/city-icon/bengaluru',
    apple: '/api/city-icon/bengaluru',
  },
  title: 'Namma Metro Memory',
  description: 'How many Namma Metro stations can you name from memory?',
  openGraph: {
    title: 'Namma Metro Memory',
    description: 'How many Namma Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/bengaluru',
  },
})
