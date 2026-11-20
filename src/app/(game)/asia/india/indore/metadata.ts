import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('indore', {
  icons: {
    icon: '/api/city-icon/indore',
    apple: '/api/city-icon/indore',
  },
  title: 'Indore Metro Memory',
  description: 'How many Indore Metro stations can you name from memory?',
  openGraph: {
    title: 'Indore Metro Memory',
    description: 'How many Indore Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/indore',
  },
})
