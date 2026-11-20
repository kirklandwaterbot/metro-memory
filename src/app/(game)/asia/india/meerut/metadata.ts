import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('meerut', {
  icons: {
    icon: '/api/city-icon/meerut',
    apple: '/api/city-icon/meerut',
  },
  title: 'Meerut Metro Memory',
  description: 'How many Meerut Metro stations can you name from memory?',
  openGraph: {
    title: 'Meerut Metro Memory',
    description: 'How many Meerut Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/meerut',
  },
})
